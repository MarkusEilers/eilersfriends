import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { listAgents } from '@/lib/agents/run'
import { seedWriterKnowledge, seedWriterAgent, seedHandoffKnowledge, seedLongformAgent, seedVeredelnAgent } from '@/lib/agents/seed'
import { ensureAgentSchema } from '@/lib/agents/schema'
import { ingestMaterial } from '@/lib/agents/ingest'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const maxDuration = 300

async function guard(req?: Request) {
  const s = await auth()
  const r = s?.user?.role
  if (r === 'admin' || r === 'coach') return true
  // Das Bestuecken ist idempotent und liest nur Dateien aus dem Repo. Damit es
  // nach einem Deploy automatisch laufen kann, zaehlt auch das Cron-Geheimnis.
  const secret = process.env.CRON_SECRET
  return Boolean(secret && req?.headers.get('authorization') === `Bearer ${secret}`)
}

export async function GET(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  await ensureAgentSchema()

  // Einen abgelegten Auftrag abholen — praktisch, um einen langen Handoff nicht
  // durch das Formular tippen zu muessen.
  const pack = new URL(req.url).searchParams.get('pack')
  if (pack) {
    const rows = await db.execute(sql`
      SELECT i.body FROM knowledge_items i JOIN knowledge_packs p ON p.id = i.pack_id
      WHERE p.key = ${pack} AND i.key = 'payload' LIMIT 1`)
    const body = (rows as unknown as { body: string }[])[0]?.body
    if (!body) return NextResponse.json({ error: 'nicht gefunden' }, { status: 404 })
    return NextResponse.json({ ok: true, payload: JSON.parse(body) })
  }
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
  if (!(await guard(req))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { was } = (await req.json().catch(() => ({}))) ?? {}
  // Die Pakete aus dem Handoff sind die genauere Quelle — sie ersetzen die
  // Startbestueckung unter denselben Schluesseln.
  if (was === 'basis') await seedWriterKnowledge()
  else await seedHandoffKnowledge()
  // Zuletzt das Material aus den Skill-Ordnern — es ersetzt jedes Paket, das
  // es selbst besitzt (Kernregelwerk, Verbotsliste, Stimmen, Vorlagen, Hooks).
  // Die Reihenfolge ist Absicht: die Dateien sind die Quelle, die
  // Startbestueckung nur das, was ohne sie da waere.
  const material = await ingestMaterial()

  const writer = await seedWriterAgent()
  const longform = await seedLongformAgent()
  const veredeln = await seedVeredelnAgent()
  return NextResponse.json({ ok: true, agents: { writer, longform, veredeln }, material })
}
