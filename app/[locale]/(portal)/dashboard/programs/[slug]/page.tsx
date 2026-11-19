import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, Lock, Play, FileText, Dumbbell, Upload, MessageSquare } from 'lucide-react'
import { viewer, getMember } from '@/lib/portal/member'
import { courseFor, KIND_LABEL } from '@/lib/courses/member'
import type { LessonView } from '@/lib/courses/store'

export const dynamic = 'force-dynamic'

const muted = '#605D5D'
const card = 'rounded-[24px] bg-white shadow-[0_1px_2px_rgba(14,23,51,.05),0_18px_40px_-18px_rgba(14,23,51,.18)]'
const ICON = { video: Play, read: FileText, exercise: Dumbbell, homework: Upload }

function Ring({ p }: { p: number }) {
  const r = 34, c = 2 * Math.PI * r
  return (
    <svg width="84" height="84" viewBox="0 0 84 84" aria-hidden>
      <circle cx="42" cy="42" r={r} fill="none" stroke="#E8EFFB" strokeWidth="8" />
      <circle cx="42" cy="42" r={r} fill="none" stroke="#1A5FD4" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(p / 100) * c} ${c}`} transform="rotate(-90 42 42)" />
      <text x="42" y="47" textAnchor="middle" fontSize="17" fontWeight="700" fill="#0D0D0B">{p} %</text>
    </svg>
  )
}

function Row({ l, slug, isNext }: { l: LessonView; slug: string; isNext: boolean }) {
  const I = ICON[l.kind]
  const locked = !l.gate.open
  const sub = [KIND_LABEL[l.kind], l.durationMin ? `${l.durationMin} Min.` : null, l.slides.length ? `${l.slides.length} Folien` : null].filter(Boolean).join(' · ')
  const inner = (
    <div className={`flex items-center gap-4 rounded-2xl px-4 py-3.5 transition-colors ${isNext ? 'bg-[#EBF1FF]' : locked ? '' : 'hover:bg-[#F7F6F4]'}`}>
      <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-full ${l.done ? 'bg-[#16955C] text-white' : locked ? 'bg-[#F1F0EE] text-[#A09D9B]' : isNext ? 'bg-[#1A5FD4] text-white' : 'bg-[#EEF0F4] text-[#124293]'}`}>
        {l.done ? <Check size={17} /> : locked ? <Lock size={15} /> : <I size={16} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-[15px] font-semibold ${locked ? 'text-[#8A8784]' : ''}`}>{l.index} · {l.title}</span>
        <span className="block text-[13px]" style={{ color: muted }}>
          {sub}
          {l.kind === 'homework' && l.submitted && <> · eingereicht{l.feedback && <span className="font-semibold text-[#16955C]"> · Feedback ist da</span>}</>}
        </span>
      </span>
      {locked ? <span className="flex-none rounded-full bg-[#F1F0EE] px-3 py-1 text-[12px] font-semibold text-[#6F6C69]">{l.gate.short}</span>
        : isNext ? <span className="inline-flex flex-none items-center gap-1.5 rounded-full bg-[#1A5FD4] px-4 py-2 text-[13px] font-bold text-white">{l.started ? 'Weiter' : 'Starten'}<ArrowRight size={14} /></span>
        : null}
    </div>
  )
  return locked ? <div title={l.gate.reason ?? ''}>{inner}</div> : <Link href={`/dashboard/programs/${slug}/${l.slug}` as '/'} className="block text-inherit no-underline">{inner}</Link>
}

/** Kursseite: Überblick, Fortschritt, alle Module und Lektionen am Stück, Sperren mit Grund. */
export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const v = await viewer()
  if (!v) redirect('/auth/login')
  const m = await getMember(v.userId)
  if (!m) redirect('/auth/login')
  const cv = await courseFor(m.id, m.companyId, v.role, slug)
  if (!cv) notFound()
  const c = cv.course
  const reasons = cv.modules.filter((x) => !x.gate.open && x.gate.reason)

  return (
    <div className="flex flex-col gap-8">
      <Link href={'/dashboard/programs' as '/'} className="inline-flex items-center gap-1.5 text-[14px] font-semibold no-underline" style={{ color: muted }}><ArrowLeft size={15} />Kurse und Programme</Link>

      <div className={`${card} flex flex-wrap items-center gap-8 p-8 sm:p-10`}>
        <div className="flex min-w-[280px] flex-1 flex-col gap-3">
          <span className="text-[12px] font-bold uppercase tracking-[.12em] text-[#1A5FD4]">{c.label ?? 'Kurs'}</span>
          <h1 className="m-0 text-[36px] font-bold leading-[1.08] tracking-[-.025em]">{c.title}</h1>
          {c.subtitle && <p className="m-0 max-w-[620px] text-[17px] leading-relaxed" style={{ color: muted }}>{c.subtitle}</p>}
          {c.programName && <p className="m-0 text-[14px]" style={{ color: muted }}>Teil der {c.label ?? c.programName}{m.companyId ? <> · <Link href={'/dashboard/guide' as '/'} className="font-semibold text-[#1A5FD4] no-underline">Termine im Programm Guide</Link></> : null}</p>}
          <p className="m-0 text-[14px]" style={{ color: muted }}>{cv.total} Bausteine · {cv.modules.filter((x) => !x.bonus).length} Module{c.coach ? ` · Coach: ${c.coach}` : ''}</p>
        </div>
        <div className="flex items-center gap-6">
          <Ring p={cv.percent} />
          <div className="flex flex-col gap-2">
            <span className="text-[14px]" style={{ color: muted }}>{cv.done} von {cv.total} Bausteinen</span>
            {cv.next && <Link href={`/dashboard/programs/${c.slug}/${cv.next.slug}` as '/'} className="inline-flex items-center gap-2 rounded-full bg-[#1A5FD4] px-5 py-3 text-[15px] font-bold text-white no-underline"><Play size={15} />{cv.done ? 'Weiter' : 'Starten'}: {cv.next.title}</Link>}
          </div>
        </div>
      </div>

      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex flex-col gap-6">
          {cv.modules.map((mod) => (
            <section key={mod.id} className={`${card} p-6 sm:p-7`}>
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3 px-1">
                <div>
                  <span className="block text-[12px] font-bold uppercase tracking-[.12em]" style={{ color: mod.bonus ? '#B07C0A' : '#1A5FD4' }}>{mod.bonus ? 'Bonus' : `Modul ${mod.pos}`}</span>
                  <h2 className="m-0 mt-1 text-[21px] font-bold tracking-[-.01em]">{mod.title}</h2>
                  {mod.subtitle && <p className="m-0 mt-1 text-[14px]" style={{ color: muted }}>{mod.subtitle}</p>}
                </div>
                <span className="text-[13px] tabular-nums" style={{ color: muted }}>{mod.done} / {mod.lessons.length}</span>
              </div>
              {!mod.gate.open && mod.gate.reason && <p className="mx-1 mb-2 mt-0 flex items-center gap-2 rounded-xl bg-[#FFF8E6] px-4 py-2.5 text-[14px] text-[#7A5600]"><Lock size={14} />{mod.gate.reason}</p>}
              <div className="flex flex-col gap-0.5">
                {mod.lessons.map((l) => <Row key={l.id} l={l} slug={c.slug} isNext={cv.next?.id === l.id} />)}
              </div>
            </section>
          ))}
        </div>

        <aside className="flex flex-col gap-5">
          <div className={`${card} p-6`}>
            <b className="text-[16px]">So schaltest Du frei</b>
            <ul className="m-0 mt-3 flex list-none flex-col gap-3 p-0 text-[14px] leading-snug" style={{ color: muted }}>
              <li><b className="text-[#0D0D0B]">Homework</b><br />Das nächste Modul öffnet, sobald Du die Homework eingereicht hast.</li>
              <li><b className="text-[#0D0D0B]">Live-Session</b><br />Manche Module öffnen mit der nächsten gemeinsamen Session.</li>
              <li><b className="text-[#0D0D0B]">Datum</b><br />Neue Inhalte kommen zum angekündigten Termin.</li>
            </ul>
            {reasons.length > 0 && <p className="mb-0 mt-4 text-[13px]" style={{ color: muted }}>Gerade gesperrt: {reasons.map((r) => r.title).join(', ')}.</p>}
          </div>
          {c.description && (
            <div className={`${card} p-6`}>
              <b className="text-[16px]">Worum es geht</b>
              <p className="m-0 mt-2 whitespace-pre-line text-[14px] leading-relaxed" style={{ color: muted }}>{c.description}</p>
            </div>
          )}
          <div className="rounded-[24px] border border-dashed border-[#D9D6D3] p-6 text-[14px] leading-snug" style={{ color: muted }}>
            <MessageSquare size={18} className="mb-2" />Fragen zu einer Lektion? Frag Eily oben in der Suche. Die Unterhaltung mit den anderen Teilnehmern kommt mit der Community.
          </div>
        </aside>
      </div>
    </div>
  )
}
