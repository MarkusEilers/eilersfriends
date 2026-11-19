import { accessibleCourseIds, listCourses, loadCourse, loadProgress, viewCourse, type CourseView } from '@/lib/courses/store'

/** Alle Kurse, die eine Person sehen darf, mit ihrem Fortschritt. */
export async function myCourses(userId: string, companyId: string | null, role: string): Promise<CourseView[]> {
  const isEf = role === 'admin' || role === 'coach'
  const ids = await accessibleCourseIds(userId, companyId, isEf)
  const all = (await listCourses()).filter((c) => ids.has(c.id))
  const out: CourseView[] = []
  for (const c of all) {
    const full = await loadCourse(c.slug)
    if (full) out.push(viewCourse(full, await loadProgress(userId, full.id), isEf))
  }
  return out
}

export async function courseFor(userId: string, companyId: string | null, role: string, slug: string): Promise<CourseView | null> {
  const isEf = role === 'admin' || role === 'coach'
  const c = await loadCourse(slug)
  if (!c) return null
  const ids = await accessibleCourseIds(userId, companyId, isEf)
  if (!ids.has(c.id)) return null
  return viewCourse(c, await loadProgress(userId, c.id), isEf)
}

export const KIND_LABEL: Record<string, string> = { video: 'Video', read: 'Lesen und Folien', exercise: 'Übung', homework: 'Homework' }
