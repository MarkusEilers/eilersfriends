import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

/**
 * Kurse in der Member-Section (Stufe 2).
 * Kurs → Module → Lektionen. Lektionen sind Video, Lesen/Folien, Übung oder Homework.
 * Freischalten (Drip) je Modul oder Lektion: sofort, ab Datum, nach eingereichter Homework,
 * manuell durch Eilers+Friends. Jede Sperre nennt ihren Grund.
 */

type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? r : ((r as { rows?: Row[] })?.rows ?? [])) as Row[]

export type Unlock =
  | { type: 'none' }
  | { type: 'date'; date: string }
  | { type: 'homework'; lesson: string }        // Slug der Homework-Lektion
  | { type: 'manual'; open: boolean; label: string }

export type LessonKind = 'video' | 'read' | 'exercise' | 'homework'
export interface LessonInput { key: string; type: 'scale' | 'text'; label: string; hint?: string; low?: string; high?: string }
export interface Slide { url: string; title?: string }

export interface Lesson {
  id: string; slug: string; pos: number; kind: LessonKind; title: string; summary: string | null; body: string | null
  videoUrl: string | null; durationMin: number | null; slides: Slide[]; inputs: LessonInput[]; unlock: Unlock
}
export interface Module { id: string; pos: number; title: string; subtitle: string | null; bonus: boolean; unlock: Unlock; lessons: Lesson[] }
export interface Course {
  id: string; slug: string; title: string; subtitle: string | null; description: string | null; kind: string; label: string | null
  coach: string | null; cover: string | null; deckUrl: string | null; modules: Module[]
}

let ready = false
export async function ensureCourseSchema() {
  if (ready) return
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS courses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      subtitle TEXT,
      description TEXT,
      kind TEXT NOT NULL DEFAULT 'course',
      label TEXT,
      coach TEXT,
      cover TEXT,
      deck_url TEXT,
      status TEXT NOT NULL DEFAULT 'live',
      pos INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS course_modules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      pos INT NOT NULL,
      title TEXT NOT NULL,
      subtitle TEXT,
      bonus BOOLEAN NOT NULL DEFAULT false,
      unlock JSONB NOT NULL DEFAULT '{"type":"none"}'::jsonb
    )`)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS course_lessons (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      module_id UUID NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
      slug TEXT NOT NULL,
      pos INT NOT NULL,
      kind TEXT NOT NULL DEFAULT 'read',
      title TEXT NOT NULL,
      summary TEXT,
      body TEXT,
      video_url TEXT,
      duration_min INT,
      slides JSONB NOT NULL DEFAULT '[]'::jsonb,
      inputs JSONB NOT NULL DEFAULT '[]'::jsonb,
      unlock JSONB NOT NULL DEFAULT '{"type":"none"}'::jsonb
    )`)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS course_access (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      company_id UUID,
      user_id UUID,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS course_progress (
      user_id UUID NOT NULL,
      lesson_id UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'started',
      answers JSONB NOT NULL DEFAULT '{}'::jsonb,
      started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      done_at TIMESTAMPTZ,
      PRIMARY KEY (user_id, lesson_id)
    )`)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS course_submissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      lesson_id UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
      text TEXT,
      file_url TEXT,
      file_name TEXT,
      submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      feedback TEXT,
      feedback_by TEXT,
      feedback_at TIMESTAMPTZ
    )`)
  ready = true
}

const j = <T,>(v: unknown, d: T): T => (v == null ? d : typeof v === 'string' ? (JSON.parse(v) as T) : (v as T))

/** Kurse, die diese Person sehen darf: Zugang über Firma oder persönlich. Eilers+Friends sieht alle. */
export async function accessibleCourseIds(userId: string, companyId: string | null, isEf: boolean): Promise<Set<string>> {
  await ensureCourseSchema()
  const r = isEf
    ? rows(await db.execute(sql`SELECT id FROM courses WHERE status <> 'archived'`))
    : rows(await db.execute(sql`
        SELECT DISTINCT c.id FROM courses c JOIN course_access a ON a.course_id = c.id
        WHERE c.status = 'live' AND (a.user_id = ${userId} OR (${companyId}::uuid IS NOT NULL AND a.company_id = ${companyId}::uuid))`))
  return new Set(r.map((x) => String(x.id)))
}

export async function listCourses(): Promise<{ id: string; slug: string; title: string; subtitle: string | null; kind: string; label: string | null; coach: string | null; cover: string | null; lessons: number; modules: number }[]> {
  await ensureCourseSchema()
  return rows(await db.execute(sql`
    SELECT c.id, c.slug, c.title, c.subtitle, c.kind, c.label, c.coach, c.cover,
           (SELECT count(*)::int FROM course_modules m WHERE m.course_id = c.id AND NOT m.bonus) AS modules,
           (SELECT count(*)::int FROM course_lessons l JOIN course_modules m ON m.id = l.module_id WHERE m.course_id = c.id AND NOT m.bonus) AS lessons
    FROM courses c WHERE c.status <> 'archived' ORDER BY c.pos, c.created_at`)).map((r) => ({
      id: String(r.id), slug: String(r.slug), title: String(r.title), subtitle: (r.subtitle as string) ?? null, kind: String(r.kind), label: (r.label as string) ?? null,
      coach: (r.coach as string) ?? null, cover: (r.cover as string) ?? null, lessons: Number(r.lessons), modules: Number(r.modules),
    }))
}

export async function loadCourse(slug: string): Promise<Course | null> {
  await ensureCourseSchema()
  const [c] = rows(await db.execute(sql`SELECT * FROM courses WHERE slug = ${slug}`))
  if (!c) return null
  const mods = rows(await db.execute(sql`SELECT * FROM course_modules WHERE course_id = ${String(c.id)} ORDER BY pos`))
  const les = rows(await db.execute(sql`
    SELECT l.* FROM course_lessons l JOIN course_modules m ON m.id = l.module_id WHERE m.course_id = ${String(c.id)} ORDER BY m.pos, l.pos`))
  return {
    id: String(c.id), slug: String(c.slug), title: String(c.title), subtitle: (c.subtitle as string) ?? null, description: (c.description as string) ?? null,
    kind: String(c.kind), label: (c.label as string) ?? null, coach: (c.coach as string) ?? null, cover: (c.cover as string) ?? null, deckUrl: (c.deck_url as string) ?? null,
    modules: mods.map((m) => ({
      id: String(m.id), pos: Number(m.pos), title: String(m.title), subtitle: (m.subtitle as string) ?? null, bonus: !!m.bonus, unlock: j<Unlock>(m.unlock, { type: 'none' }),
      lessons: les.filter((l) => l.module_id === m.id).map((l) => ({
        id: String(l.id), slug: String(l.slug), pos: Number(l.pos), kind: String(l.kind) as LessonKind, title: String(l.title),
        summary: (l.summary as string) ?? null, body: (l.body as string) ?? null, videoUrl: (l.video_url as string) ?? null,
        durationMin: l.duration_min == null ? null : Number(l.duration_min), slides: j<Slide[]>(l.slides, []), inputs: j<LessonInput[]>(l.inputs, []),
        unlock: j<Unlock>(l.unlock, { type: 'none' }),
      })),
    })),
  }
}

export interface Submission { id: string; lessonId: string; text: string | null; fileUrl: string | null; fileName: string | null; submittedAt: string; feedback: string | null; feedbackAt: string | null }
export interface Progress {
  status: Record<string, 'started' | 'done'>
  answers: Record<string, Record<string, unknown>>
  submissions: Record<string, Submission[]>
}

export async function loadProgress(userId: string, courseId: string): Promise<Progress> {
  await ensureCourseSchema()
  const p = rows(await db.execute(sql`
    SELECT p.lesson_id, p.status, p.answers FROM course_progress p
    JOIN course_lessons l ON l.id = p.lesson_id JOIN course_modules m ON m.id = l.module_id
    WHERE p.user_id = ${userId} AND m.course_id = ${courseId}`))
  const s = rows(await db.execute(sql`
    SELECT s.* FROM course_submissions s
    JOIN course_lessons l ON l.id = s.lesson_id JOIN course_modules m ON m.id = l.module_id
    WHERE s.user_id = ${userId} AND m.course_id = ${courseId} ORDER BY s.submitted_at DESC`))
  const out: Progress = { status: {}, answers: {}, submissions: {} }
  for (const r of p) { out.status[String(r.lesson_id)] = r.status === 'done' ? 'done' : 'started'; out.answers[String(r.lesson_id)] = j(r.answers, {}) }
  for (const r of s) {
    const k = String(r.lesson_id)
    ;(out.submissions[k] ||= []).push({
      id: String(r.id), lessonId: k, text: (r.text as string) ?? null, fileUrl: (r.file_url as string) ?? null, fileName: (r.file_name as string) ?? null,
      submittedAt: new Date(String(r.submitted_at)).toISOString(), feedback: (r.feedback as string) ?? null, feedbackAt: r.feedback_at ? new Date(String(r.feedback_at)).toISOString() : null,
    })
  }
  return out
}

/* ── Freischalten ─────────────────────────────────────────────────── */

export interface Gate { open: boolean; reason: string | null; short: string | null }

function gateOf(u: Unlock, c: Course, p: Progress, today: string): Gate {
  if (u.type === 'date') {
    if (u.date <= today) return { open: true, reason: null, short: null }
    const d = new Date(u.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
    return { open: false, reason: `Schaltet am ${d} frei.`, short: `ab ${d}` }
  }
  if (u.type === 'homework') {
    const hw = c.modules.flatMap((m) => m.lessons).find((l) => l.slug === u.lesson)
    if (!hw || (p.submissions[hw.id]?.length ?? 0) > 0 || p.status[hw.id] === 'done') return { open: true, reason: null, short: null }
    return { open: false, reason: `Schaltet frei, sobald „${hw.title}“ eingereicht ist.`, short: 'nach Homework' }
  }
  if (u.type === 'manual') return u.open ? { open: true, reason: null, short: null } : { open: false, reason: u.label, short: u.label.replace(/^Schaltet\s+/i, '').replace(/\s*frei\.?$/i, '') }
  return { open: true, reason: null, short: null }
}

export interface LessonView extends Lesson { moduleId: string; index: number; gate: Gate; done: boolean; started: boolean; submitted: boolean; feedback: boolean }
export interface CourseView {
  course: Course
  modules: (Omit<Module, 'lessons'> & { gate: Gate; lessons: LessonView[]; done: number })[]
  lessons: LessonView[]
  done: number; total: number; percent: number
  next: LessonView | null
}

/** Kurs plus Fortschritt: was ist offen, was gesperrt (mit Grund), was ist als Nächstes dran. */
export function viewCourse(c: Course, p: Progress, isEf = false): CourseView {
  const today = new Date().toISOString().slice(0, 10)
  let i = 0
  const modules = c.modules.map((m) => {
    const mg = isEf && !(m.unlock.type === 'manual' && !m.unlock.open) ? { open: true, reason: null, short: null } : gateOf(m.unlock, c, p, today)
    const lessons: LessonView[] = m.lessons.map((l) => {
      const lg = gateOf(l.unlock, c, p, today)
      const gate = !mg.open ? mg : lg
      return {
        ...l, moduleId: m.id, index: ++i, gate,
        done: p.status[l.id] === 'done', started: !!p.status[l.id], submitted: (p.submissions[l.id]?.length ?? 0) > 0,
        feedback: (p.submissions[l.id] ?? []).some((s) => !!s.feedback),
      }
    })
    return { ...m, gate: mg, lessons, done: lessons.filter((l) => l.done).length }
  })
  const lessons = modules.flatMap((m) => m.lessons)
  const core = modules.filter((m) => !m.bonus).flatMap((m) => m.lessons)
  const done = core.filter((l) => l.done).length
  const next = core.find((l) => l.gate.open && !l.done) ?? null
  return { course: c, modules, lessons, done, total: core.length, percent: core.length ? Math.round((done / core.length) * 100) : 0, next }
}

/* ── Schreiben ───────────────────────────────────────────────────── */

export async function saveLesson(userId: string, lessonId: string, answers: Record<string, unknown> | null, done: boolean | null) {
  await ensureCourseSchema()
  await db.execute(sql`
    INSERT INTO course_progress (user_id, lesson_id, status, answers, done_at)
    VALUES (${userId}, ${lessonId}, ${done ? 'done' : 'started'}, ${JSON.stringify(answers ?? {})}::jsonb, ${done ? new Date().toISOString() : null})
    ON CONFLICT (user_id, lesson_id) DO UPDATE SET
      answers = CASE WHEN ${answers === null} THEN course_progress.answers ELSE course_progress.answers || EXCLUDED.answers END,
      status = CASE WHEN ${done === null} THEN course_progress.status WHEN ${!!done} THEN 'done' ELSE 'started' END,
      done_at = CASE WHEN ${done === null} THEN course_progress.done_at WHEN ${!!done} THEN COALESCE(course_progress.done_at, now()) ELSE NULL END`)
}

export async function addSubmission(userId: string, lessonId: string, text: string | null, fileUrl: string | null, fileName: string | null) {
  await ensureCourseSchema()
  await db.execute(sql`INSERT INTO course_submissions (user_id, lesson_id, text, file_url, file_name) VALUES (${userId}, ${lessonId}, ${text}, ${fileUrl}, ${fileName})`)
  await saveLesson(userId, lessonId, null, true)
}

export async function lessonCourse(lessonId: string): Promise<{ courseId: string; slug: string } | null> {
  await ensureCourseSchema()
  const [r] = rows(await db.execute(sql`
    SELECT c.id, c.slug FROM course_lessons l JOIN course_modules m ON m.id = l.module_id JOIN courses c ON c.id = m.course_id WHERE l.id = ${lessonId}`))
  return r ? { courseId: String(r.id), slug: String(r.slug) } : null
}

/* ── Admin ───────────────────────────────────────────────────────── */

export async function listSubmissions(limit = 200) {
  await ensureCourseSchema()
  return rows(await db.execute(sql`
    SELECT s.id, s.text, s.file_url, s.file_name, s.submitted_at, s.feedback, s.feedback_at,
           l.title AS lesson, c.title AS course, c.slug AS course_slug, u.name, u.email
    FROM course_submissions s
    JOIN course_lessons l ON l.id = s.lesson_id JOIN course_modules m ON m.id = l.module_id JOIN courses c ON c.id = m.course_id
    LEFT JOIN users u ON u.id = s.user_id
    ORDER BY (s.feedback IS NULL) DESC, s.submitted_at DESC LIMIT ${limit}`))
}

export async function setFeedback(id: string, text: string, by: string) {
  await ensureCourseSchema()
  await db.execute(sql`UPDATE course_submissions SET feedback = ${text || null}, feedback_by = ${by}, feedback_at = ${text ? new Date().toISOString() : null} WHERE id = ${id}`)
}

export async function listManualGates() {
  await ensureCourseSchema()
  return rows(await db.execute(sql`
    SELECT m.id, m.title, m.unlock, c.title AS course FROM course_modules m JOIN courses c ON c.id = m.course_id
    WHERE m.unlock->>'type' = 'manual' ORDER BY c.title, m.pos`)).map((r) => ({ id: String(r.id), title: String(r.title), course: String(r.course), unlock: j<Unlock>(r.unlock, { type: 'none' }) }))
}

export async function setManualGate(moduleId: string, open: boolean) {
  await ensureCourseSchema()
  await db.execute(sql`UPDATE course_modules SET unlock = jsonb_set(unlock, '{open}', ${open ? 'true' : 'false'}::jsonb) WHERE id = ${moduleId} AND unlock->>'type' = 'manual'`)
}
