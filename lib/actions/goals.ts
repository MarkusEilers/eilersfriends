'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { saveGoal, archiveGoal, addGoalValue, GOAL_TEMPLATES, type GoalInput } from '@/lib/goals/schema'

/** Ziele pflegen darf nur Eilers+Friends (Admin/Coach). */
async function editor() {
  const s = await auth()
  const r = s?.user?.role
  if (r !== 'admin' && r !== 'coach') throw new Error('unauthorized')
  return s!.user!.id ?? null
}

export async function saveGoalAction(input: GoalInput) {
  const uid = await editor()
  if (!input.title?.trim()) throw new Error('Titel fehlt')
  const id = await saveGoal({ ...input, title: input.title.trim(), target: Number(input.target) || 0 }, uid)
  revalidatePath('/admin/companies')
  revalidatePath('/admin/ziele')
  revalidatePath('/dashboard')
  return { ok: true, id }
}

export async function addGoalFromTemplateAction(companyId: string, templateKey: string) {
  const uid = await editor()
  const t = GOAL_TEMPLATES.find((x) => x.key === templateKey)
  if (!t) throw new Error('Vorlage unbekannt')
  const id = await saveGoal({
    companyId, team: t.team, title: t.title, metricKey: t.key, kind: t.kind, unit: t.unit, period: t.period ?? null,
    direction: t.direction ?? 'up', target: t.target,
  }, uid)
  revalidatePath('/admin/companies')
  return { ok: true, id }
}

export async function archiveGoalAction(id: string, companyId: string, archived = true) {
  await editor()
  await archiveGoal(id, companyId, archived)
  revalidatePath('/admin/companies')
  revalidatePath('/admin/ziele')
  revalidatePath('/dashboard')
  return { ok: true }
}

export async function addGoalValueAction(goalId: string, value: number, measuredOn?: string | null, note?: string | null) {
  const uid = await editor()
  await addGoalValue(goalId, Number(value), measuredOn || null, note || null, uid)
  revalidatePath('/admin/companies')
  revalidatePath('/admin/ziele')
  revalidatePath('/dashboard')
  return { ok: true }
}
