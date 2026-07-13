import { notFound } from 'next/navigation'
import { getTranslations, getLocale } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { auth } from '@/lib/auth'
import { entityFor, membersFor } from '@/lib/schedule/config'
import { getEventType, getHostProfile, localizedType } from '@/lib/schedule/types-store'
import { BookingWidget } from '@/components/schedule/BookingWidget'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default async function ScheduleBooking({ params, searchParams }: { params: Promise<{ person: string; type: string }>; searchParams: Promise<{ preview?: string; name?: string; offer?: string }> }) {
  const { person, type } = await params
  const sp = await searchParams
  const isPreview = sp?.preview != null
  const prefillName = sp?.name?.trim() || undefined
  const prefillNote = sp?.offer?.trim() ? `Angebot: ${sp.offer.trim()}` : undefined

  const ent = entityFor(person)
  const et = await getEventType(person, type)
  if (!ent || !et) notFound()
  if (et.visibility === 'offline') {
    const session = isPreview ? await auth() : null
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'coach')) notFound()
  }

  const t = await getTranslations('schedule')
  const locale = await getLocale()
  const loc = localizedType(et, locale)
  const members = membersFor(person)
  const hosts = await Promise.all(members.map(async m => {
    const hp = await getHostProfile(m.slug)
    return { name: m.name, role: m.role || '', avatarUrl: hp?.avatarUrl || '', intro: hp?.intro || '' }
  }))
  const visLabel = et.visibility === 'live' ? t('visLive') : et.visibility === 'internal' ? t('visInternal') : t('visOffline')

  return (
    <div style={{ backgroundColor: '#FAFAF8' }}>
      <section className="px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          {isPreview && (
            <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800">
              {t('previewVisibility')} {visLabel}
            </div>
          )}
          <Link href={`/schedule/${person}` as '/'} className="text-xs font-semibold text-gray-400 hover:text-gray-700">← {t('back')}</Link>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>{loc.name} {t('with')} {ent.name}</h1>
          <p className="mt-2 text-base text-gray-600">{et.durationMin} {t('minutes')}{loc.description ? ` · ${loc.description}` : ''}</p>
          <div className="mt-8">
            <BookingWidget person={person} type={type} personName={ent.name} durationMin={et.durationMin} infoText={et.infoText} questions={et.questions} hosts={hosts} prefillName={prefillName} prefillNote={prefillNote} />
          </div>
        </div>
      </section>
    </div>
  )
}
