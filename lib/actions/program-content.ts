'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { auth } from '@/lib/auth'

async function requireAdmin() {
  const s = await auth()
  if (!s?.user?.role || (s.user.role !== 'admin' && s.user.role !== 'coach')) throw new Error('unauthorized')
}
const nn = (v: FormDataEntryValue | null) => { const x = (v?.toString() ?? '').trim(); return x === '' ? null : x }
function rp(id: string) { revalidatePath(`/admin/programs/${id}`) }

export async function addPhase(fd: FormData) {
  await requireAdmin()
  const programId = fd.get('programId')?.toString(); if (!programId) return
  await db.execute(sql`INSERT INTO program_phases (program_id, name, sort_order)
    VALUES (${programId}, 'Neue Phase', COALESCE((SELECT MAX(sort_order)+1 FROM program_phases WHERE program_id=${programId}), 0))`)
  rp(programId)
}
export async function updatePhase(fd: FormData) {
  await requireAdmin()
  const id = fd.get('id')?.toString(); const programId = fd.get('programId')?.toString(); if (!id || !programId) return
  await db.execute(sql`UPDATE program_phases SET name=${fd.get('name')?.toString() || 'Phase'}, goal=${nn(fd.get('goal'))}, updated_at=now() WHERE id=${id}`)
  rp(programId)
}
export async function deletePhase(fd: FormData) {
  await requireAdmin()
  const id = fd.get('id')?.toString(); const programId = fd.get('programId')?.toString(); if (!id || !programId) return
  await db.execute(sql`DELETE FROM program_phases WHERE id=${id}`)
  rp(programId)
}
export async function addStep(fd: FormData) {
  await requireAdmin()
  const phaseId = fd.get('phaseId')?.toString(); const programId = fd.get('programId')?.toString(); if (!phaseId || !programId) return
  await db.execute(sql`INSERT INTO program_steps (phase_id, program_id, title, type, sort_order)
    VALUES (${phaseId}, ${programId}, 'Neuer Schritt', 'lesson', COALESCE((SELECT MAX(sort_order)+1 FROM program_steps WHERE phase_id=${phaseId}), 0))`)
  rp(programId)
}
export async function updateStep(fd: FormData) {
  await requireAdmin()
  const id = fd.get('id')?.toString(); const programId = fd.get('programId')?.toString(); if (!id || !programId) return
  const dur = nn(fd.get('durationH'))
  await db.execute(sql`UPDATE program_steps SET
      title=${fd.get('title')?.toString() || 'Schritt'},
      description=${nn(fd.get('description'))},
      type=${fd.get('type')?.toString() || 'lesson'},
      format=${nn(fd.get('format'))},
      duration_h=${dur ? Number(dur) : null},
      is_bonus=${fd.get('isBonus') === '1'},
      framework_id=${nn(fd.get('frameworkId'))},
      requires_step_id=${nn(fd.get('requiresStepId'))},
      updated_at=now()
    WHERE id=${id}`)
  rp(programId)
}
export async function deleteStep(fd: FormData) {
  await requireAdmin()
  const id = fd.get('id')?.toString(); const programId = fd.get('programId')?.toString(); if (!id || !programId) return
  await db.execute(sql`DELETE FROM program_steps WHERE id=${id}`)
  rp(programId)
}
export async function addProgramFramework(fd: FormData) {
  await requireAdmin()
  const programId = fd.get('programId')?.toString(); const frameworkId = nn(fd.get('frameworkId')); if (!programId || !frameworkId) return
  await db.execute(sql`INSERT INTO program_frameworks (program_id, framework_id, sort_order)
    VALUES (${programId}, ${frameworkId}, COALESCE((SELECT MAX(sort_order)+1 FROM program_frameworks WHERE program_id=${programId}), 0))
    ON CONFLICT (program_id, framework_id) DO NOTHING`)
  rp(programId)
}
export async function removeProgramFramework(fd: FormData) {
  await requireAdmin()
  const programId = fd.get('programId')?.toString(); const frameworkId = fd.get('frameworkId')?.toString(); if (!programId || !frameworkId) return
  await db.execute(sql`DELETE FROM program_frameworks WHERE program_id=${programId} AND framework_id=${frameworkId}`)
  rp(programId)
}
