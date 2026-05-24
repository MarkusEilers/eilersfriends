import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { ensureCompanyProfile } from '@/lib/db/self-heal'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await ensureCompanyProfile()

  const body = await request.json().catch(() => ({}))
  const {
    organisationName, website, summary, valueProposition, targetAudience,
    tone, keywords, brandColor, accentColor, products, industry,
  } = body as Record<string, unknown>

  await db.execute(sql`
    INSERT INTO company_profile (
      user_id, organisation_name, website, summary, value_proposition,
      target_audience, tone, keywords, brand_color, accent_color, products, industry, last_analysed_at
    ) VALUES (
      ${session.user.id},
      ${organisationName ?? null},
      ${website ?? null},
      ${summary ?? null},
      ${valueProposition ?? null},
      ${targetAudience ?? null},
      ${tone ?? null},
      ${JSON.stringify(keywords ?? [])}::jsonb,
      ${brandColor ?? null},
      ${accentColor ?? null},
      ${JSON.stringify(products ?? [])}::jsonb,
      ${industry ?? null},
      now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      organisation_name = EXCLUDED.organisation_name,
      website = EXCLUDED.website,
      summary = EXCLUDED.summary,
      value_proposition = EXCLUDED.value_proposition,
      target_audience = EXCLUDED.target_audience,
      tone = EXCLUDED.tone,
      keywords = EXCLUDED.keywords,
      brand_color = EXCLUDED.brand_color,
      accent_color = EXCLUDED.accent_color,
      products = EXCLUDED.products,
      industry = EXCLUDED.industry,
      last_analysed_at = now(),
      updated_at = now()
  `)

  return NextResponse.json({ ok: true })
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
  function rowsOf<T>(r: unknown): T[] {
    if (Array.isArray(r)) return r as T[]
    if (r && typeof r === 'object' && 'rows' in r) {
      const x = (r as { rows: unknown }).rows
      if (Array.isArray(x)) return x as T[]
    }
    return []
  }
  const list = rowsOf<Record<string, unknown>>(rows)
  return NextResponse.json({ ok: true, profile: list[0] ?? null })
}
