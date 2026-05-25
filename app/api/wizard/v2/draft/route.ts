import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { ensureBauplanV2Tables } from '@/lib/db/self-heal-v2'

export const runtime = 'nodejs'

function rowsOf<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[]
  if (r && typeof r === 'object' && 'rows' in r) {
    const x = (r as { rows: unknown }).rows
    if (Array.isArray(x)) return x as T[]
  }
  return []
}

// GET: get-or-create the user's current draft for product_slug=b2b-angebote
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await ensureBauplanV2Tables()

  const existing = rowsOf<Record<string, unknown>>(
    await db.execute(sql`
      SELECT id, user_id, product_slug, title, language, current_step_key,
             total_points, maximum_budget, published_at, pdf_bauplan_url, pdf_onepager_url,
             created_at, updated_at
      FROM bauplan_drafts
      WHERE user_id = ${session.user.id} AND product_slug = 'b2b-angebote'
      ORDER BY created_at DESC LIMIT 1
    `)
  )
  if (existing.length > 0) return NextResponse.json({ ok: true, draft: existing[0] })

  // Create new
  const created = rowsOf<Record<string, unknown>>(
    await db.execute(sql`
      INSERT INTO bauplan_drafts (user_id) VALUES (${session.user.id})
      RETURNING id, user_id, product_slug, title, language, current_step_key,
                total_points, created_at, updated_at
    `)
  )
  return NextResponse.json({ ok: true, draft: created[0] ?? null })
}
