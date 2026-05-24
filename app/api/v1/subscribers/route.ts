import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { verifyApiKey, hasScope } from '@/lib/events/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/subscribers?email=<>&source=<>&limit=100
 * Scope: subscribers:read or *
 */
export async function GET(req: NextRequest) {
  const ctx = await verifyApiKey(req.headers.get('authorization'))
  if (!ctx) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  if (!hasScope(ctx, 'subscribers:read')) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })

  const url = new URL(req.url)
  const email = url.searchParams.get('email')
  const source = url.searchParams.get('source')
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10) || 50, 200)

  const conditions: ReturnType<typeof sql>[] = []
  if (email) conditions.push(sql`email = ${email}`)
  if (source) conditions.push(sql`source = ${source}`)
  const where = conditions.length > 0 ? sql`WHERE ${sql.join(conditions, sql` AND `)}` : sql``

  try {
    // Self-heal: subscribers table may not exist yet on fresh installs
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS subscribers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL,
        first_name VARCHAR(128),
        source VARCHAR(64),
        confirmed BOOLEAN DEFAULT false NOT NULL,
        confirmed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT now() NOT NULL
      )
    `).catch(() => {})

    const rows = await db.execute(sql`
      SELECT id, email, first_name, source, confirmed, confirmed_at::text as confirmed_at, created_at::text as created_at
      FROM subscribers
      ${where}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `)
    return NextResponse.json({ ok: true, subscribers: rows })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : 'unknown' }, { status: 500 })
  }
}
