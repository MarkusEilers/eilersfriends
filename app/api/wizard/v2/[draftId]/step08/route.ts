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
  const rows = rowsOf<Record<string, unknown>>(await db.execute(sql`SELECT id, phase_id, metric, unit, baseline, pessimistic, realistic, optimistic, measured_at, is_primary FROM bauplan_phase_currencies WHERE bauplan_id = ${draftId}`))
  return NextResponse.json({ items: rows.map((r) => ({ id: r.id, phaseId: r.phase_id, metric: r.metric, unit: r.unit, baseline: r.baseline, pessimistic: r.pessimistic, realistic: r.realistic, optimistic: r.optimistic, measuredAt: r.measured_at, isPrimary: r.is_primary })) })
}

export async function PUT(request: Request, { params }: { params: Promise<{ draftId: string }> }) {
  const s = await auth(); if (!s?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { draftId } = await params; await ensureBauplanV2Tables()
  if (!(await own(draftId, s.user.id))) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const body = await request.json().catch(() => ({} as Record<string, unknown>))
  const items = (body.items as Array<Record<string, unknown>>) ?? []
  const skipped = Boolean(body.skipped)

  await db.execute(sql`DELETE FROM bauplan_phase_currencies WHERE bauplan_id = ${draftId}`)
  for (const it of items) {
    if (!it.metric) continue
    await db.execute(sql`
      INSERT INTO bauplan_phase_currencies (id, bauplan_id, phase_id, metric, unit, baseline, pessimistic, realistic, optimistic, measured_at, is_primary)
      VALUES (${(it.id as string) ?? null}, ${draftId}, ${(it.phaseId as string) ?? ''}, ${(it.metric as string) ?? ''},
              ${(it.unit as string) ?? ''}, ${(it.baseline as string) ?? ''}, ${(it.pessimistic as string) ?? ''},
              ${(it.realistic as string) ?? ''}, ${(it.optimistic as string) ?? ''}, ${(it.measuredAt as string) ?? ''}, ${Boolean(it.isPrimary)})
    `)
  }
  await db.execute(sql`
    INSERT INTO bauplan_step_states (bauplan_id, step_key, status, completed_at, points_awarded)
    VALUES (${draftId}, '08-phase-currencies', ${skipped ? 'skipped' : 'completed'}, NOW(), ${skipped ? 0 : 250})
    ON CONFLICT (bauplan_id, step_key) DO UPDATE SET status = EXCLUDED.status, completed_at = COALESCE(bauplan_step_states.completed_at, NOW())
  `)
  await db.execute(sql`UPDATE bauplan_drafts SET current_step_key = '09-preis', updated_at = NOW() WHERE id = ${draftId}`)
  return NextResponse.json({ ok: true })
}
