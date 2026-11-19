import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, Check, Lock } from 'lucide-react'
import { viewer, getMember } from '@/lib/portal/member'
import { courseFor, KIND_LABEL } from '@/lib/courses/member'
import { loadProgress } from '@/lib/courses/store'
import { LessonBody } from '@/components/courses/LessonBody'

export const dynamic = 'force-dynamic'

const muted = '#605D5D'

/** Lektion: links der Kurs am Stück (mit Sperren), rechts Inhalt, Folien, Eingaben, Homework. */
export default async function LessonPage({ params }: { params: Promise<{ slug: string; lesson: string }> }) {
  const { slug, lesson } = await params
  const v = await viewer()
  if (!v) redirect('/auth/login')
  const m = await getMember(v.userId)
  if (!m) redirect('/auth/login')
  const cv = await courseFor(m.id, m.companyId, v.role, slug)
  if (!cv) notFound()
  const l = cv.lessons.find((x) => x.slug === lesson)
  if (!l) notFound()
  if (!l.gate.open) redirect(`/dashboard/programs/${slug}`)
  const p = await loadProgress(m.id, cv.course.id)
  const idx = cv.lessons.findIndex((x) => x.id === l.id)
  const next = cv.lessons.slice(idx + 1).find((x) => x.gate.open) ?? null
  const mod = cv.modules.find((x) => x.id === l.moduleId)!

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
        <Link href={`/dashboard/programs/${slug}` as '/'} className="inline-flex items-center gap-1.5 text-[14px] font-semibold no-underline" style={{ color: muted }}><ArrowLeft size={15} />{cv.course.title}</Link>
        <div className="flex items-center gap-3">
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E8EFFB]"><span className="block h-full rounded-full bg-[#1A5FD4]" style={{ width: `${cv.percent}%` }} /></span>
          <span className="text-[12px] tabular-nums" style={{ color: muted }}>{cv.done} von {cv.total}</span>
        </div>
        <nav className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
          {cv.modules.map((mm) => (
            <div key={mm.id}>
              <span className="mb-1.5 block px-2 text-[11px] font-bold uppercase tracking-[.12em]" style={{ color: mm.bonus ? '#B07C0A' : muted }}>{mm.bonus ? 'Bonus' : `Modul ${mm.pos}`} · {mm.title}</span>
              {mm.lessons.map((x) => {
                const on = x.id === l.id
                const cls = `flex items-start gap-2.5 rounded-xl px-2.5 py-2 text-[14px] leading-snug ${on ? 'bg-[#EBF1FF] font-semibold text-[#124293]' : x.gate.open ? 'text-[#3A3836] hover:bg-[#F5F4F2]' : 'text-[#9A9794]'}`
                const icon = x.done ? <Check size={15} className="mt-0.5 flex-none text-[#16955C]" /> : !x.gate.open ? <Lock size={13} className="mt-1 flex-none" /> : <span className="mt-[7px] h-1.5 w-1.5 flex-none rounded-full bg-current opacity-60" />
                return x.gate.open
                  ? <Link key={x.id} href={`/dashboard/programs/${slug}/${x.slug}` as '/'} className={`${cls} no-underline`}>{icon}<span>{x.index} · {x.title}</span></Link>
                  : <div key={x.id} className={cls} title={x.gate.reason ?? ''}>{icon}<span>{x.index} · {x.title}<span className="block text-[12px] font-normal">{x.gate.short}</span></span></div>
              })}
            </div>
          ))}
        </nav>
      </aside>

      <LessonBody
        lesson={{ id: l.id, kind: l.kind, title: l.title, summary: l.summary, body: l.body, videoUrl: l.videoUrl, slides: l.slides, inputs: l.inputs, done: l.done }}
        eyebrow={`${mod.bonus ? 'Bonus' : `Modul ${mod.pos}`} · Lektion ${l.index} · ${KIND_LABEL[l.kind]}`}
        answers={p.answers[l.id] ?? {}}
        submissions={p.submissions[l.id] ?? []}
        next={next ? { title: next.title, href: `/dashboard/programs/${slug}/${next.slug}` } : null}
        courseHref={`/dashboard/programs/${slug}`}
        readOnly={v.preview}
      />
    </div>
  )
}
