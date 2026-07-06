import { NextRequest, NextResponse } from 'next/server'
import { voiceAuthorized } from '@/lib/voice/auth'
import { auth } from '@/lib/auth'
import { runAgent, type Msg } from '@/lib/voice/agent-core'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function isAdmin() { try { const s = await auth(); return !!s?.user && (s.user.role === 'admin' || s.user.role === 'coach') } catch { return false } }

export async function POST(req: NextRequest) {
  if (!voiceAuthorized(req) && !(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const b = await req.json().catch(() => ({} as Record<string, unknown>))
  const dw = Number(b.dw ?? 0)
  const messages: Msg[] = Array.isArray(b.messages) ? (b.messages as Msg[]) : []
  return NextResponse.json(await runAgent(dw, messages))
}
