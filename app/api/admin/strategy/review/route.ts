import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { review } from '@/lib/strategy/review'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const maxDuration = 120

/**
 * Einen Pruefer ansetzen — auf Fakten (keys) oder auf einen Text.
 *
 * Die Pruefer schreiben keine Fakten. Ihre Befunde landen in strategy_reviews
 * und warten dort auf einen Menschen. Ein Pruefer, der selbst korrigieren darf,
 * ist kein Pruefer mehr, sondern ein zweiter Schreiber.
 */
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.role || (session.user.role !== 'admin' && session.user.role !== 'coach')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const { companyId, productId, agentKey, keys, text, stepKey, stepId } = (await req.json().catch(() => ({}))) ?? {}
  if (!companyId || !agentKey) {
    return NextResponse.json({ error: 'companyId und agentKey sind Pflicht' }, { status: 400 })
  }
  const res = await review({
    companyId, productId: productId ?? null, agentKey,
    keys: Array.isArray(keys) ? keys : undefined, text: typeof text === 'string' ? text : undefined,
    stepKey, stepId: stepId ?? null, userId: session.user.id ?? null,
  })
  return NextResponse.json(res, { status: res.ok ? 200 : 400 })
}

/** Die Befunde zu einem Kunden, neueste zuerst. */
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.role || (session.user.role !== 'admin' && session.user.role !== 'coach')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const url = new URL(req.url)
  const companyId = url.searchParams.get('companyId')
  if (!companyId) return NextResponse.json({ error: 'companyId ist Pflicht' }, { status: 400 })
  const rows = await db.execute(sql`
    SELECT id, agent_key, kind, verdict, findings, created_at
    FROM strategy_reviews WHERE company_id = ${companyId}
    ORDER BY created_at DESC LIMIT 50`)
  return NextResponse.json({ ok: true, reviews: rows })
}
