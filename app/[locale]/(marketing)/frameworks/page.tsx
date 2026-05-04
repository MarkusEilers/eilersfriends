import type { Metadata } from 'next'
import Link from 'next/link'
import { db } from '@/lib/db'
import { landingPages } from '@/lib/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import { ArrowRight, BookOpen } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Frameworks — Eilers+Friends',
  description:
    'Praxiserprobte Frameworks für B2B-Vertrieb, Leadership und Wachstum. Kostenlos als PDF.',
}

export default async function FrameworksIndex() {
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
  } catch (_) {}

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>

      {/* Hero */}
      <section className="px-6 py-20" style={{ backgroundColor: '#EBF1FF' }}>
        <div className="mx-auto max-w-3xl text-center">
          <span
            className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4"
            style={{ backgroundColor: 'white', color: '#1A5FD4', border: '1px solid #BBCFF5' }}
          >
            Bibliothek
          </span>
          <h1 className="text-4xl font-bold sm:text-5xl mb-4" style={{ color: '#0D0D0B' }}>
            Frameworks
          </h1>
          <p className="text-lg text-gray-600">
            Praxiserprobte Bauplaene für B2B-Vertrieb, Leadership und Wachstum.
            Jeder kostenlos als PDF — direkt anwendbar.
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          {frameworks.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-16 text-center">
              <BookOpen size={32} className="mx-auto mb-4 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">Bald verfügbar.</p>
              <p className="mt-1 text-xs text-gray-400">
                Die ersten Frameworks gehen demnächst live.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {frameworks.map((f) => {
                const accent = f.accentColor ?? '#1A5FD4'
                return (
                  <Link
                    key={f.id}
                    href={`/frameworks/${f.slug}`}
                    className="group rounded-2xl border border-gray-100 bg-white p-6 transition-shadow hover:shadow-md"
                  >
                    <div
                      className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${accent}15` }}
                    >
                      <BookOpen size={18} style={{ color: accent }} />
                    </div>
                    <h2 className="text-lg font-bold leading-tight" style={{ color: '#0D0D0B' }}>
                      {f.title}
                    </h2>
                    {f.metaDescription && (
                      <p className="mt-2 text-sm leading-relaxed text-gray-600 line-clamp-3">
                        {f.metaDescription}
                      </p>
                    )}
                    <div
                      className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
                      style={{ color: accent }}
                    >
                      Zum Framework <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

    </main>
  )
}
