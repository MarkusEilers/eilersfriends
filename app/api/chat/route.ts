import { NextResponse } from 'next/server'
import { runBrainClaude, buildSystem, type Msg } from '@/lib/brain/core'

export const runtime = 'nodejs'
export const maxDuration = 30

const FALLBACK = 'Ich bin gerade kurz nicht am Netz — schreib uns direkt: team@eilersfriends.com, oder buch ein Gespräch über /kontakt. Ich melde mich, sobald ich wieder da bin.'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as Record<string, unknown>))
  const raw = Array.isArray((body as { messages?: unknown }).messages) ? (body as { messages: unknown[] }).messages : []
  const messages: Msg[] = raw
    .filter((m): m is Msg => !!m && typeof m === 'object'
      && ((m as Msg).role === 'user' || (m as Msg).role === 'assistant')
      && typeof (m as Msg).content === 'string')
    .slice(-12)
    .map((m) => ({ role: m.role, content: String(m.content).slice(0, 2000) }))

  if (messages.length === 0) return NextResponse.json({ error: 'no messages' }, { status: 400 })

  // Zentrales Brain (Claude, gleiches Regelwerk + Wissen + Tools wie Voice)
  const r = await runBrainClaude({ channel: 'chat', messages }).catch(() => null)
  if (r && r.reply) return NextResponse.json({ reply: r.reply })

  // Fallback: OpenAI mit demselben System-Prompt (ohne Tools), sonst freundlicher Fallback
  const openai = process.env.OPENAI_API_KEY
  if (openai) {
    try {
      const system = await buildSystem('chat', {})
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openai}` },
        body: JSON.stringify({ model: 'gpt-4o-mini', temperature: 0.7, max_tokens: 400, messages: [{ role: 'system', content: system }, ...messages] }),
      })
      const data = await res.json().catch(() => ({}))
      const reply = (data?.choices?.[0]?.message?.content ?? '').trim()
      if (reply) return NextResponse.json({ reply })
    } catch { /* fall through */ }
  }
  return NextResponse.json({ reply: FALLBACK })
}
