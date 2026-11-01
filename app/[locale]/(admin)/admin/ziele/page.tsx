import Link from 'next/link'
import { listAllGoals, goalHistory, goalStatus } from '@/lib/goals/schema'
import { GoalsBoard } from '@/components/goals/GoalsBoard'

export const dynamic = 'force-dynamic'

/** Zielsetzung aller Kunden auf einem Dashboard — wo steht wer, was ist kritisch. */
export default async function AdminGoalsPage() {
  const all = await listAllGoals()
  const hist = await goalHistory(all.map((g) => g.id))
  const byCompany = new Map<string, typeof all>()
  for (const g of all) { const l = byCompany.get(g.company_id) ?? []; l.push(g); byCompany.set(g.company_id, l) }
  const counts = { on: 0, watch: 0, off: 0, open: 0 }
  for (const g of all) counts[goalStatus(g).state]++

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-bold text-gray-900">Zielsetzung der Kunden</h1>
      <p className="mt-1 text-sm text-gray-500">Aktive KPIs je Kunde und Team. Pflege je Kunde unter „Kunden &amp; Teams“.</p>
      <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
        <span className="rounded-full bg-[#ECFDF3] px-3 py-1 text-[#027A48]">{counts.on} im Plan</span>
        <span className="rounded-full bg-[#FFFAEB] px-3 py-1 text-[#B54708]">{counts.watch} beobachten</span>
        <span className="rounded-full bg-[#FEF3F2] px-3 py-1 text-[#B42318]">{counts.off} kritisch</span>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-600">{counts.open} ohne Wert</span>
      </div>
      {byCompany.size === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">Noch keine Ziele angelegt.</p>
      ) : [...byCompany.entries()].map(([cid, goals]) => (
        <section key={cid} className="mt-10">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-bold text-gray-900">{goals[0].company_name}</h2>
            <Link href={`/admin/companies/${cid}#ziele` as '/'} className="text-xs font-semibold text-blue-700 hover:underline">Ziele bearbeiten →</Link>
          </div>
          <GoalsBoard goals={goals} history={hist} compact />
        </section>
      ))}
    </div>
  )
}
