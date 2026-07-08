import { NextRequest, NextResponse } from 'next/server'
import { voiceAuthorized } from '@/lib/voice/auth'
import { auth } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Die 3 gelabelten Stimmen (siehe Relay). a = AIlisabeth (Lola, w), b = AIlexander
// (Axel, m), matilda = AIlisabeth-Fallback (Matilda, w).
const VOICE_IDS: Record<string, string> = {
  a: 'SiMvlSW9cKKHDYT4BzOp',
  b: 'E77N7V3flAUuuy7eDa10',
  matilda: 'XrExE9yKIg1WjnnlVkGX',
}

async function isAdmin() {
  try { const s = await auth(); return !!s?.user && (s.user.role === 'admin' || s.user.role === 'coach') } catch { return false }
}

export async function POST(req: NextRequest) {
  if (!voiceAuthorized(req) && !(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const b = await req.json().catch(() => ({} as Record<string, unknown>))
  const key = String(b.voice || 'a')
  const id = VOICE_IDS[key] || VOICE_IDS.a
  const text = String(b.text || '').slice(0, 800).trim()
  if (!text) return NextResponse.json({ error: 'no_text' }, { status: 400 })
  const EK = process.env.ELEVENLABS_API_KEY
  if (!EK) return NextResponse.json({ error: 'no_key' }, { status: 503 })
  try {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${id}?output_format=mp3_44100_128`, {
      method: 'POST', headers: { 'xi-api-key': EK, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2' }),
    })
    if (!r.ok) return NextResponse.json({ error: 'tts_failed', status: r.status }, { status: 502 })
    const buf = Buffer.from(await r.arrayBuffer())
    return new NextResponse(buf, { headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' } })
  } catch (e) {
    return NextResponse.json({ error: String((e as Error)?.message || e) }, { status: 502 })
  }
}
