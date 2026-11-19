/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Upload, Calendar, Mic, UserRound, ArrowRight, Play, Flame } from 'lucide-react'
import { viewer, getMember, scoreSeries, startData, fmt, type Todo } from '@/lib/portal/member'
import { currentContext } from '@/lib/actions/strategy'
import { listGoals, goalHistory } from '@/lib/goals/schema'
import { GoalsBoard } from '@/components/goals/GoalsBoard'

export const dynamic = 'force-dynamic'

const muted = '#605D5D'
const card = 'rounded-[24px] bg-white shadow-[0_1px_2px_rgba(14,23,51,.05),0_18px_40px_-18px_rgba(14,23,51,.18)]'

function greeting(name: string) {
  const h = Number(new Date().toLocaleString('de-DE', { hour: 'numeric', hour12: false, timeZone: 'Europe/Berlin' }))
  return `${h < 11 ? 'Guten Morgen' : h < 18 ? 'Hallo' : 'Guten Abend'}, ${name}`
}

function Spark({ values }: { values: number[] }) {
  if (values.length < 2) return null
  const w = 260, h = 48, min = Math.min(...values) - 5, max = Math.max(...values) + 5
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / (max - min || 1)) * h}`).join(' ')
  return <svg viewBox={`0 0 ${w} ${h}`} className="h-12 w-full" preserveAspectRatio="none" aria-hidden><polyline points={pts} fill="none" stroke="#1A5FD4" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" /></svg>
}

const TODO_ICON: Record<Todo['kind'], typeof Upload> = { input: Upload, output: Upload, transcript: Mic, profile: UserRound }

/** Start der Member-Section: was jetzt dran ist, wo ich stehe, was als Nächstes kommt. */
export default async function DashboardPage() {
  const v = await viewer()
  if (!v) redirect('/auth/login')
  const m = await getMember(v.userId)
  if (!m) redirect('/auth/login')
  const [series, sd, ctx] = await Promise.all([scoreSeries(m.email), startData(m, v.role).catch(() => null), currentContext().catch(() => null)])
  const goals = ctx?.companyId ? await listGoals(ctx.companyId).catch(() => []) : []
  const hist = goals.length ? await goalHistory(goals.map((g) => g.id)).catch(() => ({})) : {}
  const last = series.at(-1), first = series[0]
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="flex flex-col gap-9">
      <div className="flex flex-wrap items-baseline gap-3">
        <h1 className="m-0 text-[30px] font-bold tracking-[-.02em]">{greeting(m.firstName)}</h1>
        <span className="text-[15px]" style={{ color: muted }}>Das ist heute dran.</span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="relative flex min-h-[300px] items-end overflow-hidden rounded-[28px] bg-[#0E1733] p-8 text-white sm:p-10">
          <img src="/member/continue.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: '70% 30%' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg,rgba(14,23,51,.97) 0%,rgba(14,23,51,.85) 42%,rgba(26,95,212,.25) 100%)' }} />
          <div className="relative flex min-w-0 flex-1 flex-col gap-3">
            {sd?.next ? (<>
              <span className="text-[11px] font-bold uppercase tracking-[.14em] text-[#8FB0EC]">{sd.next.eyebrow}</span>
              <span className="text-[13px] text-[#AFC0DE]">{sd.next.sub}</span>
              <h2 className="m-0 max-w-[560px] text-[30px] font-bold leading-[1.1] tracking-[-.025em] sm:text-[34px]">{sd.next.title}</h2>
              {sd.next.progress !== null && (
                <div className="flex max-w-[360px] items-center gap-3"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20"><div className="h-1.5 rounded-full bg-[#6FA3FF]" style={{ width: `${sd.next.progress}%` }} /></div><span className="text-[13px] text-[#AFC0DE]">{sd.next.progress} %</span></div>
              )}
              <div className="mt-1.5"><Link href={sd.next.href as '/'} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[15px] font-bold text-[#0E1733] no-underline"><Play size={16} />Weiter</Link></div>
            </>) : (<>
              <span className="text-[11px] font-bold uppercase tracking-[.14em] text-[#8FB0EC]">Los geht&apos;s</span>
              <h2 className="m-0 max-w-[560px] text-[30px] font-bold leading-[1.1] tracking-[-.025em] sm:text-[34px]">Wo bremst Euer Umsatz? Finde den Engpass in drei Minuten.</h2>
              <div className="mt-1.5 flex flex-wrap gap-3">
                <Link href={'/check/bottleneck' as '/'} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[15px] font-bold text-[#0E1733] no-underline"><Play size={16} />Diagnose starten</Link>
                <Link href={'/dashboard/frameworks' as '/'} className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-[15px] font-bold text-white no-underline ring-1 ring-white/30">Frameworks ansehen</Link>
              </div>
            </>)}
          </div>
        </div>

        <div className={`${card} flex min-w-0 flex-col gap-4 p-7`}>
          <div className="flex items-center gap-2"><b className="text-[16px]">Dein Stand</b>
            {series.length >= 2 && <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[#FFF0E6] px-3 py-1 text-[12px] font-bold text-[#B4400B]"><Flame size={13} />{series.length} Gespräche ausgewertet</span>}
          </div>
          {last ? (<>
            <div className="flex items-center gap-3.5">
              <span className="relative inline-block h-16 w-16 flex-none">
                <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90"><circle cx="18" cy="18" r="15.5" fill="none" stroke="#E9E6E4" strokeWidth="3.5" /><circle cx="18" cy="18" r="15.5" fill="none" stroke="#1A5FD4" strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${(last.overall / 100) * 97.4} 97.4`} /></svg>
                <span className="absolute inset-0 flex items-center justify-center text-[16px] font-bold">{last.overall}</span>
              </span>
              <span className="flex flex-col gap-0.5"><span className="text-[13px]" style={{ color: muted }}>Gesprächs-Score</span><span className="text-[20px] font-bold">{last.overall >= 75 ? 'Stark' : last.overall >= 55 ? 'Solide' : 'Mit Luft nach oben'}</span><span className="text-[12px]" style={{ color: muted }}>letzter Check {fmt(last.date)}</span></span>
            </div>
            {series.length >= 2 && <div className="flex flex-col gap-1"><div className="flex justify-between text-[13px]"><span style={{ color: muted }}>Verlauf</span><b>{first.overall} → {last.overall} {last.overall >= first.overall ? '↗' : '↘'}</b></div><Spark values={series.map((s) => s.overall)} /></div>}
            <Link href={'/dashboard/score' as '/'} className="mt-auto text-[14px] font-bold text-[#1A5FD4] no-underline">Mein Score ansehen →</Link>
          </>) : (<>
            <p className="m-0 text-[15px] leading-relaxed" style={{ color: muted }}>Lade das Transkript eines Erstgesprächs hoch. Dann siehst Du hier Deinen Gesprächs-Score und wie er sich entwickelt.</p>
            <Link href={'/gespraechs-check' as '/'} className="mt-auto inline-flex w-fit items-center gap-2 rounded-full bg-[#1A5FD4] px-4 py-2.5 text-[14px] font-bold text-white no-underline"><Mic size={15} />Ersten Check starten</Link>
          </>)}
        </div>
      </div>

      {sd && sd.todos.length > 0 && (
        <div className={`${card} flex flex-col gap-4 p-[22px]`}>
          <div className="flex items-center gap-2.5"><b className="text-[16px]">Offen für Dich</b><span className="rounded-full bg-[#F5F4F2] px-2.5 py-0.5 text-[12px] font-bold">{sd.todos.length}</span></div>
          <div>
            {sd.todos.map((t) => {
              const I = TODO_ICON[t.kind]
              return (
                <Link key={t.id} href={t.href as '/'} className="flex items-center gap-3.5 border-t border-[#F0EEEC] py-3 text-inherit no-underline">
                  <span className="h-[22px] w-[22px] flex-none rounded-md border-2 border-[#C9C6C3]" />
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] bg-[#EBF1FF]"><I size={17} color="#1A5FD4" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-[15px] font-semibold leading-snug">{t.title}</span><span className="block text-[13px]" style={{ color: muted }}>{t.sub}</span></span>
                  <span className="hidden flex-none text-[14px] font-bold text-[#1A5FD4] sm:block">{t.cta} →</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {sd && sd.timeline.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between gap-3"><b className="text-[20px] tracking-[-.01em]">Deine nächsten Schritte</b><Link href={'/dashboard/guide' as '/'} className="text-[14px] font-bold text-[#1A5FD4] no-underline">Programm Guide →</Link></div>
          <ol className="relative m-0 list-none p-0">
            <span aria-hidden className="absolute bottom-3 left-[19px] top-3 w-0.5 bg-[#E6E3E1]" />
            {sd.timeline.map((t) => {
              const done = t.status === 'done', past = !!t.end && t.end < today && !done
              return (
                <li key={t.id} className="relative flex gap-4 pb-3">
                  <span className="relative z-10 mt-3 flex h-10 w-10 flex-none items-center justify-center rounded-full text-[12px] font-bold" style={{ background: done ? '#16955C' : t.now ? '#1A5FD4' : '#fff', color: done || t.now ? '#fff' : '#3A3836', boxShadow: done || t.now ? undefined : 'inset 0 0 0 2px #E6E3E1' }}>{t.code}</span>
                  <Link href={t.href as '/'} className={`${card} flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4 text-inherit no-underline ${t.now ? 'ring-2 ring-[#1A5FD4]' : ''}`}>
                    <span className="min-w-0 flex-1"><span className="block text-[12px] font-bold uppercase tracking-[.1em]" style={{ color: t.color || '#1A5FD4' }}>{t.program}</span><span className="block text-[16px] font-semibold leading-snug">{t.title}</span></span>
                    <span className="text-[13px]" style={{ color: past ? '#B0001F' : muted }}>{t.start ? `${fmt(t.start)}${t.end && t.end !== t.start ? ` – ${fmt(t.end)}` : ''}` : 'Termin folgt'}</span>
                    {t.total > 0 && <span className="rounded-full bg-[#F5F4F2] px-2.5 py-1 text-[12px] font-bold">{t.total - t.open}/{t.total} erledigt</span>}
                    {t.now && <span className="rounded-full bg-[#EBF1FF] px-2.5 py-1 text-[12px] font-bold text-[#124293]">jetzt</span>}
                    <ArrowRight size={16} color={muted} className="hidden sm:block" />
                  </Link>
                </li>
              )
            })}
          </ol>
        </div>
      )}

      {goals.length > 0 && (
        <div className="flex flex-col gap-2">
          <b className="text-[20px] tracking-[-.01em]">Eure Ziele</b>
          <p className="m-0 text-[14px]" style={{ color: muted }}>Woran Marketing, Sales und GTM gemeinsam gemessen werden.</p>
          <div className="mt-2"><GoalsBoard goals={goals} history={hist} compact /></div>
        </div>
      )}
      {!sd?.next && !(sd?.timeline.length) && (
        <div className={`${card} flex flex-wrap items-center gap-4 p-6`}>
          <Calendar size={20} color="#1A5FD4" />
          <span className="min-w-0 flex-1 text-[15px]">Noch kein Programm gestartet? Lass uns gemeinsam schauen, was für Euch der richtige Einstieg ist.</span>
          <Link href={'/schedule/markus/strategie-60' as '/'} className="text-[14px] font-bold text-[#1A5FD4] no-underline">Strategiegespräch buchen →</Link>
        </div>
      )}
    </div>
  )
}
