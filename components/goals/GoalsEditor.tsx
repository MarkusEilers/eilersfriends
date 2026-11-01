'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Archive, Save, Loader2, LineChart } from 'lucide-react'
import { saveGoalAction, addGoalFromTemplateAction, archiveGoalAction, addGoalValueAction } from '@/lib/actions/goals'
import type { Goal, GoalTeam, GoalKind, GoalUnit, GoalPeriod } from '@/lib/goals/schema'

/** Ziele eines Kunden im Backend pflegen: anlegen (Vorlage oder frei), ändern, Messwert eintragen, archivieren. */

const TEAMS: [GoalTeam, string][] = [['company', 'Unternehmen'], ['gtm', 'Go-to-Market'], ['marketing', 'Marketing'], ['sales', 'Sales']]
const KINDS: [GoalKind, string][] = [['rate', 'Takt je Zeitraum'], ['cumulative', 'Summe bis Datum'], ['ratio', 'Quote / Kennzahl']]
const UNITS: [GoalUnit, string][] = [['count', 'Anzahl'], ['eur', '€'], ['percent', '%'], ['days', 'Tage']]
const PERIODS: [GoalPeriod, string][] = [['week', 'Woche'], ['month', 'Monat'], ['quarter', 'Quartal'], ['year', 'Jahr']]

export function GoalsEditor({ companyId, goals, templates }: {
  companyId: string; goals: Goal[]; templates: Array<{ key: string; team: GoalTeam; title: string }>
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [tpl, setTpl] = useState('')
  const run = (fn: () => Promise<unknown>) => start(async () => { await fn(); router.refresh() })
  const used = new Set(goals.map((g) => g.metric_key))

  return (
    <div className="space-y-3">
      {goals.map((g) => <Row key={g.id} g={g} companyId={companyId} run={run} />)}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-gray-300 p-3">
        <select value={tpl} onChange={(e) => setTpl(e.target.value)} className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs">
          <option value="">Typischen KPI als Vorlage wählen …</option>
          {TEAMS.map(([t, l]) => (
            <optgroup key={t} label={l}>
              {templates.filter((x) => x.team === t).map((x) => <option key={x.key} value={x.key} disabled={used.has(x.key)}>{x.title}</option>)}
            </optgroup>
          ))}
        </select>
        <button type="button" disabled={!tpl || pending} onClick={() => run(async () => { await addGoalFromTemplateAction(companyId, tpl); setTpl('') })}
          className="inline-flex items-center gap-1 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40">
          <Plus size={12} /> Hinzufügen
        </button>
        <span className="text-xs text-gray-400">oder</span>
        <button type="button" disabled={pending} onClick={() => run(() => saveGoalAction({ companyId, team: 'sales', title: 'Neues Ziel', kind: 'rate', unit: 'count', period: 'month', target: 1 }))}
          className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold text-gray-700">
          <Plus size={12} /> Eigenes Ziel
        </button>
        {pending && <Loader2 size={14} className="animate-spin text-gray-400" />}
      </div>
    </div>
  )
}

function Row({ g, companyId, run }: { g: Goal; companyId: string; run: (fn: () => Promise<unknown>) => void }) {
  const [f, setF] = useState({
    team: g.team, title: g.title, kind: g.kind, unit: g.unit, period: g.period ?? 'month', direction: g.direction,
    target: String(g.target), current: g.current === null ? '' : String(g.current), start: g.start_date ?? '', deadline: g.deadline ?? '', note: g.note ?? '',
  })
  const [val, setVal] = useState('')
  const inp = 'rounded-lg border border-gray-200 px-2 py-1.5 text-xs'
  const save = () => run(() => saveGoalAction({
    id: g.id, companyId, team: f.team as GoalTeam, title: f.title, metricKey: g.metric_key, kind: f.kind as GoalKind, unit: f.unit as GoalUnit,
    period: f.kind === 'rate' ? f.period as GoalPeriod : null, direction: f.direction as 'up' | 'down', target: Number(f.target) || 0,
    current: f.current === '' ? null : Number(f.current), startDate: f.start || null, deadline: f.deadline || null, note: f.note || null, sort: g.sort,
  }))
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <div className="grid gap-2 md:grid-cols-[110px_1fr_140px]">
        <select className={inp} value={f.team} onChange={(e) => setF({ ...f, team: e.target.value as GoalTeam })}>{TEAMS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        <input className={`${inp} font-semibold`} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <select className={inp} value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as GoalKind })}>{KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
        Ziel <input className={`${inp} w-24`} type="number" value={f.target} onChange={(e) => setF({ ...f, target: e.target.value })} />
        <select className={inp} value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value as GoalUnit })}>{UNITS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        {f.kind === 'rate' && <>pro <select className={inp} value={f.period} onChange={(e) => setF({ ...f, period: e.target.value as GoalPeriod })}>{PERIODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></>}
        {f.kind === 'cumulative' && <>ab <input className={inp} type="date" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /> bis <input className={inp} type="date" value={f.deadline} onChange={(e) => setF({ ...f, deadline: e.target.value })} /></>}
        {f.kind === 'ratio' && <select className={inp} value={f.direction} onChange={(e) => setF({ ...f, direction: e.target.value as 'up' | 'down' })}><option value="up">mindestens</option><option value="down">höchstens</option></select>}
        · Stand <input className={`${inp} w-24`} type="number" value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} placeholder="—" />
      </div>
      <input className={`${inp} mt-2 w-full`} placeholder="Notiz (Quelle, Definition, Messweg)" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" onClick={save} className="inline-flex items-center gap-1 rounded-lg bg-[#1A5FD4] px-3 py-1.5 text-xs font-semibold text-white"><Save size={12} /> Speichern</button>
        <span className="mx-1 h-4 w-px bg-gray-200" />
        <input className={`${inp} w-24`} type="number" placeholder="Messwert" value={val} onChange={(e) => setVal(e.target.value)} />
        <button type="button" disabled={val === ''} onClick={() => run(async () => { await addGoalValueAction(g.id, Number(val)); setVal('') })}
          className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold text-gray-700 disabled:opacity-40"><LineChart size={12} /> Messwert eintragen</button>
        <button type="button" onClick={() => run(() => archiveGoalAction(g.id, companyId, true))}
          className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-red-600"><Archive size={12} /> Archivieren</button>
      </div>
    </div>
  )
}
