import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { ensureBauplanV2Tables } from '@/lib/db/self-heal-v2'

export const runtime = 'nodejs'
function rowsOf<T>(r: unknown): T[] { if (Array.isArray(r)) return r as T[]; if (r && typeof r === 'object' && 'rows' in r) { const x = (r as { rows: unknown }).rows; if (Array.isArray(x)) return x as T[] } return [] }
async function own(d: string, u: string) { return rowsOf(await db.execute(sql`SELECT id FROM bauplan_drafts WHERE id = ${d} AND user_id = ${u} LIMIT 1`)).length > 0 }

export async function GET(_r: Request, { params }: { params: Promise<{ draftId: string }> }) {
  const s = await auth(); if (!s?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { draftId } = await params; await ensureBauplanV2Tables()
  if (!(await own(draftId, s.user.id))) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const rows = rowsOf<Record<string, unknown>>(await db.execute(sql`SELECT name, subheadline, headline, cta, cta_secondary, generated_variants FROM bauplan_offer_identity WHERE bauplan_id = ${draftId} LIMIT 1`))
  return NextResponse.json({ identity: rows[0] ? { name: rows[0].name, subheadline: rows[0].subheadline, headline: rows[0].headline, cta: rows[0].cta, ctaSecondary: rows[0].cta_secondary, generatedVariants: rows[0].generated_variants ?? [] } : null })
}

export async function PUT(request: Request, { params }: { params: Promise<{ draftId: string }> }) {
  const s = await auth(); if (!s?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { draftId } = await params; await ensureBauplanV2Tables()
  if (!(await own(draftId, s.user.id))) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const b = await request.json().catch(() => ({} as Record<string, unknown>))
  await db.execute(sql`
    INSERT INTO bauplan_offer_identity (bauplan_id, name, subheadline, headline, cta, cta_secondary, generated_variants, updated_at)
    VALUES (${draftId}, ${(b.name as string) ?? ''}, ${(b.subheadline as string) ?? null}, ${(b.headline as string) ?? ''}, ${(b.cta as string) ?? ''}, ${(b.ctaSecondary as string) ?? null}, ${JSON.stringify(b.generatedVariants ?? [])}::jsonb, NOW())
    ON CONFLICT (bauplan_id) DO UPDATE SET name = EXCLUDED.name, subheadline = EXCLUDED.subheadline, headline = EXCLUDED.headline, cta = EXCLUDED.cta, cta_secondary = EXCLUDED.cta_secondary, generated_variants = EXCLUDED.generated_variants, updated_at = NOW()
  `)
  await db.execute(sql`INSERT INTO bauplan_step_states (bauplan_id, step_key, status, completed_at, points_awarded) VALUES (${draftId}, '12-name-headline', 'completed', NOW(), 500) ON CONFLICT (bauplan_id, step_key) DO UPDATE SET status = 'completed', completed_at = COALESCE(bauplan_step_states.completed_at, NOW())`)
  await db.execute(sql`UPDATE bauplan_drafts SET published_at = NOW(), updated_at = NOW() WHERE id = ${draftId}`)
  return NextResponse.json({ ok: true, complete: true })
}
