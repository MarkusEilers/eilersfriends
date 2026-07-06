import { NextRequest, NextResponse } from 'next/server'
import { voiceAuthorized, personForKey } from '@/lib/voice/auth'
import { setTeamStatus, removeTeamStatus } from '@/lib/voice/store'

export const runtime = 'nodejs'
const ALLOWED = ['available', 'meeting', 'training', 'vacation', 'offline', 'auto']

export async function POST(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  if (!voiceAuthorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { key } = await params
  const slug = personForKey(key)
  const b = await req.json().catch(() => ({} as Record<string, unknown>))
  const status = String(b.status || '')
  if (!ALLOWED.includes(status)) return NextResponse.json({ error: 'bad_status' }, { status: 400 })
  if (status === 'auto') await removeTeamStatus(slug)
  else await setTeamStatus(slug, status, b.until ? String(b.until) : null, b.note ? String(b.note) : null)
  return NextResponse.json({ ok: true, person: slug, status })
}
