import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { generatePostAudio } from '@/lib/blog/audio'

export const runtime = 'nodejs'
export const maxDuration = 300

/** Vorlesefassung eines Beitrags (neu) erzeugen: POST /api/admin/blog/audio?id=…&force=1 */
export async function POST(req: Request) {
  const s = await auth()
  if (s?.user?.role !== 'admin' && s?.user?.role !== 'coach') return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const u = new URL(req.url)
  const id = u.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id ist Pflicht' }, { status: 400 })
  try {
    return NextResponse.json({ ok: true, ...(await generatePostAudio(id, { force: u.searchParams.get('force') === '1' })) })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Fehler' }, { status: 500 })
  }
}
