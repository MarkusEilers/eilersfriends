import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { listAgents } from '@/lib/agents/run'
import { seedWriterKnowledge, seedWriterAgent, seedHandoffKnowledge, seedLongformAgent } from '@/lib/agents/seed'
import { ensureAgentSchema } from '@/lib/agents/schema'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const maxDuration = 120

async function guard() {
  const s = await auth()
  const r = s?.user?.role
  return r === 'admin' || r === 'coach'
}

export async function GET() {
  if (!(await guard())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  await ensureAgentSchema()
  const runs = await db.execute(sql`
    SELECT r.id, r.agent_key, r.status, r.started_at, r.finished_at, r.tokens_in, r.tokens_out,
           r.amount_eur, c.name AS org_name
    FROM agent_runs r LEFT JOIN companies c ON c.id = r.org_id
    ORDER BY r.started_at DESC LIMIT 30`)
  const packs = await db.execute(sql`
    SELECT p.key, p.kind, p.name, p.org_id IS NOT NULL AS eigen,
           (SELECT COUNT(*)::int FROM knowledge_items i WHERE i.pack_id = p.id) AS items
    FROM knowledge_packs p WHERE p.is_active ORDER BY p.kind, p.key`)
  return NextResponse.json({
    ok: true, agents: await listAgents(),
    runs: runs as unknown as unknown[], packs: packs as unknown as unknown[],
  })
}

/** Startbestueckung — idempotent, legt je Aufruf eine neue Agenten-Fassung an. */
export async function POST(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { was } = (await req.json().catch(() => ({}))) ?? {}
  // Die Pakete aus dem Handoff sind die genauere Quelle — sie ersetzen die
  // Startbestueckung unter denselben Schluesseln.
  if (was === 'basis') await seedWriterKnowledge()
  else await seedHandoffKnowledge()
  const writer = await seedWriterAgent()
  const longform = await seedLongformAgent()
  return NextResponse.json({ ok: true, agents: { writer, longform } })
}
