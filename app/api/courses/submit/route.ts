import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { addSubmission } from '@/lib/courses/store'
import { lessonAllowed } from '@/lib/actions/courses'

export const runtime = 'nodejs'

/** Homework einreichen: Text und/oder eine vorher direkt hochgeladene Datei. */
export async function POST(req: Request) {
  const s = await auth()
  if (!s?.user?.id) return NextResponse.json({ ok: false, error: 'Nicht angemeldet' }, { status: 401 })
  const b = (await req.json().catch(() => null)) as { lessonId?: string; text?: string; fileUrl?: string; fileName?: string } | null
  const lessonId = String(b?.lessonId ?? '')
  const allowed = await lessonAllowed(s.user.id, s.user.role ?? 'client', lessonId)
  if (!allowed || allowed.lesson.kind !== 'homework') return NextResponse.json({ ok: false, error: 'Diese Homework ist für Dich nicht freigeschaltet.' }, { status: 403 })
  const text = String(b?.text ?? '').trim().slice(0, 20000) || null
  let url: string | null = String(b?.fileUrl ?? '') || null
  if (url) {
    try { if (!new URL(url).hostname.endsWith('.blob.vercel-storage.com')) url = null } catch { url = null }
  }
  if (!text && !url) return NextResponse.json({ ok: false, error: 'Bitte schreib etwas oder lade eine Datei hoch.' }, { status: 400 })
  await addSubmission(s.user.id, lessonId, text, url, url ? String(b?.fileName ?? 'Datei').slice(0, 200) : null)
  return NextResponse.json({ ok: true })
}
