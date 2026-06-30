import { notFound } from 'next/navigation'
import { Link } from '@/lib/i18n/navigation'
import { entityFor, typeBySlug } from '@/lib/schedule/config'
import { BookingWidget } from '@/components/schedule/BookingWidget'

export const dynamic = 'force-dynamic'

export default async function ScheduleBooking({ params }: { params: Promise<{ person: string; type: string }> }) {
  const { person, type } = await params
  const ent = entityFor(person); const t = typeBySlug(type)
  if (!ent || !t) notFound()
  return (
    <main style={{ backgroundColor: '#FAFAF8' }}>
      <section className="px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <Link href={`/schedule/${person}` as '/'} className="text-xs font-semibold text-gray-400 hover:text-gray-700">← Zurück</Link>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>{t.name} mit {ent.name}</h1>
          <p className="mt-2 text-base text-gray-600">{t.durationMin} Minuten · {t.description}</p>
          <div className="mt-8">
            <BookingWidget person={person} type={type} personName={ent.name} durationMin={t.durationMin} />
          </div>
        </div>
      </section>
    </main>
  )
}
