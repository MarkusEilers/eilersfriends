import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import crypto from 'crypto'

/**
 * Webhook-Delivery — wird vom Cron `/api/cron/webhook-deliver` aufgerufen.
 * Polls neue Events seit dem letzten Delivery-Marker und sendet sie an alle
 * aktiven Subscriptions, deren event_types matchen.
 *
 * Signatur-Format: 'X-EF-Signature: sha256=<hex>' — kompatibel mit GitHub/Stripe-Style.
 */

interface Subscription extends Record<string, unknown> {
  id: string
  name: string
  url: string
  event_types: string[] | unknown
  secret: string
  active: boolean
}

interface PendingEvent extends Record<string, unknown> {
  id: string
  category: string
  type: string
  payload: Record<string, unknown>
  source: string
  occurred_at: string
}

function matchesTypes(subscriptionTypes: unknown, eventType: string): boolean {
  if (!Array.isArray(subscriptionTypes) || subscriptionTypes.length === 0) return false
  for (const t of subscriptionTypes as string[]) {
    if (t === '*') return true
    if (t === eventType) return true
    // Wildcard support: 'offer.*' matches 'offer.signed'
    if (t.endsWith('.*') && eventType.startsWith(t.slice(0, -1))) return true
  }
  return false
}

function hmacSign(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

async function deliverOne(sub: Subscription, event: PendingEvent): Promise<{ ok: boolean; status?: number; body?: string; ms: number; err?: string }> {
  const payload = JSON.stringify({
    event_id: event.id,
    event_type: event.type,
    category: event.category,
    occurred_at: event.occurred_at,
    source: event.source,
    payload: event.payload,
  })
  const signature = hmacSign(payload, sub.secret)
  const t0 = Date.now()
  try {
    const res = await fetch(sub.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'EilersFriends-Webhook/1.0',
        'X-EF-Signature': `sha256=${signature}`,
        'X-EF-Event-Type': event.type,
        'X-EF-Event-Id': event.id,
      },
      body: payload,
      signal: AbortSignal.timeout(10_000),
    })
    const body = await res.text().catch(() => '')
    return { ok: res.ok, status: res.status, body: body.slice(0, 500), ms: Date.now() - t0 }
  } catch (err) {
    return { ok: false, ms: Date.now() - t0, err: err instanceof Error ? err.message : 'unknown' }
  }
}

export async function deliverPendingWebhooks(opts: { maxBatch?: number } = {}): Promise<{ delivered: number; failed: number; subs: number }> {
  const maxBatch = opts.maxBatch ?? 50

  // Active subscriptions
  const subRes = await db.execute<Subscription>(sql`
    SELECT id, name, url, event_types, secret, active
    FROM webhook_subscriptions
    WHERE active = true
  `)
  const subscriptions = (subRes as unknown as Subscription[])
  if (subscriptions.length === 0) return { delivered: 0, failed: 0, subs: 0 }

  // Pending events = Events without a webhook_deliveries row for each active subscription
  // Simpler model: pick last N events that haven't been delivered to a specific sub
  let delivered = 0
  let failed = 0

  // Backoff in Minuten: 1m, 5m, 25m, 2h, 12h. Bei >= 5 versuchen wird als 'fail' markiert.
  const RETRY_BACKOFF_MIN = [1, 5, 25, 120, 720]
  const MAX_ATTEMPTS = RETRY_BACKOFF_MIN.length + 1   // 6 attempts total before giving up

  for (const sub of subscriptions) {
    // 1) Neue Events ohne irgendeinen Delivery-Versuch
    const newRes = await db.execute<PendingEvent>(sql`
      SELECT e.id, e.category, e.type, e.payload, e.source, e.occurred_at::text as occurred_at
      FROM events e
      WHERE NOT EXISTS (
        SELECT 1 FROM webhook_deliveries d
        WHERE d.subscription_id = ${sub.id} AND d.event_id = e.id
      )
      ORDER BY e.occurred_at ASC
      LIMIT ${maxBatch}
    `)

    // 2) Retry-Kandidaten: letzte Delivery war 'retry' UND Backoff-Zeit ist um
    const retryRes = await db.execute<PendingEvent & { last_attempt: number; last_delivered_at: string }>(sql`
      SELECT e.id, e.category, e.type, e.payload, e.source, e.occurred_at::text as occurred_at,
             d.attempt_number as last_attempt, d.delivered_at::text as last_delivered_at
      FROM webhook_deliveries d
      JOIN events e ON e.id = d.event_id
      WHERE d.subscription_id = ${sub.id}
        AND d.result = 'retry'
        AND d.attempt_number < ${MAX_ATTEMPTS}
        AND d.id = (
          SELECT id FROM webhook_deliveries
          WHERE subscription_id = ${sub.id} AND event_id = e.id
          ORDER BY attempt_number DESC LIMIT 1
        )
      ORDER BY d.delivered_at ASC
      LIMIT 25
    `)
    const retryRaw = retryRes as unknown as (PendingEvent & { last_attempt: number; last_delivered_at: string })[]
    const now = Date.now()
    const retries = retryRaw.filter((r) => {
      const backoffMin = RETRY_BACKOFF_MIN[Math.min(r.last_attempt - 1, RETRY_BACKOFF_MIN.length - 1)] ?? 720
      const elapsed = (now - new Date(r.last_delivered_at).getTime()) / 60_000
      return elapsed >= backoffMin
    })

    const pending: (PendingEvent & { _attempt?: number })[] = [
      ...(newRes as unknown as PendingEvent[]),
      ...retries.map((r) => ({ ...r, _attempt: r.last_attempt + 1 })),
    ]

    for (const event of pending) {
      if (!matchesTypes(sub.event_types, event.type)) {
        // Mark as 'skipped' so we don't reprocess — insert a delivery row with result='skipped'
        await db.execute(sql`
          INSERT INTO webhook_deliveries (subscription_id, event_id, result, status_code, response_time_ms)
          VALUES (${sub.id}, ${event.id}, 'skipped', 0, 0)
        `)
        continue
      }
      const attemptNumber = (event as PendingEvent & { _attempt?: number })._attempt ?? 1
      const res = await deliverOne(sub, event)
      const isRetryable = !res.ok && (res.status && res.status >= 500 || !res.status)
      const reachedMaxAttempts = attemptNumber >= MAX_ATTEMPTS
      const result = res.ok ? 'ok' : (isRetryable && !reachedMaxAttempts ? 'retry' : 'fail')
      await db.execute(sql`
        INSERT INTO webhook_deliveries (
          subscription_id, event_id, status_code, response_body, response_time_ms,
          attempt_number, result, error_message
        ) VALUES (
          ${sub.id}, ${event.id}, ${res.status ?? null}, ${res.body ?? null}, ${res.ms},
          ${attemptNumber}, ${result}, ${res.err ?? null}
        )
      `)
      // Update subscription counters
      if (res.ok) {
        delivered++
        await db.execute(sql`
          UPDATE webhook_subscriptions
          SET total_delivered = total_delivered + 1,
              last_delivery_at = now(),
              last_delivery_status = 'ok',
              updated_at = now()
          WHERE id = ${sub.id}
        `)
      } else {
        failed++
        await db.execute(sql`
          UPDATE webhook_subscriptions
          SET total_failed = total_failed + 1,
              last_delivery_at = now(),
              last_delivery_status = ${result},
              updated_at = now()
          WHERE id = ${sub.id}
        `)
      }
    }
  }

  return { delivered, failed, subs: subscriptions.length }
}
