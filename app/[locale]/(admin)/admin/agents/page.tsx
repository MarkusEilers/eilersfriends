import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { Cpu } from 'lucide-react'
import { listAgents } from '@/lib/agents/run'
import { ensureAgentSchema } from '@/lib/agents/schema'
import { AgentConsole } from '@/components/agents/AgentConsole'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default async function AdminAgentsPage() {
  await ensureAgentSchema()

  /**
   * Wer welche Firmen sieht.
   *
   * Die Seite liegt hinter dem Admin-Schutz, aber dort kommt auch die Rolle
   * „coach" durch — und ein Coach gehoert zu einer Firma. Eine Auswahlliste,
   * die alle Mandanten zeigt, verraet schon durch ihre blosse Existenz, wer
   * sonst noch Kunde ist.
   *
   * Deshalb wird hier gefiltert und nicht darauf vertraut, dass die Seite
   * nie jemand anderem offensteht. Dasselbe gilt fuer die Liste der Laeufe:
   * Fremde Auftraege gehen niemanden etwas an.
   */
  const session = await auth()
  const istAdmin = session?.user?.role === 'admin'
  // Die Firma steht nicht in der Sitzung, sondern am Benutzer. Sie hier zu
  // holen ist ein Zugriff mehr und dafuer eine Wahrheit weniger, die
  // veralten kann.
  const eigeneFirma = istAdmin ? null : (
    (await db.execute(sql`
      SELECT company_id FROM public.users WHERE id = ${session?.user?.id ?? null}::uuid LIMIT 1`)
    ) as unknown as Array<{ company_id: string | null }>)[0]?.company_id ?? null

  const [agents, packs, runs, orgs] = await Promise.all([
    listAgents(),
    db.execute(sql`
      SELECT p.key, p.kind, p.name, p.org_id IS NOT NULL AS eigen,
             (SELECT COUNT(*)::int FROM knowledge_items i WHERE i.pack_id = p.id) AS items
      FROM knowledge_packs p
      WHERE p.is_active
        AND (${istAdmin} OR p.org_id IS NULL OR p.org_id = ${eigeneFirma}::uuid)
      ORDER BY p.kind, p.key`),
    db.execute(sql`
      SELECT r.id, r.agent_key, r.status, r.started_at, r.tokens_in, r.tokens_out,
             r.amount_eur, c.name AS org_name
      FROM agent_runs r LEFT JOIN companies c ON c.id = r.org_id
      WHERE ${istAdmin} OR r.org_id IS NULL OR r.org_id = ${eigeneFirma}::uuid
      ORDER BY r.started_at DESC LIMIT 25`),
    db.execute(sql`
      SELECT id, name FROM companies
      WHERE ${istAdmin} OR id = ${eigeneFirma}::uuid
      ORDER BY name LIMIT 200`),
  ])

  return (
    <div>
      <div className="mb-6">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-blue-600">
          <Cpu size={12} /> Dienst-Schicht
        </span>
        <h1 className="mt-1.5 text-2xl font-bold text-gray-900">Agenten</h1>
        <p className="mt-1 text-sm text-gray-500">
          Dieselben Läufe stehen über die Schnittstelle und als Werkzeug in Claude bereit — hier sieht man sie.
        </p>
      </div>
      <AgentConsole
        agents={agents as never} packs={packs as never} runs={runs as never} orgs={orgs as never}
      />
    </div>
  )
}
