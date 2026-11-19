import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, Lock } from 'lucide-react'
import { viewer, getMember } from '@/lib/portal/member'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { myCourses } from '@/lib/courses/member'

export const dynamic = 'force-dynamic'

const muted = '#605D5D'
const card = 'rounded-[24px] bg-white shadow-[0_1px_2px_rgba(14,23,51,.05),0_18px_40px_-18px_rgba(14,23,51,.18)]'

/** Kurse und Programme: alles, wo ich dabei bin, mit Fortschritt; dazu, was es noch gibt. */
export default async function ProgramsPage() {
  const v = await viewer()
  if (!v) redirect('/auth/login')
  const m = await getMember(v.userId)
  if (!m) redirect('/auth/login')
  const courses = await myCourses(m.id, m.companyId, v.role).catch(() => [])
  // Programme der Firma (Programm Guide). Hat ein Programm einen Kurs, zeigt die Kurskarte beides.
  const linked = new Set(courses.map((c) => c.course.programId).filter(Boolean) as string[])
  const ro = m.companyId ? ((await db.execute(sql`
    SELECT r.title, r.program_id, p.slug FROM rollouts r LEFT JOIN programs p ON p.id = r.program_id
    WHERE r.company_id = ${m.companyId} AND r.status IN ('active','planned') ORDER BY r.start_date`).catch(() => [])) as unknown as { title: string; program_id: string | null; slug: string | null }[]) : []
  const teamPrograms = ro.filter((r) => !r.program_id || !linked.has(r.program_id)).map((r) => ({ label: r.title }))
  const guideFor = new Set(ro.map((r) => r.program_id).filter(Boolean) as string[])
  const hasAcademy = courses.some((c) => c.course.label?.toLowerCase().includes('academy')) || ro.some((r) => r.slug?.includes('academy'))

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="m-0 text-[30px] font-bold tracking-[-.02em]">Kurse und Programme</h1>
        <p className="m-0 mt-1.5 max-w-[640px] text-[15px] leading-relaxed" style={{ color: muted }}>Alles, was Du mit Deinem Zugang lernen kannst, und was als Nächstes freigeschaltet wird.</p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="m-0 text-[13px] font-bold uppercase tracking-[.14em]" style={{ color: muted }}>Meine</h2>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((cv) => {
            const c = cv.course
            return (
              <Link key={c.id} href={`/dashboard/programs/${c.slug}` as '/'} className={`${card} group flex min-h-[230px] flex-col gap-3 p-7 text-inherit no-underline transition-transform hover:-translate-y-0.5`}>
                <span className="text-[12px] font-bold uppercase tracking-[.12em] text-[#1A5FD4]">{c.label ?? 'Kurs'}</span>
                <span className="text-[22px] font-bold leading-tight tracking-[-.015em]">{c.title}</span>
                <span className="text-[14px]" style={{ color: muted }}>{cv.total} Bausteine{c.coach ? ` · ${c.coach}` : ''}</span>
                <div className="mt-auto flex items-center gap-3 pt-3">
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EEF0F4]"><span className="block h-full rounded-full bg-[#1A5FD4]" style={{ width: `${cv.percent}%` }} /></span>
                  <span className="text-[13px] font-semibold tabular-nums">{cv.percent} %</span>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[14px] font-bold text-[#1A5FD4]">{cv.done ? 'Weiter' : 'Starten'}<ArrowRight size={15} /></span>
                {c.programId && guideFor.has(c.programId) && <span className="text-[13px]" style={{ color: muted }}>Termine und Team-Schritte im Programm Guide</span>}
              </Link>
            )
          })}
          {teamPrograms.map((p) => (
            <Link key={p.label} href={'/dashboard/guide' as '/'} className={`${card} flex min-h-[230px] flex-col gap-3 p-7 text-inherit no-underline`}>
              <span className="text-[12px] font-bold uppercase tracking-[.12em] text-[#1A5FD4]">Programm · Team</span>
              <span className="text-[22px] font-bold leading-tight tracking-[-.015em]">{p.label}</span>
              <span className="text-[14px]" style={{ color: muted }}>mit Deinem Team, Schritt für Schritt im Programm Guide</span>
              <span className="mt-auto inline-flex items-center gap-1.5 text-[14px] font-bold text-[#1A5FD4]">Zum Programm Guide<ArrowRight size={15} /></span>
            </Link>
          ))}
          {!courses.length && !teamPrograms.length && (
            <div className={`${card} p-7 text-[15px] sm:col-span-2`} style={{ color: muted }}>Du bist noch in keinem Kurs. Sobald Deine Firma oder Du einen Zugang habt, erscheint er hier.</div>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="m-0 text-[13px] font-bold uppercase tracking-[.14em]" style={{ color: muted }}>Weitere Programme</h2>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[
            ...(hasAcademy ? [] : [{ label: 'Programm · Academy', title: 'SalesMade Academy', sub: 'Gesprächsführung live mit Markus, 19 Skills, Sparrings und Gesprächs-Checks', href: '/academy' }]),
            { label: 'Programm · Aljona Eilers', title: 'Liquid Leadership', sub: 'Group Coaching und 1:1 für Führungskräfte', href: '/liquidleadership' },
          ].map((p) => (
            <div key={p.title} className="flex min-h-[200px] flex-col gap-3 rounded-[24px] border border-[#E6E3E1] bg-[#FAFAF8] p-7">
              <span className="text-[12px] font-bold uppercase tracking-[.12em]" style={{ color: muted }}>{p.label}</span>
              <span className="text-[20px] font-bold leading-tight">{p.title}</span>
              <span className="text-[14px]" style={{ color: muted }}>{p.sub}</span>
              <span className="mt-auto inline-flex items-center gap-1.5 text-[13px]" style={{ color: muted }}><Lock size={14} />nicht in Deinem Zugang</span>
              <Link href={p.href as '/'} className="inline-flex items-center gap-1.5 text-[14px] font-bold text-[#1A5FD4] no-underline">Ansehen<ArrowRight size={15} /></Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
