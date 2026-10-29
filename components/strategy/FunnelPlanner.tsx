'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import {
  ArrowRight, Banknote, Check, ChevronDown, Loader2, RotateCcw, Settings, Users,
  Phone, RefreshCw, MessageSquare, Search, FileText, Handshake, Target,
} from 'lucide-react'
import {
  calculateMetrics, generateFunnelStages, calculateCashInMultiplier, getCashInRemainingMonths,
  getAchievableRevenue, formatCurrency, formatNumber, formatPercent, rampUp, teamOkrs, withDefaults,
  defaultParameters, type SalesParameters, type CalculatedMetrics, type FunnelStage,
} from '@/lib/strategy/funnel-math'
import { savePlannerAction } from '@/lib/actions/strategy'

/**
 * Know Your Numbers — der Sales Activity Planner im Strategie-Schritt.
 * Vom Umsatzziel rückwärts (oder vom Team vorwärts) bis zur Aktivität pro Tag.
 * Speichert automatisch in den Arbeitsstand des Schritts (data.planner).
 */

const NAVY = '#0F1E3A'
const BLUE = '#1A5FD4'
const ORANGE = '#E07850'

export function FunnelPlanner({ stateId, initial, readOnly }: { stateId: string; initial: Partial<SalesParameters> | null; readOnly?: boolean }) {
  const [p, setP] = useState<SalesParameters>(() => withDefaults(initial))
  const [open, setOpen] = useState(!initial)
  const [saved, setSaved] = useState<number | null>(null)
  const [pending, start] = useTransition()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const first = useRef(true)

  useEffect(() => {
    if (first.current) { first.current = false; return }
    if (readOnly) return
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      start(async () => { await savePlannerAction(stateId, p); setSaved(Date.now()) })
    }, 900)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [p, stateId, readOnly])

  const set = <K extends keyof SalesParameters>(k: K, v: SalesParameters[K]) => { if (!readOnly) setP((x) => ({ ...x, [k]: v })) }
  const m = useMemo(() => calculateMetrics(p), [p])
  const stages = useMemo(() => generateFunnelStages(p, m), [p, m])
  const cap = p.planningMode === 'capacity'

  return (
    <div className="space-y-6">
      {/* Kopf */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: BLUE }}>Funnel-Rechner</p>
          <p className="mt-0.5 text-sm text-gray-700">
            {cap ? <>Erreichbar: <strong>{formatCurrency(getAchievableRevenue(p))}</strong> · {p.sdrCount} SDR · {p.aeCount} AE</>
              : <>Ziel: <strong>{formatCurrency(p.yearlyTarget)}</strong></>}
            {p.cashInMode && <span className="ml-2 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: '#FDEEE8', color: ORANGE }}>
              Cash-In ×{calculateCashInMultiplier(p).toFixed(1)} · Ø {getCashInRemainingMonths(p).toFixed(1)} Monate Cash{!cap ? ` · effektiv ${formatCurrency(p.yearlyTarget * calculateCashInMultiplier(p))}` : ''}
            </span>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Toggle icon={Users} label="Kapazität" on={cap} onChange={(v) => set('planningMode', v ? 'capacity' : 'target')} color={BLUE} />
          <Toggle icon={Banknote} label="Cash-In" on={p.cashInMode} onChange={(v) => set('cashInMode', v)} color={ORANGE} />
          <span className="ml-1 inline-flex items-center gap-1 text-[11px] text-gray-400">
            {readOnly ? 'nur lesen' : pending ? <><Loader2 size={11} className="animate-spin" /> speichert</> : saved ? <><Check size={11} /> gespeichert</> : null}
          </span>
        </div>
      </div>

      {/* Konfiguration */}
      <div className="rounded-2xl border border-gray-200 bg-white">
        <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-5 py-3">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-800"><Settings size={14} className="text-gray-400" /> Eure Zahlen</span>
          <ChevronDown size={15} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div className="grid gap-5 border-t border-gray-100 p-5 md:grid-cols-2">
            <Group title="Jahresziele">
              <Num label="Jahresziel" v={p.yearlyTarget} suf="€" step={1000} on={(v) => set('yearlyTarget', v)} ro={readOnly} />
              <Num label="Ø Auftragswert" v={p.averageDealSize} suf="€" step={500} on={(v) => set('averageDealSize', v)} ro={readOnly} />
              <Num label="Minimum Deal" v={p.minimumDealSize} suf="€" step={500} on={(v) => set('minimumDealSize', v)} ro={readOnly} />
              <Num label="TOP Deal" v={p.largeDealSize} suf="€" step={1000} on={(v) => set('largeDealSize', v)} ro={readOnly} />
            </Group>
            <Group title="Arbeitszeit">
              <Num label="Arbeitsmonate / Jahr" v={p.workingMonths} step={0.5} on={(v) => set('workingMonths', v)} ro={readOnly} />
              <Num label="Wochen / Monat" v={p.workingWeeksPerMonth} step={0.5} on={(v) => set('workingWeeksPerMonth', v)} ro={readOnly} />
              <Num label="Tage / Woche" v={p.workingDaysPerWeek} step={0.5} on={(v) => set('workingDaysPerWeek', v)} ro={readOnly} />
            </Group>
            <Group title="Deal-Mix">
              <Num label="Average Deals" v={p.averageDealPercentage} suf="%" on={(v) => { set('averageDealPercentage', v); set('topDealPercentage', Math.max(0, 100 - v)) }} ro={readOnly} />
              <Num label="TOP Deals" v={p.topDealPercentage} suf="%" on={(v) => { set('topDealPercentage', v); set('averageDealPercentage', Math.max(0, 100 - v)) }} ro={readOnly} />
              <Num label="Current Results Gap" v={p.currentResultsGap} suf="%" on={(v) => set('currentResultsGap', v)} ro={readOnly} hint="Anteil des Ziels, der noch fehlt" />
              <Num label="Marketing ROI" v={p.marketingROI} suf="×" step={0.5} on={(v) => set('marketingROI', v)} ro={readOnly} />
            </Group>
            {cap ? (
              <Group title="Team und Kapazität / Monat">
                <Num label="Anzahl SDRs" v={p.sdrCount} on={(v) => set('sdrCount', v)} ro={readOnly} />
                <Num label="Anzahl AEs" v={p.aeCount} on={(v) => set('aeCount', v)} ro={readOnly} />
                <Num label="Discoveries / SDR" v={p.sdrCapacityPerMonth} on={(v) => set('sdrCapacityPerMonth', v)} ro={readOnly} />
                <Num label="Angebote / AE" v={p.aeCapacityPerMonth} on={(v) => set('aeCapacityPerMonth', v)} ro={readOnly} />
              </Group>
            ) : <div />}
            <Group title="Funnel-Conversions">
              <Num label="Cold → SQL" v={p.conversionColdToSQL} suf="%" step={0.5} on={(v) => set('conversionColdToSQL', v)} ro={readOnly} />
              <Num label="SQL → Discovery" v={p.conversionSQLToDeal} suf="%" on={(v) => set('conversionSQLToDeal', v)} ro={readOnly} />
              <Num label="Discovery → Angebot" v={p.conversionDiscoveryToProposal} suf="%" on={(v) => set('conversionDiscoveryToProposal', v)} ro={readOnly} />
              <Num label="Angebot → Auftrag" v={p.conversionDealToOrder} suf="%" on={(v) => set('conversionDealToOrder', v)} ro={readOnly} />
            </Group>
            <Group title="Quellen: Anteil und Conversion zu SQL">
              <Pair label="Cold" a={p.distributionCold} b={p.conversionColdCall} onA={(v) => set('distributionCold', v)} onB={(v) => set('conversionColdCall', v)} ro={readOnly} />
              <Pair label="WeCare" a={p.distributionWeCare} b={p.conversionWeCare} onA={(v) => set('distributionWeCare', v)} onB={(v) => set('conversionWeCare', v)} ro={readOnly} />
              <Pair label="WinBack" a={p.distributionWinBack} b={p.conversionWinBack} onA={(v) => set('distributionWinBack', v)} onB={(v) => set('conversionWinBack', v)} ro={readOnly} />
              <Pair label="Empfehlungen" a={p.distributionRecommendations} b={p.conversionRecommendations} onA={(v) => set('distributionRecommendations', v)} onB={(v) => set('conversionRecommendations', v)} ro={readOnly} />
              {(() => { const sum = p.distributionCold + p.distributionWeCare + p.distributionWinBack + p.distributionRecommendations
                return sum !== 100 ? <p className="col-span-2 text-[11px] font-semibold" style={{ color: ORANGE }}>Die Anteile ergeben {sum} %, nicht 100 %.</p> : null })()}
            </Group>
            <Group title="Zeitbedarf (Minuten)">
              <Num label="Cold Call" v={p.timeColdCall} on={(v) => set('timeColdCall', v)} ro={readOnly} />
              <Num label="WeCare Call" v={p.timeWeCareCall} on={(v) => set('timeWeCareCall', v)} ro={readOnly} />
              <Num label="WinBack Call" v={p.timeWinBackCall} on={(v) => set('timeWinBackCall', v)} ro={readOnly} />
              <Num label="Empfehlungs-Call" v={p.timeRecommendationCall} on={(v) => set('timeRecommendationCall', v)} ro={readOnly} />
              <Num label="Discovery Call" v={p.timeDiscoveryCall} on={(v) => set('timeDiscoveryCall', v)} ro={readOnly} />
              <Num label="Angebot verhandeln" v={p.timeNegotiatedOffer} on={(v) => set('timeNegotiatedOffer', v)} ro={readOnly} />
              <Num label="Closing" v={p.timeClosing} on={(v) => set('timeClosing', v)} ro={readOnly} />
              <Num label="Puffer (AVV, NDA …)" v={p.timeBuffer} on={(v) => set('timeBuffer', v)} ro={readOnly} />
            </Group>
            <Group title="Hochlauf">
              <label className="col-span-2 block text-xs text-gray-600">Start der Vertriebsaktivität
                <input type="date" value={p.rampUpStartDate} disabled={readOnly} onChange={(e) => set('rampUpStartDate', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm" />
              </label>
              <Num label="Cold → Discovery" v={p.lagColdToDiscovery} suf="Wo." on={(v) => set('lagColdToDiscovery', v)} ro={readOnly} />
              <Num label="Discovery → Angebot" v={p.lagDiscoveryToProposal} suf="Wo." on={(v) => set('lagDiscoveryToProposal', v)} ro={readOnly} />
              <Num label="Angebot → Abschluss" v={p.lagProposalToClose} suf="Wo." on={(v) => set('lagProposalToClose', v)} ro={readOnly} />
            </Group>
            {!readOnly && (
              <div className="md:col-span-2">
                <button type="button" onClick={() => setP({ ...defaultParameters })} className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800">
                  <RotateCcw size={12} /> Auf Beispielwerte zurücksetzen
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Übersicht */}
      <Section title="Übersicht" badge={`${formatNumber(m.totalDealsNeeded)} Deals`}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Kpi accent label="Deals benötigt" value={formatNumber(m.totalDealsNeeded)} />
          <Kpi accent label="Pro Monat" value={formatNumber(m.dealsPerMonth, 1)} />
          <Kpi accent label="Discoveries" value={formatNumber(m.totalDiscoveries)} sub={`${formatNumber(m.totalDiscoveries / p.workingMonths)}/Mo`} />
          <Kpi accent label="Zeitbedarf" value={`${formatNumber(m.hoursPerMonth)}h`} sub="pro Monat" />
          <Kpi accent label="Pro Tag" value={`${formatNumber(m.hoursPerDay, 1)}h`} />
        </div>
      </Section>
      <Section title="Deal-Struktur">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi label="Average Deals" value={formatNumber(m.dealsNeededAverage)} sub={`@ ${formatCurrency(p.averageDealSize)}`} />
          <Kpi label="TOP Deals" value={formatNumber(m.dealsNeededTop)} sub={`@ ${formatCurrency(p.largeDealSize)}`} />
          <Kpi label="Pro Woche" value={formatNumber(m.dealsPerWeek, 2)} />
          <Kpi label="Pro Tag" value={formatNumber(m.dealsPerDay, 2)} />
        </div>
      </Section>

      <Funnel stages={stages} p={p} />
      <Ramp p={p} m={m} />
      <Activities p={p} m={m} />
      <PerfectWeek p={p} m={m} />
      <Okrs p={p} m={m} />
    </div>
  )
}

/* ───────────── Bausteine ───────────── */

function Toggle({ icon: Icon, label, on, onChange, color }: { icon: React.ElementType; label: string; on: boolean; onChange: (v: boolean) => void; color: string }) {
  return (
    <button type="button" onClick={() => onChange(!on)}
      className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors"
      style={on ? { borderColor: color, background: `${color}14`, color } : { borderColor: '#E5E7EB', color: '#374151' }}>
      <Icon size={14} /> {label}
      <span className="relative inline-block h-4 w-7 rounded-full transition-colors" style={{ background: on ? color : '#D1D5DB' }}>
        <span className="absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all" style={{ left: on ? 14 : 2 }} />
      </span>
    </button>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">{title}</p>
      <div className="grid grid-cols-2 gap-2">{children}</div>
    </div>
  )
}

function Num({ label, v, on, suf, step = 1, ro, hint }: { label: string; v: number; on: (v: number) => void; suf?: string; step?: number; ro?: boolean; hint?: string }) {
  return (
    <label className="block text-xs text-gray-600" title={hint}>
      {label}
      <span className="mt-1 flex items-center rounded-lg border border-gray-200 bg-white focus-within:border-gray-400">
        <input type="number" value={Number.isFinite(v) ? v : 0} step={step} disabled={ro}
          onChange={(e) => on(e.target.value === '' ? 0 : Number(e.target.value))}
          className="w-full min-w-0 rounded-lg bg-transparent px-2.5 py-1.5 text-sm text-gray-900 outline-none" />
        {suf && <span className="pr-2.5 text-xs text-gray-400">{suf}</span>}
      </span>
    </label>
  )
}

function Pair({ label, a, b, onA, onB, ro }: { label: string; a: number; b: number; onA: (v: number) => void; onB: (v: number) => void; ro?: boolean }) {
  return (
    <>
      <Num label={`${label}: Anteil`} v={a} suf="%" on={onA} ro={ro} />
      <Num label={`${label}: → SQL`} v={b} suf="%" step={0.5} on={onB} ro={ro} />
    </>
  )
}

function Section({ title, badge, right, children }: { title: string; badge?: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          {badge && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">{badge}</span>}
        </div>
        {right}
      </div>
      {children}
    </section>
  )
}

function Kpi({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="rounded-xl p-3.5" style={{ background: accent ? '#EBF1FF' : '#F7F7F5' }}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-bold" style={{ color: accent ? BLUE : '#111827' }}>{value}</p>
      {sub && <p className="text-[11px] text-gray-500">{sub}</p>}
    </div>
  )
}

function Funnel({ stages, p }: { stages: FunnelStage[]; p: SalesParameters }) {
  const mult = calculateCashInMultiplier(p)
  const frac = p.cashInMode ? 1 / mult : 1
  const closed = stages[stages.length - 1]?.count || 1
  const perDeal = p.yearlyTarget / closed
  const cum: number[] = []
  let c = 1
  for (let i = stages.length - 1; i >= 0; i--) { cum[i] = c; if (i > 0) c *= stages[i - 1].conversionToNext / 100 }
  return (
    <Section title="Sales Funnel" badge={`${stages.length} Phasen`}>
      <div className="flex items-start gap-1 overflow-x-auto pb-2">
        {stages.map((s, i) => {
          const val = perDeal * cum[i]
          const last = i === stages.length - 1
          return (
            <div key={s.name} className="flex items-start gap-1">
              <div className="flex w-28 shrink-0 flex-col items-center">
                <div className="flex h-24 w-24 flex-col items-center justify-center rounded-xl p-2 text-white" style={{ background: s.color }}>
                  <span className="text-lg font-bold">{formatNumber(s.count)}</span>
                  <span className="text-[11px] text-white/85">{formatCurrency(val)}</span>
                  <span className="text-[10px] text-white/60" title="Marketing-Budget je Lead (Wert ÷ Marketing ROI)">{formatCurrency(val / p.marketingROI)}</span>
                </div>
                <p className="mt-2 text-center text-xs font-semibold text-gray-900">{s.nameDe}</p>
                <p className="text-center text-[10px] text-gray-400">{s.name}</p>
                {p.cashInMode && last && <p className="text-[10px]" style={{ color: ORANGE }}>ACV: {formatCurrency(val / frac)}</p>}
              </div>
              {!last && (
                <div className="mt-8 flex flex-col items-center px-0.5">
                  <ArrowRight size={14} className="text-gray-300" />
                  <span className="mt-0.5 text-[11px] font-semibold" style={{ color: ORANGE }}>{formatPercent(s.conversionToNext)}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-gray-100 pt-4 text-center">
        <Kpi label="Leads" value={formatNumber(stages[0]?.count || 0)} />
        <Kpi accent label="Konversion" value={formatPercent(((stages[stages.length - 1]?.count || 0) / (stages[0]?.count || 1)) * 100)} />
        <Kpi label="Abschlüsse" value={formatNumber(closed)} />
      </div>
      <p className="mt-3 text-[11px] text-gray-500">Je Phase: Anzahl, Wert eines Leads in dieser Phase, darunter das Marketing-Budget, das ein Lead dort kosten darf (Wert ÷ ROI {p.marketingROI}).</p>
      {p.cashInMode && <p className="mt-2 rounded-lg p-2.5 text-center text-[11px] font-medium" style={{ background: '#FDEEE8', color: ORANGE }}>
        Cash-In: Jeder Deal bringt bis Jahresende nur {formatPercent(frac * 100)} seines Jahreswerts als Zahlung, deshalb braucht es ×{mult.toFixed(1)} Deals.
      </p>}
    </Section>
  )
}

function Ramp({ p, m }: { p: SalesParameters; m: CalculatedMetrics }) {
  const [mode, setMode] = useState<'cum' | 'disc'>('cum')
  const raw = useMemo(() => rampUp(p, m), [p, m])
  const data = mode === 'cum' ? raw : raw.map((d, i) => i === 0 ? d : {
    ...d, coldCalls: d.coldCalls - raw[i - 1].coldCalls, discoveries: d.discoveries - raw[i - 1].discoveries,
    proposals: d.proposals - raw[i - 1].proposals, closes: d.closes - raw[i - 1].closes,
  })
  const W = 720, H = 280, L = 44, R = 52, T = 22, B = 30
  const iw = W - L - R, ih = H - T - B
  const maxL = Math.max(1, ...data.map((d) => Math.max(d.discoveries, d.proposals, d.closes)))
  const maxR = Math.max(1, ...data.map((d) => d.coldCalls))
  const x = (i: number) => L + (i / (data.length - 1)) * iw
  const yL = (v: number) => T + ih - (v / maxL) * ih
  const yR = (v: number) => T + ih - (v / maxR) * ih
  const area = (key: 'coldCalls' | 'discoveries' | 'proposals' | 'closes', y: (v: number) => number) => {
    const pts = data.map((d, i) => `${x(i)},${y(d[key])}`)
    return { line: `M${pts.join(' L')}`, fill: `M${x(0)},${T + ih} L${pts.join(' L')} L${x(data.length - 1)},${T + ih} Z` }
  }
  const col = p.colorSequence ?? defaultParameters.colorSequence
  const series = [
    { key: 'coldCalls' as const, label: 'Cold Calls (rechte Achse)', color: col[0], y: yR },
    { key: 'discoveries' as const, label: 'Discoveries', color: col[2], y: yL },
    { key: 'proposals' as const, label: 'Angebote', color: col[3], y: yL },
    { key: 'closes' as const, label: 'Abschlüsse', color: '#16A34A', y: yL },
  ]
  const lags = [
    { idx: Math.round(p.lagColdToDiscovery / 4), label: 'Discovery', color: col[2] },
    { idx: Math.round((p.lagColdToDiscovery + p.lagDiscoveryToProposal) / 4), label: 'Angebot', color: col[3] },
    { idx: Math.round((p.lagColdToDiscovery + p.lagDiscoveryToProposal + p.lagProposalToClose) / 4), label: 'Abschluss', color: '#16A34A' },
  ].filter((l) => l.idx > 0 && l.idx < data.length)
  const ticks = [0, 0.25, 0.5, 0.75, 1]
  return (
    <Section title="Pipeline-Hochlauf" badge="12 Monate" right={
      <div className="flex rounded-lg bg-gray-100 p-0.5 text-xs">
        {(['cum', 'disc'] as const).map((k) => (
          <button key={k} type="button" onClick={() => setMode(k)} className={`rounded-md px-3 py-1 font-medium ${mode === k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
            {k === 'cum' ? 'Kumuliert' : 'Je Monat'}
          </button>
        ))}
      </div>
    }>
      <div className="mb-4 grid grid-cols-3 gap-3 text-center">
        <Kpi label="Cold Call → Discovery" value={`${p.lagColdToDiscovery} Wo.`} />
        <Kpi label="Discovery → Angebot" value={`${p.lagDiscoveryToProposal} Wo.`} />
        <Kpi label="Angebot → Abschluss" value={`${p.lagProposalToClose} Wo.`} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Pipeline-Hochlauf über 12 Monate">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={T + ih - t * ih} y2={T + ih - t * ih} stroke="#EEF0F3" />
            <text x={L - 6} y={T + ih - t * ih + 3} textAnchor="end" fontSize="10" fill="#9CA3AF">{formatNumber(maxL * t)}</text>
            <text x={W - R + 6} y={T + ih - t * ih + 3} fontSize="10" fill={col[0]}>{formatNumber(maxR * t)}</text>
          </g>
        ))}
        {data.map((d, i) => <text key={i} x={x(i)} y={H - 10} textAnchor="middle" fontSize="10" fill="#9CA3AF">{d.label}</text>)}
        {series.map((s) => { const a = area(s.key, s.y); return (
          <g key={s.key}>
            <path d={a.fill} fill={s.color} opacity={0.08} />
            <path d={a.line} fill="none" stroke={s.color} strokeWidth="2" />
          </g>
        ) })}
        {lags.map((l) => (
          <g key={l.label}>
            <line x1={x(l.idx)} x2={x(l.idx)} y1={T} y2={T + ih} stroke={l.color} strokeDasharray="4 4" strokeWidth="1.5" />
            <text x={x(l.idx)} y={T - 6} textAnchor="middle" fontSize="10" fontWeight="600" fill={l.color}>{l.label}</text>
          </g>
        ))}
      </svg>
      <div className="mt-2 flex flex-wrap justify-center gap-4 text-xs text-gray-600">
        {series.map((s) => <span key={s.key} className="inline-flex items-center gap-1.5"><span className="h-2 w-4 rounded" style={{ background: s.color }} />{s.label}</span>)}
      </div>
    </Section>
  )
}

function rows(p: SalesParameters, m: CalculatedMetrics) {
  const disc = m.totalDiscoveries / p.workingMonths, prop = m.totalProposals / p.workingMonths, close = m.totalDealsNeeded / p.workingMonths
  return [
    { name: 'Cold Calls', icon: Phone, month: m.coldCallsPerMonth, min: p.timeColdCall, role: 'sdr', color: ORANGE },
    { name: 'WeCare Calls', icon: Users, month: m.weCareCallsPerMonth, min: p.timeWeCareCall, role: 'sdr', color: BLUE },
    { name: 'WinBack Calls', icon: RefreshCw, month: m.winBackCallsPerMonth, min: p.timeWinBackCall, role: 'sdr', color: '#16A34A' },
    { name: 'Empfehlungen', icon: MessageSquare, month: m.recommendationsPerMonth, min: p.timeRecommendationCall, role: 'sdr', color: '#6B7280' },
    { name: 'Discovery', icon: Search, month: disc, min: p.timeDiscoveryCall, role: 'ae', color: '#7C3AED' },
    { name: 'Angebote', icon: FileText, month: prop, min: p.timeNegotiatedOffer, role: 'ae', color: '#0891B2' },
    { name: 'Closing', icon: Handshake, month: close, min: p.timeClosing, role: 'ae', color: NAVY },
  ]
}

function Activities({ p, m }: { p: SalesParameters; m: CalculatedMetrics }) {
  const w = p.workingWeeksPerMonth, d = p.workingDaysPerWeek
  return (
    <Section title="Aktivitäten und Zeitbedarf">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="border-b border-gray-100 text-[10px] uppercase tracking-wider text-gray-400">
            <th className="py-2 text-left font-medium">Aktivität</th><th className="py-2 text-right font-medium">Pro Monat</th><th className="py-2 text-right font-medium">Pro Woche</th><th className="py-2 text-right font-medium">Pro Tag</th><th className="py-2 text-right font-medium">Std / Monat</th>
          </tr></thead>
          <tbody>
            {rows(p, m).map((r) => { const I = r.icon; return (
              <tr key={r.name} className="border-b border-gray-50">
                <td className="py-2.5"><span className="inline-flex items-center gap-2 font-medium text-gray-800"><span className="rounded-md p-1 text-white" style={{ background: r.color }}><I size={11} /></span>{r.name}</span></td>
                <td className="text-right font-semibold text-gray-900">{formatNumber(r.month)}</td>
                <td className="text-right text-gray-500">{formatNumber(r.month / w, 1)}</td>
                <td className="text-right text-gray-500">{formatNumber(r.month / w / d, 1)}</td>
                <td className="text-right font-semibold" style={{ color: BLUE }}>{formatNumber((r.month * r.min) / 60, 1)}h</td>
              </tr>
            ) })}
          </tbody>
          <tfoot><tr style={{ background: '#EBF1FF' }}><td colSpan={4} className="px-2 py-2.5 font-bold text-gray-900">Gesamt (inkl. Puffer)</td><td className="px-2 text-right font-bold" style={{ color: BLUE }}>{formatNumber(m.hoursPerMonth, 1)}h</td></tr></tfoot>
        </table>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <Kpi accent label="Pro Monat" value={`${formatNumber(m.hoursPerMonth)}h`} />
        <Kpi accent label="Pro Woche" value={`${formatNumber(m.hoursPerWeek, 1)}h`} />
        <Kpi accent label="Pro Tag" value={`${formatNumber(m.hoursPerDay, 1)}h`} />
      </div>
    </Section>
  )
}

function PerfectWeek({ p, m }: { p: SalesParameters; m: CalculatedMetrics }) {
  const all = rows(p, m)
  const block = (role: 'sdr' | 'ae', title: string, dot: string) => {
    const rs = all.filter((r) => r.role === role)
    const total = rs.reduce((n, r) => n + (r.month / p.workingWeeksPerMonth * r.min) / 60, 0)
    return (
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900"><span className="h-2 w-2 rounded-full" style={{ background: dot }} />{title}</p>
          <span className="text-xs text-gray-500">{formatNumber(total, 1)}h / Woche</span>
        </div>
        <div className="space-y-1.5">
          {rs.map((r) => { const wk = r.month / p.workingWeeksPerMonth; const h = (wk * r.min) / 60; return (
            <div key={r.name} className="flex items-center gap-3 text-xs">
              <span className="w-28 shrink-0 text-gray-700">{r.name}</span>
              <span className="relative h-5 flex-1 overflow-hidden rounded bg-gray-100">
                <span className="absolute inset-y-0 left-0 rounded" style={{ width: `${Math.min(100, total ? (h / total) * 100 : 0)}%`, background: r.color, opacity: 0.85 }} />
              </span>
              <span className="w-14 text-right font-semibold text-gray-900">{formatNumber(wk, 1)}×</span>
              <span className="w-12 text-right" style={{ color: BLUE }}>{formatNumber(h, 1)}h</span>
            </div>
          ) })}
        </div>
      </div>
    )
  }
  return (
    <Section title="Die perfekte Woche">
      <div className="grid gap-6 md:grid-cols-2">
        {block('sdr', 'SDR · Sales Development', ORANGE)}
        {block('ae', 'AE · Account Executive', BLUE)}
      </div>
    </Section>
  )
}

function Okrs({ p, m }: { p: SalesParameters; m: CalculatedMetrics }) {
  const o = teamOkrs(p, m)
  const table = (title: string, objective: string, items: Array<[string, [number, number, number], 'n' | 'n1' | 'eur']>) => (
    <div className="rounded-xl border border-gray-100 p-4">
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      <table className="mt-2 w-full text-xs">
        <thead><tr className="text-[10px] uppercase tracking-wider text-gray-400"><th className="py-1.5 text-left font-medium">Key Result</th><th className="text-right font-medium">Woche</th><th className="text-right font-medium">Monat</th><th className="text-right font-medium">Quartal</th></tr></thead>
        <tbody>
          {items.map(([label, v, f]) => { const fmt = (x: number) => f === 'eur' ? formatCurrency(x) : formatNumber(x, f === 'n1' ? 1 : 0); return (
            <tr key={label} className="border-t border-gray-50">
              <td className="py-2 font-medium text-gray-800">{label}</td>
              <td className="text-right text-gray-500">{fmt(v[0])}</td><td className="text-right text-gray-500">{fmt(v[1])}</td>
              <td className="text-right font-semibold" style={{ color: BLUE }}>{fmt(v[2])}</td>
            </tr>
          ) })}
        </tbody>
      </table>
      <p className="mt-3 text-[11px] text-gray-500"><strong className="font-semibold">Objective:</strong> {objective}</p>
    </div>
  )
  return (
    <Section title="Team-OKRs" right={<Target size={16} style={{ color: BLUE }} />}>
      <div className="grid gap-4 md:grid-cols-2">
        {table('SDR · Sales Development', 'Pipeline-Aufbau durch qualifizierte Entscheiderkontakte', [
          ['Cold Calls', o.sdr.calls, 'n'], ['Entscheidergespräche', o.sdr.conversations, 'n'], ['Qualifizierte Leads (SQL)', o.sdr.sqls, 'n1'],
        ])}
        {table('AE · Account Executive', 'Umsatzwachstum durch saubere Abschlüsse', [
          ['3M Weighted Pipeline', o.ae.pipeline, 'eur'], ['Abgeschlossene Deals', o.ae.deals, 'n1'], ['Closed Revenue', o.ae.revenue, 'eur'],
        ])}
      </div>
    </Section>
  )
}
