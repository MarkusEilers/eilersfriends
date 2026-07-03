import { notFound } from 'next/navigation'
import { Link } from '@/lib/i18n/navigation'
import { auth } from '@/lib/auth'
import { entityFor, membersFor } from '@/lib/schedule/config'
import { getEventType, getHostProfile } from '@/lib/schedule/types-store'
import { BookingWidget } from '@/components/schedule/BookingWidget'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default async function ScheduleBooking({ params, searchParams }: { params: Promise<{ person: string; type: string }>; searchParams: Promise<{ preview?: string }> }) {
  const { person, type } = await params
  const sp = await searchParams
  const isPreview = sp?.preview != null

  const ent = entityFor(person)
  const et = await getEventType(person, type)
  if (!ent || !et) notFound()

  // Offline-Typen nur in der Admin-Vorschau sichtbar
  if (et.visibility === 'offline') {
    const session = isPreview ? await auth() : null
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'coach')) notFound()
  }

  const members = membersFor(person)
  const hosts = await Promise.all(members.map(async m => {
    const hp = await getHostProfile(m.slug)
    return { name: m.name, role: m.role || '', avatarUrl: hp?.avatarUrl || '', intro: hp?.intro || '' }
  }))

  return (
    <div style={{ backgroundColor: '#FAFAF8' }}>
      <section className="px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          {isPreview && (
            <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800">
              Vorschau · Sichtbarkeit: {et.visibility === 'live' ? 'Live (öffentlich)' : et.visibility === 'internal' ? 'Intern (nur per Link)' : 'Offline (nicht buchbar)'}
            </div>
          )}
          <Link href={`/schedule/${person}` as '/'} className="text-xs font-semibold text-gray-400 hover:text-gray-700">← Zurück</Link>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>{et.name} mit {ent.name}</h1>
          <p className="mt-2 text-base text-gray-600">{et.durationMin} Minuten{et.description ? ` · ${et.description}` : ''}</p>
          <div className="mt-8">
            <BookingWidget person={person} type={type} personName={ent.name} durationMin={et.durationMin} infoText={et.infoText} questions={et.questions} hosts={hosts} />
          </div>
        </div>
      </section>
    </div>
  )
}
