import { NextRequest, NextResponse } from 'next/server'
import { voiceAuthorized } from '@/lib/voice/auth'

export const runtime = 'nodejs'

const SYS = `Du bist die Telefon-Assistentin von Eilers+Friends (eilersfriends.com), einer Beratung für planbaren Vertrieb (SalesMade Academy, AI-Sales) und Leadership. Antworte kurz, freundlich, telefongerecht auf Deutsch (1–3 Sätze). Bei Preis-/Vertragsdetails oder wenn du unsicher bist: nicht raten, sondern anbieten, an das Team zu verbinden oder einen Termin zu buchen.`

export async function POST(req: NextRequest) {
  if (!voiceAuthorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const b = await req.json().catch(() => ({} as Record<string, unknown>))
  const question = String(b.question || b.text || '').slice(0, 1000)
  if (!question) return NextResponse.json({ error: 'no_question' }, { status: 400 })
  const key = process.env.OPENAI_API_KEY
  if (!key) return NextResponse.json({ answer: 'Das kläre ich am besten mit dem Team — ich kann Sie gern verbinden oder einen Termin einrichten.' })
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o-mini', temperature: 0.4, max_tokens: 180, messages: [{ role: 'system', content: SYS }, { role: 'user', content: question }] }),
    })
    const d = await res.json()
    const answer = d?.choices?.[0]?.message?.content?.trim() || 'Dazu verbinde ich Sie am besten mit dem Team.'
    return NextResponse.json({ answer })
  } catch {
    return NextResponse.json({ answer: 'Dazu verbinde ich Sie am besten mit dem Team.' })
  }
}
