import Link from 'next/link'
import { BookOpen, ArrowRight, Sparkles } from 'lucide-react'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { ensureWizardTables } from '@/lib/db/self-heal'

export const dynamic = 'force-dynamic'

interface UFSRow extends Record<string, unknown> {
  framework_slug: string
  progress: number
  status: string
  updated_at: Date
}

const SLUG_TO_TITLE: Record<string, string> = {
  'b2b-angebote': 'Der Bauplan für unwiderstehliche B2B-Angebote',
}

export default async function MyFrameworksPage() {
  const session = await auth()
  await ensureWizardTables()

  let subscribed: UFSRow[] = []
  if (session?.user?.id) {
    subscribed = (await db.execute(sql`
      SELECT framework_slug, progress, status, updated_at
      FROM user_framework_state
      WHERE user_id = ${session.user.id}
      ORDER BY updated_at DESC
    `)) as unknown as UFSRow[]
  }

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
            Stöbere durch unsere Baupläne, Tools und Inspirationen — jedes mit PDF, Video und AI-Wizard.
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
            <li key={fw.framework_slug} className="rounded-2xl border border-gray-200 bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-700">SalesMade</p>
              <h3 className="mt-1 text-base font-bold text-gray-900">
                {SLUG_TO_TITLE[fw.framework_slug] ?? fw.framework_slug}
              </h3>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-blue-600" style={{ width: `${fw.progress}%` }} />
              </div>
              <p className="mt-2 text-xs text-gray-500">{fw.progress}% · {fw.status}</p>
              <Link
                href={`/dashboard/frameworks/${fw.framework_slug}` as '/'}
                className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-600"
              >
                Weitermachen <ArrowRight size={12} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
