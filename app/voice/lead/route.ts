import { NextRequest, NextResponse } from 'next/server'
import { voiceAuthorized } from '@/lib/voice/auth'
import { logActivity } from '@/lib/voice/store'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  if (!voiceAuthorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const b = await req.json().catch(() => ({} as Record<string, unknown>))
  await logActivity({
    type: String(b.type || 'lead'), dw: b.dw != null ? Number(b.dw) : null, personSlug: b.person ? String(b.person) : null,
    name: b.name ? String(b.name) : null, phone: b.phone ? String(b.phone) : null, email: b.email ? String(b.email) : null,
    topic: b.topic ? String(b.topic) : null, summary: b.summary ? String(b.summary) : null, transcript: b.transcript ? String(b.transcript) : null, meta: b.meta,
  })
  return NextResponse.json({ ok: true })
}
