import Link from 'next/link'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { ensureOrgSchema } from '@/lib/org/schema'

// Kunden mit Teams und Mitgliedern — nur Firmen, die schon ein Team haben,
// plus alle mit Nutzern. Die übrigen ~Lead-Firmen gehören ins CRM, nicht hierher.
export default async function CompaniesPage() {
  await ensureOrgSchema()
  const rows = (await db.execute(sql`
    SELECT c.id, c.name, c.domain,
      (SELECT count(*)::int FROM org_teams t WHERE t.company_id=c.id) AS teams,
      (SELECT count(DISTINCT m.user_id)::int FROM org_memberships m WHERE m.company_id=c.id) AS members
    FROM companies c
    WHERE c.merged_into IS NULL AND (
      EXISTS (SELECT 1 FROM org_teams t WHERE t.company_id=c.id) OR EXISTS (SELECT 1 FROM users u WHERE u.company_id=c.id))
    ORDER BY c.name`)) as unknown as { id: string; name: string; domain: string | null; teams: number; members: number }[]
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900">Kunden & Teams</h1>
      <p className="mt-1 text-sm text-gray-500">Teams, Rollen und PowerUser je Kunde. Grundlage für das Programmheft.</p>
      <div className="mt-6 overflow-hidden rounded-xl border border-gray-100 bg-white">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
            <th className="px-4 py-3">Firma</th><th className="px-4 py-3">Domain</th><th className="px-4 py-3">Teams</th><th className="px-4 py-3">Mitglieder</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
              <td className="px-4 py-2.5"><Link href={`/admin/companies/${r.id}`} className="font-medium text-blue-700 hover:underline">{r.name}</Link></td>
              <td className="px-4 py-2.5 text-gray-500">{r.domain ?? '—'}</td>
              <td className="px-4 py-2.5">{r.teams}</td><td className="px-4 py-2.5">{r.members}</td>
            </tr>))}</tbody>
        </table>
      </div>
    </div>
  )
}
