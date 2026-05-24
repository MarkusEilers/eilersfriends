import Link from 'next/link'
import { BookOpen, ArrowRight, Sparkles, ShieldCheck, Eye } from 'lucide-react'
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

interface LpRow extends Record<string, unknown> {
  slug: string
  title: string
  meta_description: string | null
  accent_color: string | null
}

function rowsOf<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[]
  if (r && typeof r === 'object' && 'rows' in r) {
    const x = (r as { rows: unknown }).rows
    if (Array.isArray(x)) return x as T[]
  }
  return []
}

export default async function MyFrameworksPage() {
  const session = await auth()
  const role = session?.user?.role
  const isAdmin = role === 'admin' || role === 'coach'

  await ensureWizardTables()

  let subscribed: UFSRow[] = []
  if (session?.user?.id) {
    const r = await db.execute(sql`
      SELECT framework_slug, progress, status, updated_at
      FROM user_framework_state
      WHERE user_id = ${session.user.id}
      ORDER BY updated_at DESC
    `)
    subscribed = rowsOf<UFSRow>(r)
  }

  // All published framework-landing-pages (b2b-angebote etc.)
  const allRes = await db.execute(sql`
    SELECT slug, title, meta_description, accent_color
    FROM landing_pages
    WHERE status = 'published'
    ORDER BY updated_at DESC
  `)
  const allFrameworks = rowsOf<LpRow>(allRes)
  const subscribedSlugs = new Set(subscribed.map((s) => s.framework_slug))
  const notYetSubscribed = allFrameworks.filter((f) => !subscribedSlugs.has(f.slug))

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Mein Lernpfad</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">Meine Frameworks</h1>
        <p className="mt-1 text-sm text-gray-500">
          Die Frameworks, die Du gestartet hast — mit Fortschritt und naechstem Schritt.
        </p>
      </div>

      {isAdmin && (
        <div className="mb-6 rounded-2xl border border-purple-200 bg-purple-50 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck size={18} className="mt-0.5 text-purple-700 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-purple-800">Admin-View</p>
              <p className="mt-1 text-sm text-purple-900">
                Du siehst diese Seite als Admin — Du kannst jedes Framework anschauen, den Wizard testen
                und die App benutzen, auch ohne eigenes Subscription. Subscribed Frameworks unten zeigen
                Deinen persoenlichen Fortschritt.
              </p>
            </div>
          </div>
        </div>
      )}

      {subscribed.length > 0 ? (
        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Deine subscribten Frameworks</h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {subscribed.map((fw) => (
              <li key={fw.framework_slug} className="rounded-2xl border border-gray-200 bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-blue-700">SalesMade</p>
                <h3 className="mt-1 text-base font-bold text-gray-900">
                  {allFrameworks.find((f) => f.slug === fw.framework_slug)?.title ?? fw.framework_slug}
                </h3>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-blue-600" style={{ width: `${fw.progress}%` }} />
                </div>
                <p className="mt-2 text-xs text-gray-500">{fw.progress}% · {fw.status}</p>
                <Link href={`/dashboard/frameworks/${fw.framework_slug}` as '/'} className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
                  Weitermachen <ArrowRight size={12} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="mb-10 rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
            <BookOpen size={20} className="text-blue-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Noch kein Framework gestartet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            Stoebere durch unsere Bauplaene, Tools und Inspirationen — jedes mit PDF, Video und AI-Wizard.
          </p>
          <Link href={'/frameworks' as '/'} className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:opacity-90">
            <Sparkles size={14} /> Frameworks entdecken <ArrowRight size={14} />
          </Link>
        </section>
      )}

      {isAdmin && notYetSubscribed.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Verfuegbare Frameworks (Admin-Preview)</h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {notYetSubscribed.map((fw) => (
              <li key={fw.slug} className="rounded-2xl border border-purple-200 bg-purple-50/30 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-purple-700">Admin-Preview</p>
                <h3 className="mt-1 text-base font-bold text-gray-900">{fw.title}</h3>
                {fw.meta_description && <p className="mt-1 text-xs text-gray-600 line-clamp-2">{fw.meta_description}</p>}
                <Link href={`/dashboard/frameworks/${fw.slug}` as '/'} className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-purple-700">
                  <Eye size={12} /> Anschauen und testen <ArrowRight size={12} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
