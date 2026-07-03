import { notFound } from 'next/navigation'
import { Link } from '@/lib/i18n/navigation'
import { entityFor, membersFor } from '@/lib/schedule/config'
import { getEventType, getHostProfile } from '@/lib/schedule/types-store'
import { BookingWidget } from '@/components/schedule/BookingWidget'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default async function ScheduleBooking({ params }: { params: Promise<{ person: string; type: string }> }) {
  const { person, type } = await params
  const ent = entityFor(person)
  const et = await getEventType(person, type)
  if (!ent || !et || et.visibility === 'offline') notFound()

  const members = membersFor(person)
  const hosts = await Promise.all(members.map(async m => {
    const hp = await getHostProfile(m.slug)
    return { name: m.name, role: m.role || '', avatarUrl: hp?.avatarUrl || '', intro: hp?.intro || '' }
  }))

  return (
    <div style={{ backgroundColor: '#FAFAF8' }}>
      <section className="px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <Link href={`/schedule/${person}` as '/'} className="text-xs font-semibold text-gray-400 hover:text-gray-700">← Zurück</Link>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>{et.name} mit {ent.name}</h1>
          <p className="mt-2 text-base text-gray-600">{et.durationMin} Minuten{et.description ? ` · ${et.description}` : ''}</p>
          <div className="mt-8">
            <BookingWidget
              person={person} type={type} personName={ent.name} durationMin={et.durationMin}
              infoText={et.infoText} questions={et.questions} hosts={hosts}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
