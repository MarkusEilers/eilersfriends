import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { verifyApiKey, hasScope } from '@/lib/events/auth'
import { activeAgent, startRun, advance } from '@/lib/agents/run'

export const runtime = 'nodejs'
export const maxDuration = 300

/**
 * Zwei Wege herein: angemeldet in unserer Oberflaeche, oder mit einem
 * API-Schluessel und dem Scope agents:run. Derselbe Kern, dieselbe Abrechnung —
 * ein Kunde bekommt nichts anderes als wir, nur ein anderes Wissenspaket.
 */
async function who(req: Request, needed: string) {
  const s = await auth()
  if (s?.user?.role === 'admin' || s?.user?.role === 'coach') {
    return { kind: 'ui' as const, userId: s.user.id ?? null }
  }
  const key = await verifyApiKey(req.headers.get('authorization'))
  if (key && hasScope(key, needed)) return { kind: 'api' as const, userId: null }
  return null
}

export async function POST(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params
  const ctx = await who(req, 'agents:run')
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const agent = await activeAgent(key)
  if (!agent) return NextResponse.json({ error: `Kein aktiver Agent "${key}"` }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const run = await startRun({
    agentKey: key, input: body?.input ?? body ?? {},
    orgId: body?.orgId ?? null, productId: body?.productId ?? null,
    userId: ctx.userId, via: ctx.kind,
  })

  // Gleich so weit laufen, wie das Zeitbudget reicht. Wer wartet, hat oft schon
  // das Ergebnis; wer nicht, bekommt die Kennung und fragt nach.
  const wait = body?.wait !== false
  const res = wait ? await advance(run.id) : run
  return NextResponse.json({ ok: true, run: res }, { status: res.status === 'fertig' ? 200 : 202 })
}

export async function GET(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params
  const ctx = await who(req, 'agents:run')
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const agent = await activeAgent(key)
  if (!agent) return NextResponse.json({ error: 'nicht gefunden' }, { status: 404 })
  return NextResponse.json({
    ok: true,
    agent: {
      key: agent.key, version: agent.version, title: agent.title, description: agent.description,
      input_schema: agent.input_schema, output_schema: agent.output_schema,
      steps: agent.steps.map((s) => ({ key: s.key, kind: s.kind, title: s.title })),
      knowledge: agent.knowledge,
    },
  })
}
