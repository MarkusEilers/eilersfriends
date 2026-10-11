'use server'

import { revalidatePath } from 'next/cache'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { ensureRolloutSchema } from '@/lib/rollouts/schema'
import { mayComplete, mayTick, viewerContext } from '@/lib/rollouts/guide'
import { getSnapshot, type Cadence } from '@/lib/rollouts/core'

/**
 * Aktionen im Programm Guide. Jede prüft selbst, ob der Nutzer zur Firma
 * gehört und den Schritt anfassen darf — die Oberfläche blendet nur aus,
 * sie schützt nicht.
 */

async function stepContext(rolloutStepId: string) {
  const s = await auth()
  if (!s?.user?.id) throw new Error('unauthorized')
  await ensureRolloutSchema()
  const [row] = (await db.execute(sql`
    SELECT rs.id, rs.step_key, rs.rollout_id, r.company_id, r.program_version_id
    FROM rollout_steps rs JOIN rollouts r ON r.id=rs.rollout_id WHERE rs.id=${rolloutStepId}`)) as unknown as
    { id: string; step_key: string; rollout_id: string; company_id: string; program_version_id: string }[]
  if (!row) throw new Error('not found')
  const ctx = await viewerContext(s.user.id, s.user.role, row.company_id)
  if (!ctx.role) throw new Error('forbidden')
  const snap = await getSnapshot(row.program_version_id)
  const teams = snap.steps.find((x) => x.id === row.step_key)?.teams ?? []
  return { user: s.user, row, ctx, teams }
}

export async function toggleGuideItem(itemId: string, done: boolean) {
  const [it] = (await db.execute(sql`SELECT rollout_step_id FROM rollout_items WHERE id=${itemId}`)) as unknown as { rollout_step_id: string }[]
  if (!it) return { ok: false }
  const { user, ctx, teams } = await stepContext(it.rollout_step_id)
  if (!mayTick(ctx.role, ctx.teamKeys, teams)) return { ok: false, error: 'forbidden' }
  await db.execute(sql`
    UPDATE rollout_items SET done_at=${done ? sql`now()` : null}, done_by=${done ? user.id : null}, done_by_name=${done ? user.name ?? user.email ?? null : null}
    WHERE id=${itemId}`)
  revalidatePath('/dashboard/guide')
  return { ok: true }
}

export async function setGuideStepStatus(rolloutStepId: string, status: 'planned' | 'running' | 'done') {
  const { user, ctx, teams } = await stepContext(rolloutStepId)
  if (!mayComplete(ctx.role, ctx.teamKeys, teams)) return { ok: false, error: 'forbidden' }
  await db.execute(sql`
    UPDATE rollout_steps SET status=${status}, done_at=${status === 'done' ? sql`now()` : null}, done_by=${status === 'done' ? user.id : null}, updated_at=now()
    WHERE id=${rolloutStepId}`)
  revalidatePath('/dashboard/guide')
  return { ok: true }
}

/** Kunde schlägt vor — entschieden wird im Backend. */
export async function proposeGuideChange(input: { rolloutStepId: string; kind: 'dates' | 'order' | 'cadence' | 'content'; text: string; proposedStart?: string; cadence?: Cadence }) {
  const { user, row, ctx } = await stepContext(input.rolloutStepId)
  if (!(ctx.role === 'ef' || ctx.role === 'owner' || ctx.role === 'admin' || ctx.role === 'lead')) return { ok: false, error: 'forbidden' }
  const text = input.text.trim().slice(0, 2000)
  if (!text && !input.proposedStart && !input.cadence) return { ok: false, error: 'empty' }
  const [cur] = (await db.execute(sql`SELECT planned_start::text AS planned_start, planned_end::text AS planned_end FROM rollout_steps WHERE id=${row.id}`)) as unknown as { planned_start: string; planned_end: string }[]
  const [ro] = (await db.execute(sql`SELECT cadence FROM rollouts WHERE id=${row.rollout_id}`)) as unknown as { cadence: string }[]
  await db.execute(sql`
    INSERT INTO rollout_changes (rollout_id, rollout_step_id, proposed_by, proposed_by_name, kind, payload, reason, before)
    VALUES (${row.rollout_id}, ${row.id}, ${user.id}, ${user.name ?? user.email ?? null}, ${input.kind},
            ${JSON.stringify({ proposedStart: input.proposedStart ?? null, cadence: input.cadence ?? null })}::jsonb, ${text || null},
            ${JSON.stringify({ ...cur, cadence: ro?.cadence })}::jsonb)`)
  revalidatePath('/dashboard/guide')
  return { ok: true }
}
