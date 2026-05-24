import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { verifyApiKey, hasScope } from '@/lib/events/auth'
import { emit, type EventCategory } from '@/lib/events/emit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/events?since=<iso>&type=<filter>&limit=100
 * Scope: events:read or *
 *
 * POST /api/v1/events  { category, type, payload, source?, idempotencyKey? }
 * Scope: events:write or *
 *
 * Beide brauchen Bearer-Token-Auth.
 */

export async function GET(req: NextRequest) {
  const ctx = await verifyApiKey(req.headers.get('authorization'))
  if (!ctx) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  if (!hasScope(ctx, 'events:read')) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })

  const url = new URL(req.url)
  const since = url.searchParams.get('since')           // ISO timestamp
  const type = url.searchParams.get('type')             // exact or 'prefix.*'
  const category = url.searchParams.get('category')
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10) || 100, 500)

  const conditions: ReturnType<typeof sql>[] = []
  if (since) conditions.push(sql`occurred_at >= ${since}::timestamptz`)
  if (type) {
    if (type.endsWith('.*')) {
      conditions.push(sql`type LIKE ${type.slice(0, -1) + '%'}`)
    } else {
      conditions.push(sql`type = ${type}`)
    }
  }
  if (category) conditions.push(sql`category = ${category}::event_category`)

  const where = conditions.length > 0 ? sql`WHERE ${sql.join(conditions, sql` AND `)}` : sql``

  try {
    const rows = await db.execute(sql`
      SELECT id, category, type, payload, source, occurred_at::text as occurred_at,
             actor_user_id, framework_slug, offer_id, company_id
      FROM events
      ${where}
      ORDER BY occurred_at DESC
      LIMIT ${limit}
    `)
    return NextResponse.json({ ok: true, events: rows })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : 'unknown' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const ctx = await verifyApiKey(req.headers.get('authorization'))
  if (!ctx) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  if (!hasScope(ctx, 'events:write')) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })

  let body: { category: EventCategory; type: string; payload?: Record<string, unknown>; source?: string; idempotencyKey?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }
  if (!body.category || !body.type) {
    return NextResponse.json({ ok: false, error: 'category_and_type_required' }, { status: 400 })
  }

  const result = await emit({
    category: body.category,
    type: body.type,
    payload: body.payload ?? {},
    source: body.source ?? `api:${ctx.name}`,
    idempotencyKey: body.idempotencyKey,
  })
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 })
  }
  return NextResponse.json({ ok: true, id: result.id })
}
