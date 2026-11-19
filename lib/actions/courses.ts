'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { getMember } from '@/lib/portal/member'
import { accessibleCourseIds, lessonCourse, loadCourse, loadProgress, viewCourse, saveLesson, setFeedback, setManualGate } from '@/lib/courses/store'

/** Darf die angemeldete Person diese Lektion bearbeiten? Zugang zum Kurs und Lektion freigeschaltet. */
export async function lessonAllowed(userId: string, role: string, lessonId: string) {
  const lc = await lessonCourse(lessonId)
  if (!lc) return null
  const isEf = role === 'admin' || role === 'coach'
  const m = await getMember(userId)
  const ids = await accessibleCourseIds(userId, m?.companyId ?? null, isEf)
  if (!ids.has(lc.courseId)) return null
  const c = await loadCourse(lc.slug)
  if (!c) return null
  const v = viewCourse(c, await loadProgress(userId, c.id), isEf)
  const l = v.lessons.find((x) => x.id === lessonId)
  return l && l.gate.open ? { slug: lc.slug, lesson: l } : null
}

/** Eingaben einer Lektion speichern (Schieberegler, Text). Optional als erledigt markieren. */
export async function saveLessonAction(lessonId: string, answers: Record<string, unknown> | null, done: boolean | null): Promise<{ ok: boolean; error?: string }> {
  const s = await auth()
  if (!s?.user?.id) return { ok: false, error: 'Nicht angemeldet' }
  const ok = await lessonAllowed(s.user.id, s.user.role ?? 'client', lessonId)
  if (!ok) return { ok: false, error: 'Diese Lektion ist für Dich noch nicht freigeschaltet.' }
  const clean: Record<string, unknown> | null = answers
    ? Object.fromEntries(Object.entries(answers).slice(0, 20).map(([k, v]) => [k.slice(0, 40), typeof v === 'number' ? Math.max(0, Math.min(10, v)) : String(v ?? '').slice(0, 2000)]))
    : null
  await saveLesson(s.user.id, lessonId, clean, done)
  revalidatePath(`/dashboard/programs/${ok.slug}`, 'layout')
  return { ok: true }
}

async function requireEf() {
  const s = await auth()
  if (!s?.user?.id || !(s.user.role === 'admin' || s.user.role === 'coach')) throw new Error('Kein Zugriff')
  return s
}

export async function feedbackAction(fd: FormData) {
  const s = await requireEf()
  await setFeedback(String(fd.get('id')), String(fd.get('feedback') ?? '').trim().slice(0, 4000), s.user?.name ?? 'Eilers+Friends')
  revalidatePath('/admin/courses')
}

export async function gateAction(fd: FormData) {
  await requireEf()
  await setManualGate(String(fd.get('id')), fd.get('open') === '1')
  revalidatePath('/admin/courses')
}
