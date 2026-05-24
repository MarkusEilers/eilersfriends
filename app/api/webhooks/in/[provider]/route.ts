import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { emit } from '@/lib/events/emit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Generic Incoming-Webhook-Endpoint.
 * `/api/webhooks/in/[provider]` empfängt Events von externen Tools
 * und parst sie in unser Schema. Auth via Provider-spezifische Signatur
 * oder shared-secret in `?secret=` Query-Param.
 *
 * Eingebaute Provider:
 * - beehiiv: Newsletter-Subscriptions (subscriber.created, subscriber.confirmed, subscriber.unsubscribed)
 * - resend: Email-Delivery-Status (email.delivered, email.opened, email.clicked, email.bounced)
 * - hubspot: CRM-Sync (contact.creation, deal.creation, deal.propertyChange)
 * - custom: Generic shared-secret auth — payload geht 1:1 als Event durch
 */

interface IncomingEvent {
  category: 'subscriber' | 'framework' | 'offer' | 'member' | 'community' | 'system'
  type: string
  payload: Record<string, unknown>
  idempotencyKey?: string
}

function verifyBeehiivSignature(body: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(`sha256=${expected}`))
}

function parseBeehiiv(payload: Record<string, unknown>): IncomingEvent | null {
  const eventType = String(payload.event ?? payload.type ?? '')
  const data = (payload.data ?? payload) as Record<string, unknown>
  const email = String(data.email ?? '')
  const id = String(data.id ?? data.subscription_id ?? '')

  if (eventType === 'subscription.confirmed' || eventType === 'subscriber.confirmed') {
    return {
      category: 'subscriber',
      type: 'subscriber.confirmed',
      payload: { email, source: 'beehiiv', externalId: id, raw: data },
      idempotencyKey: `beehiiv:confirmed:${id || email}`,
    }
  }
  if (eventType === 'subscription.unsubscribed' || eventType === 'subscriber.unsubscribed') {
    return {
      category: 'subscriber',
      type: 'subscriber.unsubscribed',
      payload: { email, source: 'beehiiv', externalId: id, raw: data },
      idempotencyKey: `beehiiv:unsubscribed:${id || email}`,
    }
  }
  if (eventType === 'subscription.created') {
    return {
      category: 'subscriber',
      type: 'subscriber.signed_up',
      payload: { email, source: 'beehiiv', externalId: id, raw: data },
      idempotencyKey: `beehiiv:created:${id || email}`,
    }
  }
  return null
}

function parseResend(payload: Record<string, unknown>): IncomingEvent | null {
  // Resend sendet Events mit type wie 'email.delivered', 'email.opened', etc.
  const type = String(payload.type ?? '')
  if (!type.startsWith('email.')) return null
  const data = (payload.data ?? {}) as Record<string, unknown>
  return {
    category: 'system',
    type, // 'email.delivered', 'email.opened', 'email.clicked', 'email.bounced'
    payload: { ...data, raw: payload },
    idempotencyKey: `resend:${type}:${data.email_id ?? ''}:${payload.created_at ?? ''}`,
  }
}

function parseHubSpot(payload: Record<string, unknown>): IncomingEvent | null {
  const subscriptionType = String(payload.subscriptionType ?? '')
  const objectId = String(payload.objectId ?? '')
  if (subscriptionType === 'contact.creation') {
    return {
      category: 'subscriber',
      type: 'subscriber.crm_created',
      payload: { externalId: objectId, source: 'hubspot', raw: payload },
      idempotencyKey: `hubspot:contact:${objectId}`,
    }
  }
  if (subscriptionType.startsWith('deal.')) {
    return {
      category: 'offer',
      type: `offer.crm_${subscriptionType.split('.')[1]}`,
      payload: { externalId: objectId, source: 'hubspot', raw: payload },
      idempotencyKey: `hubspot:deal:${objectId}:${payload.changeFlag ?? ''}`,
    }
  }
  return null
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params
  const rawBody = await req.text()
  const url = new URL(req.url)
  const querySecret = url.searchParams.get('secret')

  let payload: Record<string, unknown>
  try { payload = JSON.parse(rawBody) } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  let parsed: IncomingEvent | null = null

  if (provider === 'beehiiv') {
    const secret = process.env.BEEHIIV_WEBHOOK_SECRET
    if (secret) {
      const sig = req.headers.get('x-beehiiv-signature') || req.headers.get('beehiiv-signature')
      if (!verifyBeehiivSignature(rawBody, sig, secret)) {
        return NextResponse.json({ ok: false, error: 'invalid_signature' }, { status: 401 })
      }
    }
    parsed = parseBeehiiv(payload)
  } else if (provider === 'resend') {
    // Resend uses svix signing — we accept if shared secret in query matches
    const expected = process.env.RESEND_WEBHOOK_SECRET
    if (expected && querySecret !== expected) {
      return NextResponse.json({ ok: false, error: 'invalid_secret' }, { status: 401 })
    }
    parsed = parseResend(payload)
  } else if (provider === 'hubspot') {
    // HubSpot uses application-secret signature — simplified to shared-secret for now
    const expected = process.env.HUBSPOT_WEBHOOK_SECRET
    if (expected && querySecret !== expected) {
      return NextResponse.json({ ok: false, error: 'invalid_secret' }, { status: 401 })
    }
    parsed = parseHubSpot(payload)
  } else if (provider === 'custom') {
    const expected = process.env.CUSTOM_WEBHOOK_SECRET
    if (!expected || querySecret !== expected) {
      return NextResponse.json({ ok: false, error: 'invalid_secret' }, { status: 401 })
    }
    parsed = {
      category: (payload.category as IncomingEvent['category']) ?? 'system',
      type: String(payload.type ?? 'custom.event'),
      payload: (payload.payload as Record<string, unknown>) ?? payload,
      idempotencyKey: payload.idempotencyKey ? String(payload.idempotencyKey) : undefined,
    }
  } else {
    return NextResponse.json({ ok: false, error: `unknown_provider:${provider}` }, { status: 404 })
  }

  if (!parsed) {
    // Provider recognized but event-type unbekannt — bestätige mit 200, sonst retried der Provider
    return NextResponse.json({ ok: true, ignored: true, provider })
  }

  const result = await emit({
    category: parsed.category,
    type: parsed.type,
    payload: parsed.payload,
    source: `webhook-in:${provider}`,
    idempotencyKey: parsed.idempotencyKey,
  })

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 })
  }
  return NextResponse.json({ ok: true, eventId: result.id })
}
