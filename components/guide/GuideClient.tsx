'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { Check, ChevronDown, ExternalLink, FileText, PlayCircle, Wrench, ListChecks, MessageSquarePlus, Search } from 'lucide-react'
import type { Guide, GuideStep } from '@/lib/rollouts/guide'
import { proposeGuideChange, setGuideStepStatus, toggleGuideItem } from '@/lib/actions/guide'

/**
 * Programm Guide — Aufbau nach dem OpenTAS Program Handbook:
 * Programmkarten · Filter (Programm, Team, Monat, Suche) · Heute ·
 * Monatsliste mit Karten · Bring / Leave with zum Abhaken · Glossar · Offen.
 * Sprache folgt dem Rollout (de/en), nicht der Seite.
 */

const L = {
  de: {
    title: 'Programm Guide', intro: 'Jeder Schritt Eurer Programme: wann er dran ist, wer dabei ist, was Ihr mitbringt und was danach vorliegt. Filtert nach Eurem Team oder einem Monat.',
    when: 'Wann', who: 'Wer', effort: 'Aufwand', format: 'Format', version: 'Version', program: 'Programm', team: 'Team', month: 'Monat',
    search: 'Suchen …', expand: 'Alle öffnen', collapse: 'Alle schließen', reset: 'Filter zurücksetzen', of: 'von', steps: 'Schritten',
    today: 'Heute', running: 'Läuft', next: 'Als Nächstes', bring: 'Mitbringen', leave: 'Danach liegt vor', builds: 'Baut auf', note: 'Hinweis',
    challenge: 'Beantwortet Herausforderung', status: 'Status', proposal: 'Input/Output: Vorschlag', approved: 'Freigegeben', joint: 'Gemeinsame Session mit',
    material: 'Material', work: 'Arbeiten in Strategy', done: 'Erledigt', markDone: 'Als erledigt markieren', reopen: 'Wieder öffnen',
    propose: 'Änderung vorschlagen', proposeHint: 'Termin, Reihenfolge oder Kadenz ändern? Eilers+Friends entscheidet.', send: 'Vorschlag senden', sent: 'Vorschlag ist eingegangen.',
    newDate: 'Neuer Starttermin (optional)', cadence: 'Kadenz', weekly: 'wöchentlich', biweekly: 'alle zwei Wochen', keep: 'unverändert',
    empty: 'Keine Schritte für diese Filter.', glossary: 'Begriffe', open: 'Noch offen', beta: 'Beta — wir bauen das gerade mit Euch aus. Feedback gern direkt an Markus.',
    pending: (n: number) => `${n} Änderungsvorschlag${n === 1 ? '' : 'e'} in Prüfung`, by: 'von',
  },
  en: {
    title: 'Program Guide', intro: 'Every step of your programs: when it happens, which team takes part, what to bring and what you leave with. Filter by your team or a month.',
    when: 'When', who: 'Who', effort: 'Effort', format: 'Format', version: 'Version', program: 'Program', team: 'Team', month: 'Month',
    search: 'Search …', expand: 'Expand all', collapse: 'Collapse all', reset: 'Reset filters', of: 'of', steps: 'steps',
    today: 'Today', running: 'Running', next: 'Up next', bring: 'Bring', leave: 'Leave with', builds: 'Builds on', note: 'Note',
    challenge: 'Answers challenge', status: 'Status', proposal: 'Inputs / outputs: proposal', approved: 'Approved', joint: 'Joint session with',
    material: 'Material', work: 'Work on it in Strategy', done: 'Done', markDone: 'Mark as done', reopen: 'Reopen',
    propose: 'Suggest a change', proposeHint: 'Different date, order or cadence? Eilers+Friends decides.', send: 'Send suggestion', sent: 'Suggestion received.',
    newDate: 'New start date (optional)', cadence: 'Cadence', weekly: 'weekly', biweekly: 'every two weeks', keep: 'unchanged',
    empty: 'No steps match these filters.', glossary: 'Glossary', open: 'Still open', beta: 'Beta — we are building this with you. Feedback welcome, straight to Markus.',
    pending: (n: number) => `${n} change suggestion${n === 1 ? '' : 's'} under review`, by: 'by',
  },
}
type Lbl = typeof L.de

const monthKey = (d: string | null) => (d ? d.slice(0, 7) : 'zzzz')
function fmt(d: string | null, loc: string) {
  if (!d) return '—'
  return new Date(d + 'T12:00:00Z').toLocaleDateString(loc === 'de' ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'short' })
}
function monthLabel(m: string, loc: string) {
  return new Date(m + '-15T12:00:00Z').toLocaleDateString(loc === 'de' ? 'de-DE' : 'en-GB', { month: 'short' })
}
const RES_ICON: Record<string, React.ElementType> = { video: PlayCircle, worksheet: FileText, framework: ListChecks, task_template: Wrench }

export function GuideClient({ guide, today }: { guide: Guide; today: string }) {
  const loc = guide.locale === 'de' ? 'de' : 'en'
  const t = L[loc]
  const [prog, setProg] = useState<Set<string>>(new Set())
  const [team, setTeam] = useState<Set<string>>(new Set(guide.viewer.role === 'member' || guide.viewer.role === 'lead' ? guide.viewer.teamKeys : []))
  const [month, setMonth] = useState<Set<string>>(new Set())
  const [q, setQ] = useState('')
  const [expandAll, setExpandAll] = useState(false)

  const months = useMemo(() => [...new Set(guide.steps.flatMap((s) => {
    const a = monthKey(s.start), b = monthKey(s.end); const out: string[] = []
    let cur = a
    for (let i = 0; i < 24 && cur <= b; i++) { out.push(cur); const [y, m] = cur.split('-').map(Number); cur = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}` }
    return out
  }))].filter((m) => m !== 'zzzz').sort(), [guide.steps])

  const match = (s: GuideStep) => {
    if (prog.size && !prog.has(s.prefix)) return false
    if (team.size && !s.teams.some((x) => team.has(x.key))) return false
    if (month.size && !months.some((m) => month.has(m) && monthKey(s.start) <= m && monthKey(s.end) >= m)) return false
    if (q) {
      const hay = [s.code, s.title, s.subtitle, s.description, ...s.items.map((i) => i.label), s.note, s.challenge].join(' ').toLowerCase()
      if (!hay.includes(q.toLowerCase())) return false
    }
    return true
  }
  const items = guide.steps.filter(match).sort((a, b) => (a.start ?? '').localeCompare(b.start ?? '') || a.prefix.localeCompare(b.prefix) || a.n - b.n)
  const byMonth = [...new Set(items.map((s) => monthKey(s.start)))].sort()

  const running = guide.steps.filter((s) => s.start && s.end && s.start <= today && s.end >= today && s.status !== 'done')
  const next = guide.steps.filter((s) => s.start && s.start > today).sort((a, b) => a.start!.localeCompare(b.start!)).slice(0, 2)

  const toggle = (set: Set<string>, v: string, fn: (s: Set<string>) => void) => { const n = new Set(set); if (n.has(v)) n.delete(v); else n.add(v); fn(n) }
  const anyBeta = guide.programs.some((p) => p.phase === 'beta')
  const glossary = guide.programs.flatMap((p) => (p.meta.glossary as [string, string][] | undefined) ?? [])
  const openPoints = guide.programs.flatMap((p) => (p.meta.open as string[] | undefined) ?? [])

  return (
    <div className="pb-16">
      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{guide.company.name}</p>
      <h1 className="mt-1 text-3xl font-bold text-gray-900">{t.title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">{t.intro}</p>
      {anyBeta && <p className="mt-4 inline-block rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800">{t.beta}</p>}
      {guide.pendingChanges > 0 && <p className="mt-2 text-xs text-gray-500">{t.pending(guide.pendingChanges)}</p>}

      {/* Programmkarten */}
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {guide.programs.map((p) => (
          <div key={p.rolloutId} className="rounded-2xl border border-gray-200 bg-white p-5" style={{ borderTop: `4px solid ${p.color}` }}>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: p.color }}>{p.prefix} · {p.stepCount} {t.steps}</p>
            <h2 className="mt-1 text-base font-bold text-gray-900">{p.title}</h2>
            {p.tagline && <p className="mt-1 text-xs leading-relaxed text-gray-500">{p.tagline}</p>}
            <dl className="mt-3 space-y-1 text-xs">
              <div className="flex gap-2"><dt className="w-16 text-gray-400">{t.when}</dt><dd className="text-gray-700">{fmt(p.start, loc)} – {fmt(p.end, loc)}</dd></div>
              <div className="flex gap-2"><dt className="w-16 text-gray-400">{t.who}</dt><dd className="text-gray-700">{p.teams.map((x) => x.name).join(', ')}</dd></div>
              {typeof p.meta.effort === 'string' && <div className="flex gap-2"><dt className="w-16 text-gray-400">{t.effort}</dt><dd className="text-gray-700">{p.meta.effort}</dd></div>}
              {typeof p.meta.format === 'string' && <div className="flex gap-2"><dt className="w-16 text-gray-400">{t.format}</dt><dd className="text-gray-700">{p.meta.format}</dd></div>}
              <div className="flex gap-2"><dt className="w-16 text-gray-400">{t.version}</dt><dd className="text-gray-500">{p.version}</dd></div>
            </dl>
          </div>
        ))}
      </div>

      {/* Heute */}
      {(running.length > 0 || next.length > 0) && (
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-1 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm">
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-700">{t.today}</span>
          {running.length > 0 && <span className="text-gray-700">{t.running}: {running.map((s) => `${s.code} ${s.title}`).join(' · ')}</span>}
          {next.length > 0 && <span className="text-gray-700">{t.next}: {next.map((s) => `${s.code} ${s.title} (${fmt(s.start, loc)})`).join(' · ')}</span>}
        </div>
      )}

      {/* Filter */}
      <div className="sticky top-0 z-10 -mx-2 mt-6 space-y-2 rounded-xl bg-gray-50/95 px-2 py-3 backdrop-blur">
        <FilterRow label={t.program}>
          {guide.programs.map((p) => <Chip key={p.prefix} on={prog.has(p.prefix)} onClick={() => toggle(prog, p.prefix, setProg)} dot={p.color}>{p.title}</Chip>)}
        </FilterRow>
        <FilterRow label={t.team}>
          {guide.teams.map((x) => <Chip key={x.key} on={team.has(x.key)} onClick={() => toggle(team, x.key, setTeam)}>{x.name}</Chip>)}
        </FilterRow>
        <FilterRow label={t.month}>
          {months.map((m) => <Chip key={m} on={month.has(m)} onClick={() => toggle(month, m, setMonth)}>{monthLabel(m, loc)}</Chip>)}
        </FilterRow>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5">
            <Search size={13} className="text-gray-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.search} className="w-48 text-sm outline-none" />
          </label>
          <button onClick={() => setExpandAll((v) => !v)} className="text-xs font-semibold text-gray-600 hover:text-gray-900">{expandAll ? t.collapse : t.expand}</button>
          <button onClick={() => { setProg(new Set()); setTeam(new Set()); setMonth(new Set()); setQ('') }} className="text-xs font-semibold text-gray-600 hover:text-gray-900">{t.reset}</button>
          <span className="ml-auto text-xs text-gray-400">{items.length} {t.of} {guide.steps.length} {t.steps}</span>
        </div>
      </div>

      {/* Monatsliste */}
      <div className="mt-4 space-y-8">
        {byMonth.map((m) => {
          const inM = items.filter((s) => monthKey(s.start) === m)
          return (
            <div key={m} className="grid gap-4 md:grid-cols-[88px_1fr]">
              <div className="md:sticky md:top-40 md:self-start">
                <p className="text-xl font-bold text-gray-900">{m === 'zzzz' ? '—' : monthLabel(m, loc)}</p>
                <p className="text-xs text-gray-400">{m.slice(0, 4)}</p>
              </div>
              <div className="space-y-2">{inM.map((s) => <StepCard key={s.id + String(expandAll)} s={s} t={t} loc={loc} open={expandAll} />)}</div>
            </div>
          )
        })}
        {!items.length && <p className="rounded-xl border border-dashed border-gray-200 p-10 text-center text-sm text-gray-500">{t.empty}</p>}
      </div>

      {glossary.length > 0 && (
        <section className="mt-14">
          <h2 className="text-lg font-bold text-gray-900">{t.glossary}</h2>
          <dl className="mt-3 grid gap-x-8 gap-y-3 md:grid-cols-2">
            {glossary.map(([k, v]) => <div key={k}><dt className="text-sm font-semibold text-gray-900">{k}</dt><dd className="text-sm text-gray-600">{v}</dd></div>)}
          </dl>
        </section>
      )}
      {openPoints.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-bold text-gray-900">{t.open}</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-600">{openPoints.map((x) => <li key={x}>{x}</li>)}</ul>
        </section>
      )}
    </div>
  )
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="w-20 text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
      {children}
    </div>
  )
}
function Chip({ on, onClick, dot, children }: { on: boolean; onClick: () => void; dot?: string; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${on ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'}`}>
      {dot && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dot }} />}{children}
    </button>
  )
}

function StepCard({ s, t, loc, open }: { s: GuideStep; t: Lbl; loc: string; open: boolean }) {
  const [items, setItems] = useState(s.items)
  const [status, setStatus] = useState(s.status)
  const [pending, start] = useTransition()
  const [showPropose, setShowPropose] = useState(false)
  const done = status === 'done'
  const ins = items.filter((i) => i.kind === 'input'), outs = items.filter((i) => i.kind === 'output')
  const progress = items.length ? Math.round((items.filter((i) => i.done).length / items.length) * 100) : 0

  const tick = (id: string, v: boolean) => {
    setItems((xs) => xs.map((i) => (i.id === id ? { ...i, done: v } : i)))
    start(async () => { const r = await toggleGuideItem(id, v); if (!r.ok) setItems((xs) => xs.map((i) => (i.id === id ? { ...i, done: !v } : i))) })
  }
  const setDone = (v: boolean) => { setStatus(v ? 'done' : 'planned'); start(async () => { await setGuideStepStatus(s.id, v ? 'done' : 'planned') }) }

  const List = ({ title, xs }: { title: string; xs: typeof items }) => (
    <div>
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{title}</h4>
      <ul className="mt-2 space-y-1.5">
        {xs.map((i) => (
          <li key={i.id}>
            <label className={`flex items-start gap-2 text-sm ${s.canTick && !s.readOnly ? 'cursor-pointer' : ''}`}>
              <input type="checkbox" checked={i.done} disabled={!s.canTick || s.readOnly || pending} onChange={(e) => tick(i.id, e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-gray-300" />
              <span className={i.done ? 'text-gray-400 line-through' : 'text-gray-700'}>{i.label}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  )

  return (
    <details open={open} className={`group rounded-2xl border bg-white ${done ? 'border-green-200' : 'border-gray-200'}`}>
      <summary className="flex cursor-pointer list-none items-start gap-3 p-4">
        <span className="mt-0.5 flex h-8 min-w-[2.6rem] items-center justify-center rounded-lg px-1.5 text-xs font-bold" style={{ backgroundColor: s.color, color: s.prefix === 'R' ? '#1d1d1b' : '#fff' }}>{s.code}</span>
        <div className="min-w-0 flex-1">
          {s.headline && <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: s.color }}>{s.headline}</p>}
          <h3 className="text-sm font-bold text-gray-900">{s.title} {done && <Check size={14} className="inline text-green-600" />}</h3>
          {s.subtitle && s.subtitle !== s.headline && <p className="text-xs text-gray-500">{s.subtitle}</p>}
          {items.length > 0 && <div className="mt-2 h-1 w-32 overflow-hidden rounded-full bg-gray-100"><div className="h-full bg-green-500" style={{ width: `${progress}%` }} /></div>}
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          <span className="whitespace-nowrap text-xs font-medium text-gray-600">{fmt(s.start, loc)} – {fmt(s.end, loc)}</span>
          <span className="flex flex-wrap justify-end gap-1">{s.teams.map((x) => <span key={x.key} className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">{x.name}</span>)}</span>
        </div>
        <ChevronDown size={16} className="mt-1 text-gray-400 transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-gray-100 px-4 pb-4 pt-3">
        {s.description && <p className="text-sm leading-relaxed text-gray-700">{s.description}</p>}
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <List title={t.bring} xs={ins} />
          <List title={t.leave} xs={outs} />
        </div>
        <div className="mt-4 grid gap-3 border-t border-gray-100 pt-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
          <div><h4 className="font-bold uppercase tracking-widest text-gray-400">{t.builds}</h4><p className="mt-1 text-gray-700">{s.needs.length ? s.needs.join(', ') : '—'}</p></div>
          {s.challenge && <div><h4 className="font-bold uppercase tracking-widest text-gray-400">{t.challenge}</h4><p className="mt-1 text-blue-700">{s.challenge}</p></div>}
          {(s.note || s.joint || s.milestones.length > 0) && (
            <div className="sm:col-span-2"><h4 className="font-bold uppercase tracking-widest text-gray-400">{t.note}</h4>
              {s.joint && <p className="mt-1 text-gray-700">{t.joint} {s.joint}.</p>}
              {s.note && <p className="mt-1 text-gray-700">{s.note}</p>}
              {s.milestones.map((m) => <p key={m} className="mt-1 font-medium" style={{ color: s.color }}>„{m}"</p>)}
            </div>
          )}
          <div><h4 className="font-bold uppercase tracking-widest text-gray-400">{t.status}</h4><p className={`mt-1 ${s.draft ? 'text-amber-700' : 'text-gray-700'}`}>{s.draft ? t.proposal : t.approved}</p></div>
        </div>

        {s.resources.length > 0 && (
          <div className="mt-4 border-t border-gray-100 pt-3">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{t.material}</h4>
            <ul className="mt-2 flex flex-wrap gap-2">
              {s.resources.map((r) => {
                const I = RES_ICON[r.kind] ?? FileText
                return r.url
                  ? <li key={r.id}><a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"><I size={13} />{r.title}<ExternalLink size={11} className="text-gray-400" /></a></li>
                  : <li key={r.id} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-700" title={r.body ?? ''}><I size={13} />{r.title}</li>
              })}
            </ul>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
          {s.links.strategy_step_key && (
            <Link href={`/dashboard/strategie/${s.links.strategy_step_key}` as '/'} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ backgroundColor: '#1A5FD4' }}>{t.work} →</Link>
          )}
          {s.canComplete && !s.readOnly && (
            <button type="button" disabled={pending} onClick={() => setDone(!done)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">{done ? t.reopen : t.markDone}</button>
          )}
          {s.canComplete && !s.readOnly && (
            <button type="button" onClick={() => setShowPropose((v) => !v)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800"><MessageSquarePlus size={13} />{t.propose}</button>
          )}
        </div>
        {showPropose && <ProposeForm stepId={s.id} t={t} />}
      </div>
    </details>
  )
}

function ProposeForm({ stepId, t }: { stepId: string; t: Lbl }) {
  const [text, setText] = useState('')
  const [date, setDate] = useState('')
  const [cad, setCad] = useState<'' | 'weekly' | 'biweekly'>('')
  const [sent, setSent] = useState(false)
  const [pending, start] = useTransition()
  if (sent) return <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-xs text-green-800">{t.sent}</p>
  return (
    <div className="mt-3 space-y-2 rounded-xl bg-gray-50 p-3">
      <p className="text-xs text-gray-500">{t.proposeHint}</p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <label className="flex items-center gap-2">{t.newDate}<input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-md border border-gray-200 px-2 py-1" /></label>
        <label className="flex items-center gap-2">{t.cadence}
          <select value={cad} onChange={(e) => setCad(e.target.value as '' | 'weekly' | 'biweekly')} className="rounded-md border border-gray-200 px-2 py-1">
            <option value="">{t.keep}</option><option value="weekly">{t.weekly}</option><option value="biweekly">{t.biweekly}</option>
          </select>
        </label>
        <button type="button" disabled={pending} onClick={() => start(async () => {
          const r = await proposeGuideChange({ rolloutStepId: stepId, kind: cad ? 'cadence' : date ? 'dates' : 'content', text, proposedStart: date || undefined, cadence: cad || undefined })
          if (r.ok) setSent(true)
        })} className="ml-auto rounded-lg bg-gray-900 px-3 py-1.5 font-semibold text-white">{t.send}</button>
      </div>
    </div>
  )
}
