import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { generateHero, storeUpload } from '@/lib/blog/images'

export const runtime = 'nodejs'
export const maxDuration = 300

async function guard() {
  const s = await auth()
  const r = s?.user?.role
  return r === 'admin' || r === 'coach'
}

/** Erzeugen. Der Auftrag kommt aus dem Helfer oder von Hand. */
export async function POST(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { prompt, slug } = (await req.json().catch(() => ({}))) ?? {}
  if (!prompt) return NextResponse.json({ error: 'prompt ist Pflicht' }, { status: 400 })
  try {
    return NextResponse.json({ ok: true, ...(await generateHero(prompt, slug || 'beitrag')) })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

/** Hochladen. Wer ein eigenes Bild hat, braucht keines erzeugen zu lassen. */
export async function PUT(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const form = await req.formData()
  const file = form.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'Keine Datei' }, { status: 400 })
  if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: 'Groesser als 8 MB' }, { status: 400 })
  try {
    return NextResponse.json({ ok: true, url: await storeUpload(file, String(form.get('slug') ?? 'beitrag')) })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
