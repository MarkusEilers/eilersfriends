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
  const rows = rowsOf<Record<string, unknown>>(await db.execute(sql`SELECT reversal_type, trigger_condition, consequence, anchor_phase_id, anchor_currency_id, espresso_test, refund_deadline FROM bauplan_risk_reversal WHERE bauplan_id = ${draftId} LIMIT 1`))
  return NextResponse.json({ riskReversal: rows[0] ? { reversalType: rows[0].reversal_type, triggerCondition: rows[0].trigger_condition, consequence: rows[0].consequence, anchorPhaseId: rows[0].anchor_phase_id, anchorCurrencyId: rows[0].anchor_currency_id, espressoTest: rows[0].espresso_test, refundDeadline: rows[0].refund_deadline } : null })
}

export async function PUT(request: Request, { params }: { params: Promise<{ draftId: string }> }) {
  const s = await auth(); if (!s?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { draftId } = await params; await ensureBauplanV2Tables()
  if (!(await own(draftId, s.user.id))) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const b = await request.json().catch(() => ({} as Record<string, unknown>))
  const skipped = Boolean(b.skipped)
  if (!skipped) {
    await db.execute(sql`
      INSERT INTO bauplan_risk_reversal (bauplan_id, reversal_type, trigger_condition, consequence, anchor_phase_id, anchor_currency_id, espresso_test, refund_deadline)
      VALUES (${draftId}, ${(b.reversalType as string) ?? 'result-or-action'}, ${(b.triggerCondition as string) ?? ''}, ${(b.consequence as string) ?? ''}, ${(b.anchorPhaseId as string) ?? null}, ${(b.anchorCurrencyId as string) ?? null}, ${Boolean(b.espressoTest)}, ${(b.refundDeadline as number) ?? null})
      ON CONFLICT (bauplan_id) DO UPDATE SET reversal_type = EXCLUDED.reversal_type, trigger_condition = EXCLUDED.trigger_condition, consequence = EXCLUDED.consequence, espresso_test = EXCLUDED.espresso_test
    `)
  }
  await db.execute(sql`INSERT INTO bauplan_step_states (bauplan_id, step_key, status, completed_at, points_awarded) VALUES (${draftId}, '11-risk-reversal', ${skipped ? 'skipped' : 'completed'}, NOW(), ${skipped ? 0 : 250}) ON CONFLICT (bauplan_id, step_key) DO UPDATE SET status = EXCLUDED.status, completed_at = COALESCE(bauplan_step_states.completed_at, NOW())`)
  await db.execute(sql`UPDATE bauplan_drafts SET current_step_key = '12-name-headline', updated_at = NOW() WHERE id = ${draftId}`)
  return NextResponse.json({ ok: true })
}
