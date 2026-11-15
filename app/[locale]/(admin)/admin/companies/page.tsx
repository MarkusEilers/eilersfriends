import Link from 'next/link'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { ensureOrgSchema } from '@/lib/org/schema'
import { createCompanyAction } from '@/lib/actions/org-admin'

export const dynamic = 'force-dynamic'

// Kunden mit Teams und Mitgliedern — nur Firmen, die schon ein Team haben,
// plus alle mit Nutzern. Die übrigen ~Lead-Firmen gehören ins CRM, nicht hierher.
export default async function CompaniesPage() {
  await ensureOrgSchema()
  const rows = (await db.execute(sql`
    SELECT c.id, c.name, c.domain,
      (SELECT count(*)::int FROM org_teams t WHERE t.company_id=c.id) AS teams,
      (SELECT count(DISTINCT m.user_id)::int FROM org_memberships m WHERE m.company_id=c.id) AS members,
      (SELECT count(*)::int FROM strategy_products p WHERE p.company_id=c.id AND p.status <> 'archived') AS products,
      (SELECT count(*)::int FROM rollouts r WHERE r.company_id=c.id) AS rollouts
    FROM companies c
    WHERE c.merged_into IS NULL AND (
      EXISTS (SELECT 1 FROM org_teams t WHERE t.company_id=c.id) OR EXISTS (SELECT 1 FROM users u WHERE u.company_id=c.id))
    ORDER BY c.name`)) as unknown as { id: string; name: string; domain: string | null; teams: number; members: number; products: number; rollouts: number }[]
  const input = 'rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400'
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900">Kunden & Teams</h1>
      <p className="mt-1 text-sm text-gray-500">Teams, Rollen und PowerUser je Kunde. Jeder Kunde hat seinen eigenen Datenbereich für Strategie, Plan und Tools.</p>

      <details className="mt-6 rounded-xl border border-gray-200 bg-white p-4" open={rows.length === 0}>
        <summary className="cursor-pointer text-sm font-semibold text-blue-700">+ Kunden anlegen</summary>
        <form action={createCompanyAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">Firma *<input name="name" required className={input} placeholder="z. B. Celero One" /></label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">Domain<input name="domain" className={input} placeholder="celero-one.com" /></label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">Branche<input name="industry" className={input} placeholder="Software" /></label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">Erstes Produkt (Strategie)<input name="product" className={input} placeholder="optional" /></label>
          <label className="flex items-center gap-2 text-sm text-gray-700 sm:col-span-2"><input type="checkbox" name="defaultTeams" defaultChecked /> Standard-Teams anlegen: Leadership · Sales & Customer Success · Marketing · Product & GTM</label>
          <div className="sm:col-span-2"><button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Anlegen</button>
            <span className="ml-3 text-xs text-gray-400">Gibt es die Firma schon (Name oder Domain), geht es dort weiter — nichts wird doppelt angelegt.</span></div>
        </form>
      </details>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-100 bg-white">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
            <th className="px-4 py-3">Firma</th><th className="px-4 py-3">Domain</th><th className="px-4 py-3">Teams</th><th className="px-4 py-3">Mitglieder</th><th className="px-4 py-3">Produkte</th><th className="px-4 py-3">Rollouts</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
              <td className="px-4 py-2.5"><Link href={`/admin/companies/${r.id}`} className="font-medium text-blue-700 hover:underline">{r.name}</Link></td>
              <td className="px-4 py-2.5 text-gray-500">{r.domain ?? '—'}</td>
              <td className="px-4 py-2.5">{r.teams}</td><td className="px-4 py-2.5">{r.members}</td>
              <td className="px-4 py-2.5">{r.products}</td><td className="px-4 py-2.5">{r.rollouts}</td>
            </tr>))}</tbody>
        </table>
      </div>
    </div>
  )
}
