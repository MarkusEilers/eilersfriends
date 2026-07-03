import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { PERSONS, TEAM } from '@/lib/schedule/config'
import { User, Users, ArrowRight } from 'lucide-react'

export const metadata: Metadata = { title: 'Termin buchen — Eilers+Friends' }

export default async function ScheduleIndex() {
  const t = await getTranslations('schedule')
  const cards = [...PERSONS.map(p => ({ slug: p.slug, name: p.name, sub: p.role || '', team: false })),
    { slug: TEAM.slug, name: TEAM.name, sub: t('teamSub'), team: true }]
  return (
    <div style={{ backgroundColor: '#FAFAF8' }}>
      <section className="px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#1A5FD4' }}>{t('bookACall')}</p>
          <h1 className="mt-3 text-4xl font-bold sm:text-5xl" style={{ color: '#0D0D0B' }}>{t('whoToTalk')}</h1>
          <p className="mt-4 max-w-xl text-base text-gray-600">{t('whoLead')}</p>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {cards.map(c => (
              <Link key={c.slug} href={`/schedule/${c.slug}` as '/'} className="group rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:shadow-md">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: '#EBF1FF' }}>
                  {c.team ? <Users size={22} style={{ color: '#1A5FD4' }} /> : <User size={22} style={{ color: '#1A5FD4' }} />}
                </span>
                <h2 className="mt-4 text-lg font-bold" style={{ color: '#0D0D0B' }}>{c.name}</h2>
                <p className="mt-1 text-sm text-gray-500">{c.sub}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: '#1A5FD4' }}>{t('continue')} <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
