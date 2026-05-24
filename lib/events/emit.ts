import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

/**
 * Domain-Event-Schema (Wave 9 · Event-API).
 * Source-of-truth für alles, was nach draußen (Webhooks) oder
 * nach innen (Analytics, AI-Co-Pilot) kommuniziert wird.
 */

export type EventCategory =
  | 'subscriber' | 'framework' | 'offer' | 'member' | 'community' | 'system'

export interface EventInput {
  category: EventCategory
  type: string                 // z.B. 'subscriber.confirmed'
  payload?: Record<string, unknown>
  source: string               // z.B. 'newsletter-api', 'stripe-webhook'
  actorUserId?: string | null
  frameworkSlug?: string | null
  offerId?: string | null
  companyId?: string | null
  /** Idempotency-Key — gleicher Key = gleiches logisches Event, deduped via UNIQUE */
  idempotencyKey?: string
}

let schemaEnsured = false
async function ensureEventSchema() {
  if (schemaEnsured) return
  try {
    // Self-healing schema (idempotent ALTER TABLE)
    await db.execute(sql`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_category') THEN
          CREATE TYPE event_category AS ENUM ('subscriber','framework','offer','member','community','system');
        END IF;
      END $$
    `)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category event_category NOT NULL,
        type VARCHAR(64) NOT NULL,
        payload JSONB DEFAULT '{}'::jsonb NOT NULL,
        source VARCHAR(64) NOT NULL,
        actor_user_id UUID,
        framework_slug VARCHAR(64),
        offer_id UUID,
        company_id UUID,
        idempotency_key VARCHAR(128) UNIQUE,
        occurred_at TIMESTAMPTZ DEFAULT now() NOT NULL
      )
    `)
    await db.execute(sql`CREATE INDEX IF NOT EXISTS events_type_idx ON events (type)`)
    await db.execute(sql`CREATE INDEX IF NOT EXISTS events_occurred_at_idx ON events (occurred_at DESC)`)
    await db.execute(sql`CREATE INDEX IF NOT EXISTS events_category_idx ON events (category)`)

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS webhook_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(128) NOT NULL,
        url TEXT NOT NULL,
        event_types JSONB DEFAULT '[]'::jsonb NOT NULL,
        secret VARCHAR(64) NOT NULL,
        active BOOLEAN DEFAULT true NOT NULL,
        last_delivery_at TIMESTAMPTZ,
        last_delivery_status VARCHAR(16),
        total_delivered INTEGER DEFAULT 0 NOT NULL,
        total_failed INTEGER DEFAULT 0 NOT NULL,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
      )
    `)

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS webhook_deliveries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        subscription_id UUID NOT NULL REFERENCES webhook_subscriptions(id) ON DELETE CASCADE,
        event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        status_code INTEGER,
        response_body TEXT,
        response_time_ms INTEGER,
        attempt_number INTEGER DEFAULT 1 NOT NULL,
        result VARCHAR(16) NOT NULL,
        error_message TEXT,
        delivered_at TIMESTAMPTZ DEFAULT now() NOT NULL
      )
    `)
    await db.execute(sql`CREATE INDEX IF NOT EXISTS webhook_deliveries_subscription_idx ON webhook_deliveries (subscription_id)`)
    await db.execute(sql`CREATE INDEX IF NOT EXISTS webhook_deliveries_event_idx ON webhook_deliveries (event_id)`)

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS api_keys (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(128) NOT NULL,
        prefix VARCHAR(16) UNIQUE NOT NULL,
        token_hash VARCHAR(64) NOT NULL,
        scopes JSONB DEFAULT '[]'::jsonb NOT NULL,
        active BOOLEAN DEFAULT true NOT NULL,
        last_used_at TIMESTAMPTZ,
        created_by UUID,
        created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
        expires_at TIMESTAMPTZ
      )
    `)
    schemaEnsured = true
  } catch (err) {
    console.error('[events/emit] ensureEventSchema failed', err)
  }
}

/**
 * Zentrale Emit-Funktion. Schreibt das Event idempotent in die DB.
 * Bei Idempotency-Key-Duplikat wird stillschweigend ignoriert.
 *
 * Outgoing-Webhook-Delivery passiert NICHT synchron hier —
 * der /api/webhooks/deliver-Cron pollt neue Events und sendet sie.
 */
export async function emit(event: EventInput): Promise<{ ok: true; id?: string } | { ok: false; error: string }> {
  await ensureEventSchema()
  try {
    const rows = await db.execute<{ id: string }>(sql`
      INSERT INTO events (category, type, payload, source, actor_user_id, framework_slug, offer_id, company_id, idempotency_key)
      VALUES (
        ${event.category}::event_category,
        ${event.type},
        ${JSON.stringify(event.payload ?? {})}::jsonb,
        ${event.source},
        ${event.actorUserId ?? null},
        ${event.frameworkSlug ?? null},
        ${event.offerId ?? null},
        ${event.companyId ?? null},
        ${event.idempotencyKey ?? null}
      )
      ON CONFLICT (idempotency_key) DO NOTHING
      RETURNING id
    `)
    const arr = rows as unknown as { id: string }[]
    return { ok: true, id: arr[0]?.id }
  } catch (err) {
    console.error('[events/emit] insert failed', err, { type: event.type })
    return { ok: false, error: err instanceof Error ? err.message : 'unknown' }
  }
}

/**
 * Helper: fire-and-forget emit. Loggt Fehler, wirft sie aber nicht weiter.
 * Für use-cases wo der Event-Emit kein blocker sein darf (z.B. Stripe-Webhook,
 * Wizard-Schritt-Abschluss).
 */
export function emitAsync(event: EventInput): void {
  emit(event).catch((err) => {
    console.error('[events/emitAsync] background emit failed', err)
  })
}
