import Link from 'next/link'
import { BookOpen, ArrowRight, Sparkles } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function MyFrameworksPage() {
  // TODO Wave 8: lade aus user_framework_state die abonnierten Frameworks
  const subscribed: { slug: string; title: string; progress: number; updatedAt: string }[] = []

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Mein Lernpfad</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">Meine Frameworks</h1>
        <p className="mt-1 text-sm text-gray-500">
          Die Frameworks, die Du gestartet hast — mit Fortschritt und nächstem Schritt.
        </p>
      </div>

      {subscribed.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
            <BookOpen size={20} className="text-blue-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Noch kein Framework gestartet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            Stöbere durch unsere Bauplä​ne, Tools und Inspirationen — jedes mit PDF, Video und AI-Wizard.
          </p>
          <Link
            href={'/frameworks' as '/'}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:opacity-90"
          >
            <Sparkles size={14} /> Frameworks entdecken <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {subscribed.map((fw) => (
            <li key={fw.slug} className="rounded-2xl border border-gray-200 bg-white p-5">
              <h3 className="text-base font-bold">{fw.title}</h3>
              <p className="mt-1 text-xs text-gray-500">Fortschritt: {fw.progress}%</p>
              <Link href={`/frameworks/${fw.slug}` as '/'} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
                Weitermachen <ArrowRight size={12} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
