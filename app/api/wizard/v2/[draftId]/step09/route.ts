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
  const rows = rowsOf<Record<string, unknown>>(await db.execute(sql`SELECT tiers, marktest_reasoning, anti_glatt_check FROM bauplan_pricing WHERE bauplan_id = ${draftId} LIMIT 1`))
  return NextResponse.json({ pricing: rows[0] ? { tiers: rows[0].tiers ?? [], marktestReasoning: rows[0].marktest_reasoning, antiGlattCheck: rows[0].anti_glatt_check } : null })
}

export async function PUT(request: Request, { params }: { params: Promise<{ draftId: string }> }) {
  const s = await auth(); if (!s?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { draftId } = await params; await ensureBauplanV2Tables()
  if (!(await own(draftId, s.user.id))) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const b = await request.json().catch(() => ({} as Record<string, unknown>))
  await db.execute(sql`
    INSERT INTO bauplan_pricing (bauplan_id, tiers, marktest_reasoning, anti_glatt_check, updated_at)
    VALUES (${draftId}, ${JSON.stringify(b.tiers ?? [])}::jsonb, ${(b.marktestReasoning as string) ?? ''}, ${Boolean(b.antiGlattCheck)}, NOW())
    ON CONFLICT (bauplan_id) DO UPDATE SET tiers = EXCLUDED.tiers, marktest_reasoning = EXCLUDED.marktest_reasoning, anti_glatt_check = EXCLUDED.anti_glatt_check, updated_at = NOW()
  `)
  await db.execute(sql`INSERT INTO bauplan_step_states (bauplan_id, step_key, status, completed_at, points_awarded) VALUES (${draftId}, '09-preis', 'completed', NOW(), 250) ON CONFLICT (bauplan_id, step_key) DO UPDATE SET status = 'completed', completed_at = COALESCE(bauplan_step_states.completed_at, NOW())`)
  await db.execute(sql`UPDATE bauplan_drafts SET current_step_key = '10-scarcity', updated_at = NOW() WHERE id = ${draftId}`)
  return NextResponse.json({ ok: true })
}
