import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Mic, ArrowRight } from 'lucide-react'
import { viewer, getMember, scoreSeries, CRITERIA, fmt } from '@/lib/portal/member'

export const dynamic = 'force-dynamic'

const muted = '#605D5D'
const card = 'rounded-[24px] bg-white p-7 shadow-[0_1px_2px_rgba(14,23,51,.05),0_18px_40px_-18px_rgba(14,23,51,.18)]'
const COLORS = ['#1A5FD4', '#16955C', '#E09E00', '#B0001F', '#7C3AED']

/** Mein Score: Gesprächs-Score über die Zeit, gesamt und je Kriterium, aus den eigenen Gesprächs-Checks. */
export default async function ScorePage() {
  const v = await viewer()
  if (!v) redirect('/auth/login')
  const m = await getMember(v.userId)
  if (!m) redirect('/auth/login')
  const s = await scoreSeries(m.email)
  const last = s.at(-1), first = s[0]
  const keys = Object.keys(CRITERIA)

  // Diagramm: x = Zeit (gleichmäßig je Check), y = 0–100
  const W = 760, H = 260, L = 40, R = 16, T = 16, B = 32
  const X = (i: number) => L + (s.length < 2 ? (W - L - R) / 2 : (i / (s.length - 1)) * (W - L - R))
  const Y = (v: number) => T + (1 - v / 100) * (H - T - B)
  const path = (vals: (number | null)[]) => vals.map((v, i) => (v === null ? null : `${X(i)},${Y(v)}`)).filter(Boolean).join(' ')

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-[30px] font-bold tracking-[-.02em]">Mein Score</h1>
          <p className="m-0 mt-1 text-[15px]" style={{ color: muted }}>Aus Deinen Gesprächs-Checks: fünf Kriterien, je 0 bis 100. Lade alle vier Wochen ein neues Gespräch hoch, dann siehst Du, was sich bewegt.</p>
        </div>
        <Link href={'/gespraechs-check' as '/'} className="inline-flex items-center gap-2 rounded-full bg-[#1A5FD4] px-5 py-3 text-[15px] font-bold text-white no-underline"><Mic size={16} />Neues Transkript hochladen</Link>
      </div>

      {!last ? (
        <div className={`${card} text-[15px]`} style={{ color: muted }}>Noch kein Gespräch ausgewertet. Der Gesprächs-Check zeigt Dir nach dem ersten Transkript, wo Dein Gespräch gekippt ist und welche Frage gefehlt hat.</div>
      ) : (<>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <div className={`${card} flex flex-col gap-2`}>
            <span className="text-[13px] font-bold uppercase tracking-[.12em] text-[#1A5FD4]">Gesamt</span>
            <span className="text-[64px] font-bold leading-none tracking-[-.04em]">{last.overall}</span>
            {s.length > 1 && <span className="text-[15px] font-semibold" style={{ color: last.overall >= first.overall ? '#16955C' : '#B0001F' }}>{last.overall >= first.overall ? '+' : ''}{last.overall - first.overall} seit {fmt(first.date)}</span>}
            <span className="text-[13px]" style={{ color: muted }}>{s.length} {s.length === 1 ? 'Gespräch' : 'Gespräche'} ausgewertet · letztes am {fmt(last.date)}</span>
          </div>
          <div className={card}>
            <b className="text-[16px]">Je Kriterium, letzter Check</b>
            <div className="mt-4 flex flex-col gap-3">
              {keys.map((k, i) => {
                const v = last.criteria[k]
                const prev = s.length > 1 ? s.at(-2)!.criteria[k] : null
                return (
                  <div key={k} className="grid grid-cols-[minmax(0,180px)_1fr_48px] items-center gap-3">
                    <span className="truncate text-[14px] font-semibold">{CRITERIA[k]}</span>
                    <span className="h-2.5 overflow-hidden rounded-full bg-[#F4F4F2]"><span className="block h-full rounded-full" style={{ width: `${v ?? 0}%`, background: COLORS[i] }} /></span>
                    <span className="text-right text-[15px] font-bold tabular-nums">{v ?? '–'}{v !== null && prev !== null && v !== undefined && prev !== undefined && v !== prev && <span className="ml-1 text-[11px]" style={{ color: v > prev ? '#16955C' : '#B0001F' }}>{v > prev ? '↑' : '↓'}</span>}</span>
                  </div>
                )
              })}
            </div>
            <p className="mb-0 mt-4 text-[12px]" style={{ color: muted }}>„–“ heißt: Das Gespräch gab für dieses Kriterium keinen Beleg, z. B. weil kein Angebot vorkam.</p>
          </div>
        </div>

        {s.length > 1 && (
          <div className={card}>
            <b className="text-[16px]">Verlauf</b>
            <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" role="img" aria-label="Gesprächs-Score über die Zeit">
              {[0, 25, 50, 75, 100].map((g) => <g key={g}><line x1={L} x2={W - R} y1={Y(g)} y2={Y(g)} stroke="#EFEDEB" /><text x={L - 8} y={Y(g) + 4} fontSize="11" textAnchor="end" fill={muted}>{g}</text></g>)}
              {keys.map((k, i) => <polyline key={k} points={path(s.map((p) => p.criteria[k] ?? null))} fill="none" stroke={COLORS[i]} strokeWidth="1.5" strokeOpacity=".45" />)}
              <polyline points={path(s.map((p) => p.overall))} fill="none" stroke="#0D0D0B" strokeWidth="3" strokeLinejoin="round" />
              {s.map((p, i) => <g key={p.id}><circle cx={X(i)} cy={Y(p.overall)} r="4.5" fill="#0D0D0B" /><text x={X(i)} y={H - 10} fontSize="11" textAnchor="middle" fill={muted}>{fmt(p.date)}</text></g>)}
            </svg>
            <div className="mt-2 flex flex-wrap gap-4 text-[12px]" style={{ color: muted }}>
              <span className="inline-flex items-center gap-1.5"><span className="h-[3px] w-4 bg-[#0D0D0B]" />Gesamt</span>
              {keys.map((k, i) => <span key={k} className="inline-flex items-center gap-1.5"><span className="h-[3px] w-4" style={{ background: COLORS[i], opacity: .6 }} />{CRITERIA[k]}</span>)}
            </div>
          </div>
        )}

        <div className={card}>
          <b className="text-[16px]">Deine Gespräche</b>
          <div className="mt-3">
            {[...s].reverse().map((p) => (
              <Link key={p.id} href={`/dashboard/gespraechs-checks/${p.publicId}` as '/'} className="flex items-center gap-4 border-t border-[#F0EEEC] py-3 text-inherit no-underline">
                <span className="w-14 text-[22px] font-bold tabular-nums">{p.overall}</span>
                <span className="min-w-0 flex-1"><span className="block text-[15px] font-semibold">{p.seller ? `Gespräch · ${p.seller}` : 'Gespräch'}</span><span className="block text-[13px]" style={{ color: muted }}>{new Date(p.date).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}</span></span>
                <ArrowRight size={16} color={muted} />
              </Link>
            ))}
          </div>
        </div>
      </>)}
    </div>
  )
}
