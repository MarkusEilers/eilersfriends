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
  const rows = rowsOf<Record<string, unknown>>(await db.execute(sql`SELECT name, starting_pain, start_symptoms, end_goal, end_proof_points, headline_promise, phases, roadmap_svg_path FROM bauplan_bulletproof_plans WHERE bauplan_id = ${draftId} LIMIT 1`))
  const p = rows[0]
  return NextResponse.json({
    plan: p ? {
      name: p.name, startingPain: p.starting_pain, startSymptoms: p.start_symptoms ?? [],
      endGoal: p.end_goal, endProofPoints: p.end_proof_points ?? [], headlinePromise: p.headline_promise,
      phases: p.phases ?? [], roadmapSvgPath: p.roadmap_svg_path,
    } : null,
  })
}

export async function PUT(request: Request, { params }: { params: Promise<{ draftId: string }> }) {
  const s = await auth(); if (!s?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { draftId } = await params; await ensureBauplanV2Tables()
  if (!(await own(draftId, s.user.id))) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const b = await request.json().catch(() => ({} as Record<string, unknown>))
  await db.execute(sql`
    INSERT INTO bauplan_bulletproof_plans (bauplan_id, name, starting_pain, start_symptoms, end_goal, end_proof_points, headline_promise, phases, updated_at)
    VALUES (${draftId}, ${(b.name as string) ?? ''}, ${(b.startingPain as string) ?? ''},
            ${JSON.stringify(b.startSymptoms ?? [])}::jsonb, ${(b.endGoal as string) ?? ''},
            ${JSON.stringify(b.endProofPoints ?? [])}::jsonb, ${(b.headlinePromise as string) ?? ''},
            ${JSON.stringify(b.phases ?? [])}::jsonb, NOW())
    ON CONFLICT (bauplan_id) DO UPDATE SET
      name = EXCLUDED.name, starting_pain = EXCLUDED.starting_pain, start_symptoms = EXCLUDED.start_symptoms,
      end_goal = EXCLUDED.end_goal, end_proof_points = EXCLUDED.end_proof_points,
      headline_promise = EXCLUDED.headline_promise, phases = EXCLUDED.phases, updated_at = NOW()
  `)
  await db.execute(sql`INSERT INTO bauplan_step_states (bauplan_id, step_key, status, completed_at, points_awarded) VALUES (${draftId}, '07-bulletproof', 'completed', NOW(), 250) ON CONFLICT (bauplan_id, step_key) DO UPDATE SET status = 'completed', completed_at = COALESCE(bauplan_step_states.completed_at, NOW())`)
  await db.execute(sql`UPDATE bauplan_drafts SET current_step_key = '08-phase-currencies', updated_at = NOW() WHERE id = ${draftId}`)
  return NextResponse.json({ ok: true })
}
