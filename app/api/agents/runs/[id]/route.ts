import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { verifyApiKey, hasScope } from '@/lib/events/auth'
import { getRun, advance } from '@/lib/agents/run'

export const runtime = 'nodejs'
export const maxDuration = 300

async function allowed(req: Request) {
  const s = await auth()
  if (s?.user?.role === 'admin' || s?.user?.role === 'coach') return true
  const key = await verifyApiKey(req.headers.get('authorization'))
  return Boolean(key && hasScope(key, 'agents:run'))
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await allowed(req))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await params
  const data = await getRun(id)
  return data ? NextResponse.json({ ok: true, ...data }) : NextResponse.json({ error: 'nicht gefunden' }, { status: 404 })
}

/** Weiterlaufen lassen. Das ist der Antrieb, solange keine Warteschlange daran haengt. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await allowed(req))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await params
  const res = await advance(id)
  return NextResponse.json({ ok: true, run: res }, { status: res.status === 'fertig' ? 200 : 202 })
}
