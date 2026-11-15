import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { listTeams, listMembers } from '@/lib/org/schema'
import { ensureRolloutSchema } from '@/lib/rollouts/schema'
import { decideChange } from '@/lib/actions/rollouts-admin'
import { InviteButton } from '@/components/admin/InviteButton'
import { setViewAs } from '@/lib/actions/view-as'
import { listGoals, goalHistory, GOAL_TEMPLATES } from '@/lib/goals/schema'
import { GoalsBoard } from '@/components/goals/GoalsBoard'
import { GoalsEditor } from '@/components/goals/GoalsEditor'
import { updateCompanyAction, createTeamAction, addDefaultTeamsAction, updateTeamAction, addMemberAction, updateMemberAction, removeMemberAction, assignUserCompanyAction, createProductAdminAction } from '@/lib/actions/org-admin'

export const dynamic = 'force-dynamic'
const input = 'rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm outline-none focus:border-gray-400'

const ROLE_LABEL: Record<string, string> = { owner: 'Owner', admin: 'PowerUser', lead: 'Lead', member: 'Member', viewer: 'Viewer' }
const PROGRAM_ROLE_LABEL: Record<string, string> = { marketing: 'Marketing', sales: 'Sales', programm: 'Programm' }
const fmt = (d: string | null) => (d ? new Date(d + 'T12:00:00Z').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—')

export default async function CompanyTeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await ensureRolloutSchema()
  const [co] = (await db.execute(sql`SELECT id, name, domain, industry FROM companies WHERE id=${id}`)) as unknown as { id: string; name: string; domain: string | null; industry: string | null }[]
  if (!co) notFound()
  const [teams, members, goals] = await Promise.all([listTeams(id), listMembers(id), listGoals(id)])
  const goalHist = await goalHistory(goals.map((g) => g.id))
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

  // Datenbereich: was liegt für diesen Kunden schon an, wo hakt die Zuordnung?
  const [area] = (await db.execute(sql`
    SELECT
      (SELECT count(*)::int FROM strategy_products WHERE company_id=${id} AND status <> 'archived') AS products,
      (SELECT count(*)::int FROM strategy_step_states WHERE company_id=${id}) AS step_states,
      (SELECT count(*)::int FROM strategy_facts WHERE company_id=${id} AND is_current) AS facts,
      (SELECT count(*)::int FROM company_goals WHERE company_id=${id}) AS goals,
      (SELECT count(*)::int FROM rollouts WHERE company_id=${id}) AS rollouts,
      (SELECT count(*)::int FROM lead_radar WHERE company_id=${id}) AS leads,
      (SELECT count(*)::int FROM usage_ledger WHERE company_id=${id}) AS usage,
      (SELECT count(*)::int FROM billing_settings WHERE company_id=${id}) AS billing,
      (SELECT count(*)::int FROM users WHERE company_id=${id}) AS users`)) as unknown as Record<string, number>[]
  const products = (await db.execute(sql`SELECT id, name FROM strategy_products WHERE company_id=${id} AND status <> 'archived' ORDER BY sort_order, created_at`)) as unknown as { id: string; name: string }[]
  const misplaced = (await db.execute(sql`
    SELECT DISTINCT u.id, u.name, u.role::text AS role, u.company_id, c2.name AS other
    FROM org_memberships m JOIN users u ON u.id=m.user_id LEFT JOIN companies c2 ON c2.id=u.company_id
    WHERE m.company_id=${id} AND u.role NOT IN ('admin','coach') AND u.company_id IS DISTINCT FROM ${id}::uuid`)) as unknown as { id: string; name: string; role: string; company_id: string | null; other: string | null }[]
  const checks: { label: string; ok: boolean; text: string }[] = [
    { label: 'Organisation', ok: teams.length > 0, text: teams.length ? `${teams.length} Teams` : 'noch keine Teams' },
    { label: 'Personen', ok: members.length > 0 && misplaced.length === 0, text: members.length ? `${new Set(members.map((m) => m.user_id)).size} im Team${misplaced.length ? ` · ${misplaced.length} ohne Zuordnung zum Datenbereich` : ''}` : 'noch niemand' },
    { label: 'Logins', ok: members.some((m) => m.has_login), text: `${new Set(members.filter((m) => m.has_login).map((m) => m.user_id)).size} aktiv · ${new Set(members.filter((m) => !m.has_login && m.invited_at).map((m) => m.user_id)).size} eingeladen` },
    { label: 'Strategie', ok: area.products > 0, text: `${area.products} Produkte · ${area.step_states} Schritte begonnen · ${area.facts} Fakten` },
    { label: 'Plan (Programme)', ok: area.rollouts > 0, text: area.rollouts ? `${area.rollouts} Rollouts` : 'entsteht mit dem unterschriebenen Angebot' },
    { label: 'Ziele', ok: area.goals > 0, text: area.goals ? `${area.goals} Ziele` : 'noch keine Ziele' },
    { label: 'Lead-Radar', ok: area.leads > 0, text: `${area.leads} Leads` },
    { label: 'KI-Verbrauch', ok: true, text: `${area.usage} Buchungen${area.billing ? ' · Abrechnung eingerichtet' : ''}` },
  ]

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900">{co.name}</h1>
      <p className="mt-1 text-sm text-gray-500">{co.domain} · {teams.length} Teams · {new Set(members.map((m) => m.user_id)).size} Mitglieder</p>
      <details className="mt-2">
        <summary className="cursor-pointer text-xs font-semibold text-blue-700">Stammdaten bearbeiten</summary>
        <form action={updateCompanyAction} className="mt-2 flex flex-wrap items-center gap-2">
          <input type="hidden" name="companyId" value={id} />
          <input name="name" defaultValue={co.name} className={input} placeholder="Firma" />
          <input name="domain" defaultValue={co.domain ?? ''} className={input} placeholder="Domain" />
          <input name="industry" defaultValue={co.industry ?? ''} className={input} placeholder="Branche" />
          <button className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white">Speichern</button>
        </form>
      </details>

      <section id="datenbereich" className="mt-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Datenbereich</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {checks.map((c) => (
            <div key={c.label} className="flex items-start gap-2.5 rounded-xl border border-gray-100 bg-white px-3.5 py-2.5 text-sm">
              <span className={`mt-1 h-2 w-2 flex-none rounded-full ${c.ok ? 'bg-green-500' : 'bg-amber-400'}`} />
              <span><b className="text-gray-900">{c.label}</b><span className="block text-xs text-gray-500">{c.text}</span></span>
            </div>
          ))}
        </div>
        {misplaced.length > 0 && (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-semibold">Diese Personen landen beim Login nicht in diesem Datenbereich:</p>
            <ul className="mt-1.5 space-y-1">
              {misplaced.map((u) => (
                <li key={u.id} className="flex flex-wrap items-center gap-2">
                  {u.name} <span className="text-xs text-amber-700">{u.other ? `zugeordnet: ${u.other}` : 'keiner Firma zugeordnet'}</span>
                  <form action={assignUserCompanyAction}><input type="hidden" name="companyId" value={id} /><input type="hidden" name="userId" value={u.id} />
                    <button className="text-xs font-semibold text-blue-700 hover:underline">hierher zuordnen</button></form>
                </li>))}
            </ul>
          </div>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <span className="font-semibold text-gray-700">Produkte in der Strategie:</span>
          {products.map((p) => <span key={p.id} className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-700">{p.name}</span>)}
          <form action={createProductAdminAction} className="flex items-center gap-1.5">
            <input type="hidden" name="companyId" value={id} />
            <input name="name" placeholder="Produkt hinzufügen" className={`${input} py-1 text-xs`} />
            <button className="text-xs font-semibold text-blue-700">+</button>
          </form>
        </div>
      </section>

      <section id="ziele" className="mt-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Zielsetzung</h2>
        <div className="mt-3"><GoalsBoard goals={goals} history={goalHist} compact /></div>
        <details className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
          <summary className="cursor-pointer text-xs font-semibold text-gray-700">Ziele bearbeiten</summary>
          <div className="mt-3">
            <GoalsEditor companyId={id} goals={goals} templates={GOAL_TEMPLATES.map((t) => ({ key: t.key, team: t.team, title: t.title }))} />
          </div>
        </details>
      </section>

      <div className="mt-6 flex items-baseline justify-between">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Programme (Rollouts)</h2>
        <form action={setViewAs}>
          <input type="hidden" name="value" value={JSON.stringify({ companyId: id, label: `${co.name} · Gesamtsicht` })} />
          <button className="text-xs font-semibold text-blue-700 hover:underline">Kundenbereich ansehen →</button>
        </form>
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

      <div className="mt-8 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Teams</h2>
        <form action={addDefaultTeamsAction}><input type="hidden" name="companyId" value={id} />
          <button className="text-xs font-semibold text-blue-700 hover:underline">Standard-Teams ergänzen</button></form>
      </div>
      <form action={createTeamAction} className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-gray-200 p-3">
        <input type="hidden" name="companyId" value={id} />
        <input name="name" required placeholder="Neues Team, z. B. Inside Sales" className={`${input} flex-1`} />
        <select name="programRole" className={input} defaultValue="">
          <option value="">kein Programm-Team</option><option value="sales">in Programmen: Sales</option><option value="marketing">in Programmen: Marketing</option><option value="programm">in Programmen: Programm</option>
        </select>
        <button className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white">Team anlegen</button>
      </form>

      <details className="mt-3 rounded-xl border border-gray-200 bg-white p-4" open={members.length === 0 && teams.length > 0}>
        <summary className="cursor-pointer text-sm font-semibold text-blue-700">+ Person hinzufügen</summary>
        <form action={addMemberAction} className="mt-3 grid gap-2 sm:grid-cols-3">
          <input type="hidden" name="companyId" value={id} />
          <input name="name" required placeholder="Name *" className={input} />
          <input name="email" type="email" required placeholder="E-Mail *" className={input} />
          <input name="title" placeholder="Funktion, z. B. Head of Sales" className={input} />
          <select name="teamId" className={input} defaultValue={teams[0]?.id ?? ''}>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            <option value="">ohne Team</option>
          </select>
          <select name="orgRole" className={input} defaultValue="member">
            {Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select name="locale" className={input} defaultValue="de"><option value="de">Deutsch</option><option value="en">English</option><option value="es">Español</option></select>
          <div className="sm:col-span-3 flex flex-wrap items-center gap-3">
            <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Hinzufügen</button>
            <span className="text-xs text-gray-400">Legt das Konto an (falls neu) und ordnet es diesem Datenbereich zu. Verschickt wird nichts — den Login-Link erzeugst Du danach mit „Einladen“.</span>
          </div>
        </form>
      </details>

      <div className="mt-4 space-y-4">
        {teams.map((t) => {
          const ms = members.filter((m) => m.team_id === t.id)
          return (
            <div key={t.id} className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-baseline justify-between">
                <details>
                  <summary className="cursor-pointer list-none text-base font-bold text-gray-900">{t.name} <span className="text-xs font-normal text-gray-400">bearbeiten</span></summary>
                  <form action={updateTeamAction} className="mt-2 flex flex-wrap items-center gap-2">
                    <input type="hidden" name="companyId" value={id} /><input type="hidden" name="teamId" value={t.id} />
                    <input name="name" defaultValue={t.name} className={input} />
                    <select name="programRole" defaultValue={t.program_role_key ?? ''} className={input}>
                      <option value="">kein Programm-Team</option><option value="sales">Sales</option><option value="marketing">Marketing</option><option value="programm">Programm</option>
                    </select>
                    <button className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white">Speichern</button>
                  </form>
                </details>
                <span className="flex items-center gap-3 text-xs text-gray-400">{t.program_role_key ? `in Programmen: ${PROGRAM_ROLE_LABEL[t.program_role_key] ?? t.program_role_key}` : 'kein Programm-Team'}
                  <form action={setViewAs}>
                    <input type="hidden" name="value" value={JSON.stringify({ companyId: id, teamKey: t.key, label: `${co.name} · Team ${t.name}` })} />
                    <button className="font-semibold text-purple-700 hover:underline">als Team ansehen</button>
                  </form>
                </span>
              </div>
              <ul className="mt-3 divide-y divide-gray-50">
                {ms.map((m) => (
                  <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                    <span><span className="font-medium text-gray-900">{m.name}</span> <span className="text-gray-400">{m.email}</span>{m.title ? <span className="text-gray-500"> · {m.title}</span> : null}</span>
                    <span className="flex items-center gap-2">
                      <form action={updateMemberAction} className="flex items-center gap-1">
                        <input type="hidden" name="companyId" value={id} /><input type="hidden" name="membershipId" value={m.id} />
                        <select name="orgRole" defaultValue={m.org_role} className={`rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold ${m.org_role === 'admin' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                          {Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                        <select name="teamId" defaultValue={m.team_id ?? ''} className="rounded-full border-0 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-600">
                          {teams.map((tt) => <option key={tt.id} value={tt.id}>{tt.name}</option>)}<option value="">ohne Team</option>
                        </select>
                        <button className="text-[11px] font-semibold text-blue-700 hover:underline">ok</button>
                      </form>
                      <span className="text-[11px] text-gray-400">{m.has_login ? 'Login aktiv' : m.invited_at ? 'Link erzeugt' : 'nicht eingeladen'}</span>
                      <InviteButton userId={m.user_id} companyId={id} hasLogin={m.has_login} />
                      <form action={setViewAs}>
                        <input type="hidden" name="value" value={JSON.stringify({ companyId: id, userId: m.user_id, label: `${co.name} · ${m.name}` })} />
                        <button className="text-[11px] font-semibold text-purple-700 hover:underline">ansehen</button>
                      </form>
                      <form action={removeMemberAction}>
                        <input type="hidden" name="companyId" value={id} /><input type="hidden" name="membershipId" value={m.id} />
                        <button title="Aus dem Team nehmen (Konto bleibt bestehen)" className="text-[11px] text-gray-400 hover:text-red-600">entfernen</button>
                      </form>
                    </span>
                  </li>))}
                {!ms.length && <li className="py-2 text-sm text-gray-400">Noch niemand im Team.</li>}
              </ul>
            </div>)
        })}
        {members.some((m) => !m.team_id) && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="text-base font-bold text-gray-900">Ohne Team</h3>
            <ul className="mt-2 divide-y divide-gray-50 text-sm">
              {members.filter((m) => !m.team_id).map((m) => (
                <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span><span className="font-medium text-gray-900">{m.name}</span> <span className="text-gray-400">{m.email}</span></span>
                  <form action={updateMemberAction} className="flex items-center gap-1">
                    <input type="hidden" name="companyId" value={id} /><input type="hidden" name="membershipId" value={m.id} /><input type="hidden" name="orgRole" value={m.org_role} />
                    <select name="teamId" defaultValue="" className="rounded-full border-0 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-600">
                      <option value="">Team wählen</option>{teams.map((tt) => <option key={tt.id} value={tt.id}>{tt.name}</option>)}
                    </select>
                    <button className="text-[11px] font-semibold text-blue-700 hover:underline">zuordnen</button>
                  </form>
                </li>))}
            </ul>
          </div>
        )}
        {!teams.length && <p className="text-sm text-gray-400">Noch keine Teams — oben anlegen oder „Standard-Teams ergänzen“.</p>}
      </div>
    </div>
  )
}
