import { Target } from 'lucide-react'
import { goalStatus, fmtGoalValue, TEAM_LABEL, PERIOD_LABEL, type Goal, type GoalTeam } from '@/lib/goals/schema'

/**
 * Zielsetzung eines Kunden auf einen Blick: je Team die KPIs mit Ziel,
 * aktuellem Stand, Fortschritt und — bei Zielen mit Datum — wo man heute
 * stehen muesste.
 */

const STATE: Record<string, { label: string; bg: string; fg: string; bar: string }> = {
  on: { label: 'Im Plan', bg: '#ECFDF3', fg: '#027A48', bar: '#12B76A' },
  watch: { label: 'Beobachten', bg: '#FFFAEB', fg: '#B54708', bar: '#F79009' },
  off: { label: 'Kritisch', bg: '#FEF3F2', fg: '#B42318', bar: '#F04438' },
  open: { label: 'Noch kein Wert', bg: '#F2F4F7', fg: '#475467', bar: '#D0D5DD' },
}
const TEAM_COLOR: Record<GoalTeam, string> = { company: '#0F1E3A', gtm: '#6B5CE7', marketing: '#E07850', sales: '#1A5FD4' }
const fmtDate = (d: string | null) => (d ? new Date(d + 'T12:00:00Z').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : null)

export function GoalsBoard({ goals, history = {}, title = 'Zielsetzung', compact }: {
  goals: Goal[]; history?: Record<string, Array<{ measured_on: string; value: number }>>; title?: string; compact?: boolean
}) {
  if (!goals.length) {
    return (
      <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
        <Target size={20} className="mx-auto text-gray-300" />
        <p className="mt-2 text-sm text-gray-500">Für dieses Unternehmen sind noch keine Ziele hinterlegt.</p>
      </section>
    )
  }
  const teams = (['company', 'gtm', 'marketing', 'sales'] as GoalTeam[]).filter((t) => goals.some((g) => g.team === t))
  return (
    <section className="space-y-5">
      {!compact && <h2 className="text-lg font-bold text-gray-900">{title}</h2>}
      {teams.map((t) => (
        <div key={t}>
          <p className="mb-2 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest" style={{ color: TEAM_COLOR[t] }}>
            <span className="h-2 w-2 rounded-full" style={{ background: TEAM_COLOR[t] }} /> {TEAM_LABEL[t]}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {goals.filter((g) => g.team === t).map((g) => <GoalCard key={g.id} g={g} hist={history[g.id] ?? []} />)}
          </div>
        </div>
      ))}
    </section>
  )
}

function GoalCard({ g, hist }: { g: Goal; hist: Array<{ measured_on: string; value: number }> }) {
  const st = goalStatus(g)
  const s = STATE[st.state]
  const pct = st.pct === null ? 0 : Math.min(100, st.pct)
  const when = g.kind === 'cumulative' && g.deadline ? `bis ${fmtDate(g.deadline)}` : g.period ? PERIOD_LABEL[g.period] : g.direction === 'down' ? 'höchstens' : null
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold leading-snug text-gray-900">{g.title}</p>
        <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: s.bg, color: s.fg }}>{s.label}</span>
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-gray-900">{fmtGoalValue(g.current, g.unit)}</span>
        <span className="text-xs text-gray-500">von {fmtGoalValue(g.target, g.unit)}{when ? ` ${when}` : ''}</span>
      </div>
      <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pct}%`, background: s.bar }} />
        {st.expectedPct !== null && g.kind === 'cumulative' && st.expectedPct < 100 && (
          <div className="absolute inset-y-[-2px] w-0.5 bg-gray-900" style={{ left: `${st.expectedPct}%` }} title={`Soll heute: ${Math.round(st.expectedPct)} %`} />
        )}
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
        <span>{st.pct === null ? 'Wert fehlt' : `${Math.round(st.pct)} %${g.kind === 'cumulative' && st.expectedPct !== null ? ` · Soll heute ${Math.round(st.expectedPct)} %` : ''}`}</span>
        {hist.length > 1 ? <Spark values={hist.map((h) => h.value)} color={s.bar} /> : g.last_measured_on ? <span>Stand {fmtDate(g.last_measured_on)}</span> : null}
      </div>
      {g.note ? <p className="mt-2 text-[11px] leading-snug text-gray-500">{g.note}</p> : null}
    </div>
  )
}

function Spark({ values, color }: { values: number[]; color: string }) {
  const v = values.slice(-12)
  const max = Math.max(...v), min = Math.min(...v)
  const pts = v.map((x, i) => `${(i / (v.length - 1)) * 60},${16 - (max === min ? 8 : ((x - min) / (max - min)) * 14) - 1}`).join(' ')
  return <svg width="60" height="16" viewBox="0 0 60 16" aria-hidden><polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" /></svg>
}
