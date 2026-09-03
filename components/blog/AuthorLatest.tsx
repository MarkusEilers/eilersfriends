import { Link } from '@/lib/i18n/navigation'
import { ArrowUpRight, PenLine } from 'lucide-react'
import { listPosts } from '@/lib/blog/posts'
import { AUTHORS, type Author } from '@/lib/blog/authors'

const dt = (s: string | null) =>
  s ? new Date(s).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' }) : ''

/**
 * Der Blog-Block auf der Personenseite.
 *
 * Drei Karten, mehr nicht: Die Personenseite verkauft ein Programm, der Blog ist
 * dort ein Beweis, kein Kapitel. Wer mehr will, klickt weiter.
 */
export async function AuthorLatest({ slug }: { slug: Author['slug'] }) {
  const author = AUTHORS[slug]
  const posts = await listPosts({ author: slug, limit: 3 }).catch(() => [])
  if (!posts.length) return null

  return (
    <section className="px-6 py-20" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest"
              style={{ color: author.accent }}
            >
              <PenLine size={12} /> Aus dem Briefing
            </span>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B', fontFamily: "'DM Serif Display', serif" }}>
              Zuletzt geschrieben
            </h2>
          </div>
          <Link
            href={`/blog/${slug}` as '/'}
            className="inline-flex items-center gap-1.5 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors"
            style={{ color: author.accent, borderColor: `${author.accent}44` }}
          >
            Alle Beiträge <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {posts.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}` as '/'}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                {dt(p.published_at)}
                {p.reading_minutes ? <span>· {p.reading_minutes} Min</span> : null}
              </div>
              <h3 className="mt-2.5 text-lg font-bold leading-snug text-gray-900" style={{ fontFamily: "'DM Serif Display', serif" }}>
                {p.title}
              </h3>
              {p.excerpt && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-600">{p.excerpt}</p>}
              <div className="mt-auto flex items-center gap-2 pt-4">
                {(p.tags ?? []).slice(0, 2).map((t) => (
                  <span key={t} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">{t}</span>
                ))}
                <ArrowUpRight
                  size={15}
                  className="ml-auto transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  style={{ color: author.accent }}
                />
              </div>
              <span
                className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                style={{ background: author.accent }}
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
