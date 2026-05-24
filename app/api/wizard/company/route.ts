import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { ensureCompanyProfile } from '@/lib/db/self-heal'

export const runtime = 'nodejs'

function rowsOf<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[]
  if (r && typeof r === 'object' && 'rows' in r) {
    const x = (r as { rows: unknown }).rows
    if (Array.isArray(x)) return x as T[]
  }
  return []
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await ensureCompanyProfile()
  const rows = await db.execute(sql`
    SELECT organisation_name, website, summary, value_proposition, target_audience,
           tone, keywords, brand_color, accent_color, products, industry, last_analysed_at
    FROM company_profile WHERE user_id = ${session.user.id} LIMIT 1
  `)
  const list = rowsOf<Record<string, unknown>>(rows)
  return NextResponse.json({ ok: true, profile: list[0] ?? null })
}
