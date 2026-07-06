import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { PERSONS, TEAM } from '@/lib/schedule/config'
import { listHostProfiles, listEventTypes } from '@/lib/schedule/types-store'
import { Users, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const metadata: Metadata = { title: 'Termin buchen — Eilers+Friends' }

function initials(name: string) { return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() }

export default async function ScheduleIndex() {
  const t = await getTranslations('schedule')
  const [profiles, allTypes] = await Promise.all([listHostProfiles().catch(() => []), listEventTypes().catch(() => [])])
  const liveOwners = new Set(allTypes.filter(t => t.visibility === 'live').map(t => t.ownerSlug))
  const avatarOf = (slug: string) => profiles.find(p => p.personSlug === slug)?.avatarUrl || ''
  const cards = [
    ...PERSONS.map(p => ({ slug: p.slug, name: p.name, sub: p.role || '', team: false, avatar: avatarOf(p.slug) })),
    { slug: TEAM.slug, name: TEAM.name, sub: t('teamSub'), team: true, avatar: '' },
  ].filter(c => liveOwners.has(c.slug))
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
                {c.avatar ? (
                  <img src={c.avatar} alt={c.name} className="h-14 w-14 rounded-full object-cover" />
                ) : c.team ? (
                  <span className="flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: '#EBF1FF' }}><Users size={24} style={{ color: '#1A5FD4' }} /></span>
                ) : (
                  <span className="flex h-14 w-14 items-center justify-center rounded-full text-base font-bold text-white" style={{ backgroundColor: '#1A5FD4' }}>{initials(c.name)}</span>
                )}
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
