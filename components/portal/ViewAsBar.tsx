import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { ensureOrgSchema } from '@/lib/org/schema'
import { getViewAs } from '@/lib/view-as'
import { setViewAs } from '@/lib/actions/view-as'
import { ViewAsSelect } from './ViewAsSelect'

const ROLE: Record<string, string> = { owner: 'Owner', admin: 'PowerUser', lead: 'Lead', member: 'Member', viewer: 'Viewer' }

/** Leiste oben im Kundenbereich — nur für Eilers+Friends sichtbar. */
export async function ViewAsBar() {
  await ensureOrgSchema()
  const current = await getViewAs()
  const rows = (await db.execute(sql`
    SELECT c.id AS company_id, c.name AS company, t.key AS team_key, t.name AS team, u.id AS user_id, u.name AS user_name, m.org_role
    FROM companies c
    JOIN org_teams t ON t.company_id=c.id
    LEFT JOIN org_memberships m ON m.team_id=t.id
    LEFT JOIN users u ON u.id=m.user_id
    ORDER BY c.name, t.sort_order, u.name`)) as unknown as
    { company_id: string; company: string; team_key: string; team: string; user_id: string | null; user_name: string | null; org_role: string | null }[]

  const groups: { label: string; options: { value: string; label: string }[] }[] = []
  for (const cid of [...new Set(rows.map((r) => r.company_id))]) {
    const rs = rows.filter((r) => r.company_id === cid)
    const co = rs[0].company
    const opts = [{ value: JSON.stringify({ companyId: cid, label: `${co} · Gesamtsicht` }), label: `${co} · Gesamtsicht (Eilers+Friends)` }]
    for (const tk of [...new Set(rs.map((r) => r.team_key))]) {
      const t = rs.find((r) => r.team_key === tk)!
      opts.push({ value: JSON.stringify({ companyId: cid, teamKey: tk, label: `${co} · Team ${t.team}` }), label: `Team: ${t.team}` })
    }
    for (const r of rs.filter((x) => x.user_id)) {
      opts.push({ value: JSON.stringify({ companyId: cid, userId: r.user_id, label: `${co} · ${r.user_name}` }), label: `Person: ${r.user_name} (${ROLE[r.org_role ?? ''] ?? r.org_role} · ${r.team})` })
    }
    groups.push({ label: co, options: opts })
  }

  return (
    <div className={`sticky top-0 z-30 flex flex-wrap items-center gap-3 border-b px-6 py-2 text-xs ${current ? 'border-purple-300 bg-purple-600 text-white' : 'border-purple-100 bg-purple-50 text-purple-900'}`}>
      <span className="font-bold uppercase tracking-widest">{current ? 'Vorschau' : 'Ansehen als'}</span>
      {current && <span className="font-semibold">{current.label ?? 'Kunde'}{current.userId || current.teamKey ? ' · nur Ansicht' : ''}</span>}
      <ViewAsSelect groups={groups} current={current ? JSON.stringify({ companyId: current.companyId, ...(current.teamKey ? { teamKey: current.teamKey } : {}), ...(current.userId ? { userId: current.userId } : {}), label: current.label }) : ''} action={setViewAs} dark={!!current} />
      {current && (
        <form action={setViewAs} className="ml-auto">
          <input type="hidden" name="value" value="" /><input type="hidden" name="next" value="/dashboard" />
          <button className="rounded-md bg-white/20 px-2.5 py-1 font-semibold hover:bg-white/30">Vorschau beenden</button>
        </form>
      )}
    </div>
  )
}
