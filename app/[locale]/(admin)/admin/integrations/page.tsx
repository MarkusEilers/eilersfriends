import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { IntegrationsManager } from '@/components/admin/IntegrationsManager'

export const dynamic = 'force-dynamic'

interface WebhookRow extends Record<string, unknown> {
  id: string
  name: string
  url: string
  event_types: unknown
  active: boolean
  last_delivery_at: string | null
  last_delivery_status: string | null
  total_delivered: number
  total_failed: number
  notes: string | null
}
interface ApiKeyRow extends Record<string, unknown> {
  id: string
  name: string
  prefix: string
  scopes: unknown
  active: boolean
  last_used_at: string | null
  created_at: string
  expires_at: string | null
}
interface EventRow extends Record<string, unknown> {
  id: string
  category: string
  type: string
  source: string
  occurred_at: string
}

async function ensureSchema() {
  await db.execute(sql`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_category') THEN
        CREATE TYPE event_category AS ENUM ('subscriber','framework','offer','member','community','system');
      END IF;
    END $$
  `).catch(() => {})
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
  `).catch(() => {})
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
  `).catch(() => {})
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
  `).catch(() => {})
}

export default async function AdminIntegrationsPage() {
  await ensureSchema()

  const subsRes = await db.execute<WebhookRow>(sql`
    SELECT id, name, url, event_types, active, last_delivery_at::text as last_delivery_at,
           last_delivery_status, total_delivered, total_failed, notes
    FROM webhook_subscriptions
    ORDER BY created_at DESC
  `).catch(() => [] as unknown as WebhookRow[])

  const keysRes = await db.execute<ApiKeyRow>(sql`
    SELECT id, name, prefix, scopes, active, last_used_at::text as last_used_at,
           created_at::text as created_at, expires_at::text as expires_at
    FROM api_keys
    ORDER BY created_at DESC
  `).catch(() => [] as unknown as ApiKeyRow[])

  const eventsRes = await db.execute<EventRow>(sql`
    SELECT id, category, type, source, occurred_at::text as occurred_at
    FROM events
    ORDER BY occurred_at DESC
    LIMIT 20
  `).catch(() => [] as unknown as EventRow[])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
        <p className="mt-1 text-sm text-gray-500">
          Event-Webhooks rein und raus · API-Keys für Public REST + MCP · Event-Stream live mitlesen.
        </p>
      </div>
      <IntegrationsManager
        webhooks={subsRes as unknown as WebhookRow[]}
        apiKeys={keysRes as unknown as ApiKeyRow[]}
        recentEvents={eventsRes as unknown as EventRow[]}
      />
    </div>
  )
}
