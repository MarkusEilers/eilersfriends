import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/errors/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function pingAI(): Promise<{ provider: string; working: boolean; detail?: string }> {
  const anthropic = process.env.ANTHROPIC_API_KEY
  if (anthropic) {
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'x-api-key': anthropic, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, body: JSON.stringify({ model: process.env.VOICE_AGENT_MODEL || 'claude-sonnet-4-6', max_tokens: 8, messages: [{ role: 'user', content: 'ping' }] }) })
      const d = await r.json()
      if (r.ok && Array.isArray(d?.content)) return { provider: 'anthropic', working: true }
      return { provider: 'anthropic', working: false, detail: d?.error?.message || `HTTP ${r.status}` }
    } catch (e) { return { provider: 'anthropic', working: false, detail: String(e) } }
  }
  const openai = process.env.OPENAI_API_KEY
  if (openai) {
    try {
      const r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${openai}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'gpt-4o-mini', max_tokens: 5, messages: [{ role: 'user', content: 'ping' }] }) })
      const d = await r.json()
      if (r.ok && d?.choices?.[0]) return { provider: 'openai', working: true }
      return { provider: 'openai', working: false, detail: d?.error?.message || `HTTP ${r.status}` }
    } catch (e) { return { provider: 'openai', working: false, detail: String(e) } }
  }
  return { provider: 'none', working: false, detail: 'kein AI-Key gesetzt' }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const ai = await pingAI()
  if (!ai.working) {
    await logError({ level: 'warn', source: 'health', status: 503, message: `Chat/AI-Check fehlgeschlagen (${ai.provider}): ${ai.detail}`, url: '/api/cron/health-check' })
  }
  return NextResponse.json({ ok: true, ai })
}
