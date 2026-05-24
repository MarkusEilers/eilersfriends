import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { verifyApiKey, hasScope } from '@/lib/events/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/frameworks?status=<published|draft>&limit=50
 * Scope: frameworks:read or *
 */
export async function GET(req: NextRequest) {
  const ctx = await verifyApiKey(req.headers.get('authorization'))
  if (!ctx) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  if (!hasScope(ctx, 'frameworks:read')) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })

  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10) || 50, 200)

  const where = status ? sql`WHERE status = ${status}` : sql``
  try {
    const rows = await db.execute(sql`
      SELECT id, slug, title, status, locale, accent_color, card_meta,
             meta_description, created_at::text as created_at, updated_at::text as updated_at
      FROM landing_pages
      ${where}
      ORDER BY updated_at DESC
      LIMIT ${limit}
    `)
    return NextResponse.json({ ok: true, frameworks: rows })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : 'unknown' }, { status: 500 })
  }
}
