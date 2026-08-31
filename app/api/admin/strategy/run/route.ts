import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { runAgent } from '@/lib/strategy/run'
import { activePrompt } from '@/lib/strategy/prompt'
import { missingFor } from '@/lib/strategy/facts'

export const runtime = 'nodejs'
export const maxDuration = 300

/**
 * Einen Agenten laufen lassen.
 *
 * Fehlende Eingangs-Fakten brechen den Lauf nicht ab, sie werden gemeldet — der
 * Agent arbeitet ohne sie und kennzeichnet, wo sie fehlen. Wer trotzdem wissen
 * will, was fehlt, bevor Geld fliesst, ruft GET auf.
 */
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.role || (session.user.role !== 'admin' && session.user.role !== 'coach')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  const { agentKey, stepKey, companyId, productId, stepId, blockId, extraInstruction } = body ?? {}
  if (!agentKey || !companyId) {
    return NextResponse.json({ error: 'agentKey und companyId sind Pflicht' }, { status: 400 })
  }

  const result = await runAgent({
    agentKey, stepKey: stepKey ?? 'unbekannt', companyId,
    productId: productId ?? null, stepId: stepId ?? null, blockId: blockId ?? null,
    userId: session.user.id ?? null, extraInstruction: extraInstruction ?? null,
  })
  return NextResponse.json(result, { status: result.ok ? 200 : 500 })
}

/** Was fehlt diesem Agenten, bevor er sinnvoll laufen kann? */
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.role || (session.user.role !== 'admin' && session.user.role !== 'coach')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const url = new URL(req.url)
  const agentKey = url.searchParams.get('agentKey')
  const companyId = url.searchParams.get('companyId')
  const productId = url.searchParams.get('productId')
  if (!agentKey || !companyId) {
    return NextResponse.json({ error: 'agentKey und companyId sind Pflicht' }, { status: 400 })
  }
  const p = await activePrompt(agentKey)
  if (!p) return NextResponse.json({ error: `Kein aktiver Prompt für ${agentKey}` }, { status: 404 })
  const missing = await missingFor(p.consumes ?? [], companyId, productId)
  return NextResponse.json({
    ok: true, agentKey, version: p.version, modelRole: p.model_role,
    consumes: p.consumes, produces: p.produces, missing, notes: p.notes,
  })
}
