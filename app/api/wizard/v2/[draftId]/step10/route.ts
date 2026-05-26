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
  const rows = rowsOf<Record<string, unknown>>(await db.execute(sql`SELECT scarcity_type, scarcity_reason, scarcity_proof, is_real FROM bauplan_scarcity WHERE bauplan_id = ${draftId} LIMIT 1`))
  return NextResponse.json({ scarcity: rows[0] ? { scarcityType: rows[0].scarcity_type, scarcityReason: rows[0].scarcity_reason, scarcityProof: rows[0].scarcity_proof ?? {}, isReal: rows[0].is_real } : null })
}

export async function PUT(request: Request, { params }: { params: Promise<{ draftId: string }> }) {
  const s = await auth(); if (!s?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { draftId } = await params; await ensureBauplanV2Tables()
  if (!(await own(draftId, s.user.id))) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const b = await request.json().catch(() => ({} as Record<string, unknown>))
  const skipped = Boolean(b.skipped)
  if (!skipped) {
    await db.execute(sql`
      INSERT INTO bauplan_scarcity (bauplan_id, scarcity_type, scarcity_reason, scarcity_proof, is_real)
      VALUES (${draftId}, ${(b.scarcityType as string) ?? 'cohort-size'}, ${(b.scarcityReason as string) ?? ''}, ${JSON.stringify(b.scarcityProof ?? {})}::jsonb, ${Boolean(b.isReal)})
      ON CONFLICT (bauplan_id) DO UPDATE SET scarcity_type = EXCLUDED.scarcity_type, scarcity_reason = EXCLUDED.scarcity_reason, scarcity_proof = EXCLUDED.scarcity_proof, is_real = EXCLUDED.is_real
    `)
  }
  await db.execute(sql`INSERT INTO bauplan_step_states (bauplan_id, step_key, status, completed_at, points_awarded) VALUES (${draftId}, '10-scarcity', ${skipped ? 'skipped' : 'completed'}, NOW(), ${skipped ? 0 : 250}) ON CONFLICT (bauplan_id, step_key) DO UPDATE SET status = EXCLUDED.status, completed_at = COALESCE(bauplan_step_states.completed_at, NOW())`)
  await db.execute(sql`UPDATE bauplan_drafts SET current_step_key = '11-risk-reversal', updated_at = NOW() WHERE id = ${draftId}`)
  return NextResponse.json({ ok: true })
}
