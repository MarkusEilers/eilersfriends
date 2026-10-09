import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { listTeams, listMembers } from '@/lib/org/schema'

const ROLE_LABEL: Record<string, string> = { owner: 'Owner', admin: 'PowerUser', lead: 'Lead', member: 'Member', viewer: 'Viewer' }
const PROGRAM_ROLE_LABEL: Record<string, string> = { marketing: 'Marketing', sales: 'Sales', programm: 'Programm' }

export default async function CompanyTeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [co] = (await db.execute(sql`SELECT id, name, domain FROM companies WHERE id=${id}`)) as unknown as { id: string; name: string; domain: string | null }[]
  if (!co) notFound()
  const [teams, members] = await Promise.all([listTeams(id), listMembers(id)])
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900">{co.name}</h1>
      <p className="mt-1 text-sm text-gray-500">{co.domain} · {teams.length} Teams · {new Set(members.map((m) => m.user_id)).size} Mitglieder</p>
      <div className="mt-6 space-y-5">
        {teams.map((t) => {
          const ms = members.filter((m) => m.team_id === t.id)
          return (
            <div key={t.id} className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-baseline justify-between">
                <h2 className="text-base font-bold text-gray-900">{t.name}</h2>
                <span className="text-xs text-gray-400">{t.program_role_key ? `in Programmen: ${PROGRAM_ROLE_LABEL[t.program_role_key] ?? t.program_role_key}` : 'kein Programm-Team'}</span>
              </div>
              <ul className="mt-3 divide-y divide-gray-50">
                {ms.map((m) => (
                  <li key={m.id} className="flex items-center justify-between py-2 text-sm">
                    <span><span className="font-medium text-gray-900">{m.name}</span> <span className="text-gray-400">{m.email}</span>{m.title ? <span className="text-gray-500"> · {m.title}</span> : null}</span>
                    <span className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${m.org_role === 'admin' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{ROLE_LABEL[m.org_role] ?? m.org_role}</span>
                      <span className="text-[11px] text-gray-400">{m.has_login ? 'Login aktiv' : m.invited_at ? 'eingeladen' : 'nicht eingeladen'}</span>
                    </span>
                  </li>))}
                {!ms.length && <li className="py-2 text-sm text-gray-400">Noch niemand im Team.</li>}
              </ul>
            </div>)
        })}
      </div>
    </div>
  )
}
