import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { extractPostData } from '@/lib/blog/data'

export const runtime = 'nodejs'
export const maxDuration = 60

/** Schlägt die Datenschicht eines Beitrags aus dem Text vor. Übernommen wird erst beim Speichern. */
export async function POST(req: Request) {
  const s = await auth()
  if (!(s?.user?.role === 'admin' || s?.user?.role === 'coach')) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null)
  if (!body?.content?.trim()) return NextResponse.json({ error: 'Kein Text' }, { status: 400 })
  try {
    const data = await extractPostData({ title: body.title ?? '', subtitle: body.subtitle ?? '', content: body.content })
    return NextResponse.json({ ok: true, data })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Fehler' }, { status: 500 })
  }
}
