import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { listTeams, listMembers } from '@/lib/org/schema'
import { ensureRolloutSchema } from '@/lib/rollouts/schema'
import { decideChange } from '@/lib/actions/rollouts-admin'
import { InviteButton } from '@/components/admin/InviteButton'

const ROLE_LABEL: Record<string, string> = { owner: 'Owner', admin: 'PowerUser', lead: 'Lead', member: 'Member', viewer: 'Viewer' }
const PROGRAM_ROLE_LABEL: Record<string, string> = { marketing: 'Marketing', sales: 'Sales', programm: 'Programm' }
const fmt = (d: string | null) => (d ? new Date(d + 'T12:00:00Z').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—')

export default async function CompanyTeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await ensureRolloutSchema()
  const [co] = (await db.execute(sql`SELECT id, name, domain FROM companies WHERE id=${id}`)) as unknown as { id: string; name: string; domain: string | null }[]
  if (!co) notFound()
  const [teams, members] = await Promise.all([listTeams(id), listMembers(id)])
  const rollouts = (await db.execute(sql`
    SELECT r.id, r.title, r.code_prefix, r.color, r.start_date::text AS start_date, r.end_date::text AS end_date, r.cadence, r.locale, r.phase, r.created_from, v.version,
      (SELECT count(*)::int FROM rollout_steps s WHERE s.rollout_id=r.id) AS steps,
      (SELECT count(*)::int FROM rollout_steps s WHERE s.rollout_id=r.id AND s.status='done') AS done,
      (SELECT count(*)::int FROM rollout_items i JOIN rollout_steps s ON s.id=i.rollout_step_id WHERE s.rollout_id=r.id) AS items,
      (SELECT count(*)::int FROM rollout_items i JOIN rollout_steps s ON s.id=i.rollout_step_id WHERE s.rollout_id=r.id AND i.done_at IS NOT NULL) AS items_done
    FROM rollouts r JOIN program_versions v ON v.id=r.program_version_id WHERE r.company_id=${id} ORDER BY r.start_date`)) as unknown as
    { id: string; title: string; code_prefix: string; color: string; start_date: string | null; end_date: string | null; cadence: string; locale: string; phase: string; created_from: string; version: string; steps: number; done: number; items: number; items_done: number }[]
  const changes = (await db.execute(sql`
    SELECT c.id, c.kind, c.payload, c.reason, c.status, c.proposed_by_name, c.created_at::text AS created_at, c.before, s.code
    FROM rollout_changes c JOIN rollouts r ON r.id=c.rollout_id LEFT JOIN rollout_steps s ON s.id=c.rollout_step_id
    WHERE r.company_id=${id} ORDER BY (c.status='proposed') DESC, c.created_at DESC LIMIT 30`)) as unknown as
    { id: string; kind: string; payload: { proposedStart?: string | null; cadence?: string | null }; reason: string | null; status: string; proposed_by_name: string | null; created_at: string; before: Record<string, string> | null; code: string | null }[]

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900">{co.name}</h1>
      <p className="mt-1 text-sm text-gray-500">{co.domain} · {teams.length} Teams · {new Set(members.map((m) => m.user_id)).size} Mitglieder</p>

      <div className="mt-6 flex items-baseline justify-between">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Programme (Rollouts)</h2>
        <Link href={`/dashboard/guide?company=${id}` as '/'} className="text-xs font-semibold text-blue-700 hover:underline">Programm Guide als Kunde ansehen →</Link>
      </div>
      <div className="mt-2 overflow-hidden rounded-xl border border-gray-100 bg-white">
        <table className="w-full text-sm">
          <tbody>{rollouts.map((r) => (
            <tr key={r.id} className="border-b border-gray-50 last:border-0">
              <td className="px-4 py-2.5"><span className="mr-2 inline-block rounded px-1.5 py-0.5 text-[11px] font-bold text-white" style={{ backgroundColor: r.color }}>{r.code_prefix}</span><span className="font-medium text-gray-900">{r.title}</span></td>
              <td className="px-4 py-2.5 text-gray-500">{fmt(r.start_date)} – {fmt(r.end_date)}</td>
              <td className="px-4 py-2.5 text-gray-500">{r.cadence === 'weekly' ? 'wöchentlich' : 'zweiwöchentlich'} · {r.locale.toUpperCase()}</td>
              <td className="px-4 py-2.5 text-gray-500">v{r.version}</td>
              <td className="px-4 py-2.5 text-gray-700">{r.done}/{r.steps} Schritte · {r.items_done}/{r.items} ✓</td>
              <td className="px-4 py-2.5">{r.phase === 'beta' && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">Beta</span>}</td>
            </tr>))}
            {!rollouts.length && <tr><td className="px-4 py-4 text-sm text-gray-400">Noch kein Rollout. Entsteht automatisch, sobald ein Angebot mit Programm unterschrieben ist.</td></tr>}
          </tbody>
        </table>
      </div>

      {changes.length > 0 && (
        <>
          <h2 className="mt-8 text-sm font-bold uppercase tracking-widest text-gray-400">Änderungsvorschläge</h2>
          <div className="mt-2 space-y-2">
            {changes.map((c) => (
              <div key={c.id} className="rounded-xl border border-gray-200 bg-white p-4 text-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span><b>{c.code ?? '—'}</b> · {c.kind} · {c.proposed_by_name ?? '?'} · {fmt(c.created_at.slice(0, 10))}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${c.status === 'proposed' ? 'bg-amber-50 text-amber-700' : c.status === 'accepted' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{c.status === 'proposed' ? 'offen' : c.status === 'accepted' ? 'angenommen' : 'abgelehnt'}</span>
                </div>
                {c.reason && <p className="mt-1 text-gray-700">{c.reason}</p>}
                <p className="mt-1 text-xs text-gray-500">
                  {c.payload?.proposedStart ? <>Start {fmt(c.before?.planned_start ?? null)} → <b>{fmt(c.payload.proposedStart)}</b>. </> : null}
                  {c.payload?.cadence ? <>Kadenz {c.before?.cadence} → <b>{c.payload.cadence}</b> (terminiert offene Schritte neu). </> : null}
                </p>
                {c.status === 'proposed' && (
                  <form action={decideChange} className="mt-2 flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={c.id} /><input type="hidden" name="companyId" value={id} />
                    <input name="note" placeholder="Notiz (optional)" className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-xs" />
                    <button name="decision" value="accepted" className="rounded-lg bg-green-600 px-3 py-1 text-xs font-semibold text-white">Annehmen</button>
                    <button name="decision" value="rejected" className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600">Ablehnen</button>
                  </form>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="mt-8 text-sm font-bold uppercase tracking-widest text-gray-400">Teams</h2>
      <div className="mt-2 space-y-4">
        {teams.map((t) => {
          const ms = members.filter((m) => m.team_id === t.id)
          return (
            <div key={t.id} className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-baseline justify-between">
                <h3 className="text-base font-bold text-gray-900">{t.name}</h3>
                <span className="text-xs text-gray-400">{t.program_role_key ? `in Programmen: ${PROGRAM_ROLE_LABEL[t.program_role_key] ?? t.program_role_key}` : 'kein Programm-Team'}</span>
              </div>
              <ul className="mt-3 divide-y divide-gray-50">
                {ms.map((m) => (
                  <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                    <span><span className="font-medium text-gray-900">{m.name}</span> <span className="text-gray-400">{m.email}</span>{m.title ? <span className="text-gray-500"> · {m.title}</span> : null}</span>
                    <span className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${m.org_role === 'admin' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{ROLE_LABEL[m.org_role] ?? m.org_role}</span>
                      <span className="text-[11px] text-gray-400">{m.has_login ? 'Login aktiv' : m.invited_at ? 'Link erzeugt' : 'nicht eingeladen'}</span>
                      <InviteButton userId={m.user_id} companyId={id} hasLogin={m.has_login} />
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
