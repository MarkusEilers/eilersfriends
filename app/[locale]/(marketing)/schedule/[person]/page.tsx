import { notFound } from 'next/navigation'
import { Link } from '@/lib/i18n/navigation'
import { entityFor } from '@/lib/schedule/config'
import { listBookableTypes } from '@/lib/schedule/types-store'
import { Clock, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default async function ScheduleTypes({ params }: { params: Promise<{ person: string }> }) {
  const { person } = await params
  const ent = entityFor(person)
  if (!ent) notFound()
  const types = await listBookableTypes(person)
  return (
    <div style={{ backgroundColor: '#FAFAF8' }}>
      <section className="px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <Link href="/schedule" className="text-xs font-semibold text-gray-400 hover:text-gray-700">← Alle</Link>
          <h1 className="mt-3 text-4xl font-bold sm:text-5xl" style={{ color: '#0D0D0B' }}>{ent.name}</h1>
          <p className="mt-2 text-base text-gray-600">Welcher Termin passt?</p>
          {types.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">Aktuell sind keine Termine buchbar. Schreib uns: <a href="mailto:team@eilersfriends.com" className="font-semibold underline" style={{ color: '#1A5FD4' }}>team@eilersfriends.com</a>.</div>
          ) : (
            <div className="mt-9 grid gap-5 sm:grid-cols-2">
              {types.map(t => (
                <Link key={t.id} href={`/schedule/${person}/${t.slug}` as '/'} className="group rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold" style={{ color: '#0D0D0B' }}>{t.name}</h2>
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700"><Clock size={11} /> {t.durationMin} Min</span>
                  </div>
                  {t.description && <p className="mt-2 text-sm text-gray-500">{t.description}</p>}
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: '#1A5FD4' }}>Slots ansehen <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" /></span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
