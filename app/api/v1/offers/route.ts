import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { verifyApiKey, hasScope } from '@/lib/events/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/offers?status=<draft|sent|signed|paid>&customer_email=<>&limit=50
 * Scope: offers:read or *
 */
export async function GET(req: NextRequest) {
  const ctx = await verifyApiKey(req.headers.get('authorization'))
  if (!ctx) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  if (!hasScope(ctx, 'offers:read')) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })

  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  const email = url.searchParams.get('customer_email')
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10) || 50, 200)

  const conditions: ReturnType<typeof sql>[] = []
  if (status) conditions.push(sql`status = ${status}::offer_status`)
  if (email) conditions.push(sql`customer_email = ${email}`)
  const where = conditions.length > 0 ? sql`WHERE ${sql.join(conditions, sql` AND `)}` : sql``

  try {
    const rows = await db.execute(sql`
      SELECT id, offer_number, customer_name, customer_company, customer_email,
             title, status, valid_from::text as valid_from, valid_until::text as valid_until,
             selected_pricing_option, signed_at::text as signed_at, paid_at::text as paid_at,
             created_at::text as created_at, updated_at::text as updated_at
      FROM offers
      ${where}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `)
    return NextResponse.json({ ok: true, offers: rows })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : 'unknown' }, { status: 500 })
  }
}
