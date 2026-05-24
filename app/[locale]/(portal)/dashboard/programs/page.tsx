import Link from 'next/link'
import { GraduationCap, ArrowRight, Sparkles } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function MyProgramsPage() {
  // TODO Wave 8: lade aus enrollments die aktiven Programme
  const enrolled: { slug: string; title: string; status: string; tier: string }[] = []

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Meine Programme</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">Programme</h1>
        <p className="mt-1 text-sm text-gray-500">
          SalesMade Academy · Liquid Leadership · Founding-30 — alles, wo Du dabei bist.
        </p>
      </div>

      {enrolled.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
            <GraduationCap size={20} className="text-blue-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Noch in keinem Programm</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            Schau Dir SalesMade Academy oder Liquid Leadership an — oder buche ein 45-Min-Sparring, wenn Du noch unsicher bist.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href={'/salesmade' as '/'} className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:opacity-90">
              <Sparkles size={14} /> SalesMade Academy
            </Link>
            <Link href={'/aljona' as '/'} className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:opacity-90">
              <Sparkles size={14} /> Liquid Leadership
            </Link>
          </div>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {enrolled.map((p) => (
            <li key={p.slug} className="rounded-2xl border border-gray-200 bg-white p-5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-purple-600">{p.tier}</span>
              <h3 className="mt-1 text-base font-bold">{p.title}</h3>
              <p className="mt-1 text-xs text-gray-500 capitalize">{p.status}</p>
              <Link href={`/${p.slug}` as '/'} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
                Programm öffnen <ArrowRight size={12} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
