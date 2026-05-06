import { db } from '@/lib/db'
import { landingPages } from '@/lib/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import Link from 'next/link'
import { ArrowRight, BookOpen } from 'lucide-react'

/**
 * Dynamic Frameworks-Hub on the homepage.
 * Pulls all published frameworks from the DB and renders them as cards.
 * Color rule: blue for revenue topics (#1A5FD4), red for leadership (#D4192B),
 * derived from the LP's accentColor.
 */
export async function HVCOSection() {
  let frameworks: (typeof landingPages.$inferSelect)[] = []
  try {
    frameworks = await db
      .select()
      .from(landingPages)
      .where(
        and(
          eq(landingPages.templateKey, 'framework-leadmagnet'),
          eq(landingPages.status, 'published'),
        ),
      )
      .orderBy(desc(landingPages.updatedAt))
      .limit(6)
  } catch (_) {}

  // Don't render section at all if there are no frameworks yet
  if (frameworks.length === 0) {
    return null
  }

  return (
    <section className="bg-white px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <span
            className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4"
            style={{ backgroundColor: '#EBF1FF', color: '#1A5FD4' }}
          >
            Kostenfreie Ressourcen
          </span>
          <h2 className="text-4xl font-bold sm:text-5xl" style={{ color: '#0D0D0B' }}>
            Frameworks zum Sofort-Anwenden
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-gray-600">
            Praxiserprobte Bauplaene gegen Email — direkt anwendbar in der nächsten
            Woche, in deinem Tagesgeschäft.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {frameworks.map((f) => {
            const accent = f.accentColor ?? '#1A5FD4'
            const accentBg = accent === '#D4192B' ? '#FFEBEC' : '#EBF1FF'
            return (
              <Link
                key={f.id}
                href={`/frameworks/${f.slug}`}
                className="group rounded-2xl border border-gray-100 bg-white p-6 transition-shadow hover:shadow-md flex flex-col"
              >
                <div
                  className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: accentBg }}
                >
                  <BookOpen size={18} style={{ color: accent }} />
                </div>
                <h3 className="text-lg font-bold leading-tight" style={{ color: '#0D0D0B' }}>
                  {f.title}
                </h3>
                {f.metaDescription && (
                  <p className="mt-2 text-sm leading-relaxed text-gray-600 line-clamp-3 flex-1">
                    {f.metaDescription}
                  </p>
                )}
                <div
                  className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
                  style={{ color: accent }}
                >
                  Zum Framework
                  <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            )
          })}
        </div>

        {frameworks.length >= 6 && (
          <div className="mt-10 text-center">
            <Link
              href="/frameworks"
              className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-gray-50"
              style={{ color: '#1A5FD4', borderColor: '#BBCFF5' }}
            >
              Alle Frameworks ansehen <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
