import { NextRequest, NextResponse } from 'next/server'
import { voiceAuthorized } from '@/lib/voice/auth'
import { auth } from '@/lib/auth'
import { knowledgeContext } from '@/lib/voice/knowledge'

export const runtime = 'nodejs'

const SYS = `Du bist die Telefon-Assistentin von Eilers+Friends (eilersfriends.com) — Beratung für planbaren Vertrieb (SalesMade Academy, AI im Sales) und Leadership. Antworte kurz, freundlich, telefongerecht auf Deutsch (1–3 Sätze). Bei Preis-/Vertragsdetails oder Unsicherheit: nicht raten, sondern anbieten, ans Team zu verbinden oder einen Termin zu buchen.`
const FALLBACK = 'Das kläre ich am besten mit dem Team — ich kann Sie gern verbinden oder einen Termin einrichten.'

async function isAdmin() { try { const s = await auth(); return !!s?.user && (s.user.role === 'admin' || s.user.role === 'coach') } catch { return false } }

export async function POST(req: NextRequest) {
  if (!voiceAuthorized(req) && !(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const b = await req.json().catch(() => ({} as Record<string, unknown>))
  const question = String(b.question || b.text || '').slice(0, 1000)
  if (!question) return NextResponse.json({ error: 'no_question' }, { status: 400 })
  const SYSTEM = SYS + '\n\n' + await knowledgeContext()

  // Bevorzugt Claude (Anthropic), sonst OpenAI, sonst freundlicher Fallback
  const anthropic = process.env.ANTHROPIC_API_KEY
  if (anthropic) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'x-api-key': anthropic, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model: process.env.VOICE_AGENT_MODEL || 'claude-sonnet-4-6', max_tokens: 200, system: SYSTEM, messages: [{ role: 'user', content: question }] }),
      })
      const d = await res.json()
      const answer = Array.isArray(d?.content) ? d.content.filter((c: { type: string }) => c.type === 'text').map((c: { text: string }) => c.text).join(' ').trim() : ''
      if (answer) return NextResponse.json({ answer })
    } catch { /* fall through */ }
  }
  const openai = process.env.OPENAI_API_KEY
  if (openai) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST', headers: { Authorization: `Bearer ${openai}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-4o-mini', temperature: 0.4, max_tokens: 180, messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: question }] }),
      })
      const d = await res.json()
      const answer = d?.choices?.[0]?.message?.content?.trim()
      if (answer) return NextResponse.json({ answer })
    } catch { /* fall through */ }
  }
  return NextResponse.json({ answer: FALLBACK })
}
