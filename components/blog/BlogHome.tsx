import { BookOpen } from 'lucide-react'
import { BentoGrid } from './BentoGrid'
import { AuthorSwitch } from './AuthorSwitch'
import { BlogCta } from './BlogCta'
import type { Post } from '@/lib/blog/posts'
import { AUTHORS, type Author } from '@/lib/blog/authors'

/**
 * Eine Uebersicht, zwei Verwendungen: der Blog als Ganzes und die Seite eines
 * Autors. Der Unterschied ist die Farbe und der Kopftext, nicht das Layout —
 * eine zweite Vorlage waere ein zweiter Ort, an dem man dieselbe Aenderung
 * vergisst.
 */
export function BlogHome({
  posts, author, counts,
}: { posts: Post[]; author?: Author | null; counts?: Record<string, number> }) {
  const deep = author?.deep ?? '#0F1E3A'
  const onDeep = author?.onDeep ?? '#5DDBF5'
  const accent = author?.accent

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>
      <section
        className="relative overflow-hidden px-6 pb-20 pt-20 sm:pb-24 sm:pt-28"
        style={{ background: `linear-gradient(180deg, ${deep} 0%, ${shade(deep)} 100%)` }}
      >
        {/* Die Schwinge als grosser, ruhiger Bogen im Hintergrund. */}
        <svg
          className="pointer-events-none absolute -right-24 -top-16 h-[420px] w-[620px] opacity-[0.07]"
          viewBox="0 0 600 400" fill="none" aria-hidden
        >
          <path d="M20 340C120 120 300 40 580 60" stroke="#fff" strokeWidth="70" strokeLinecap="round" />
        </svg>

        <div className="relative mx-auto max-w-4xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: onDeep }}>
            {author ? `${author.tagline} · Briefing` : 'Eilers+Friends Briefing'}
          </p>
          <h1
            className="mt-4 text-4xl font-bold text-white sm:text-5xl lg:text-6xl"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            {author ? headlineFor(author) : 'Was wir diese Woche gelernt haben.'}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/75">
            {author ? author.bio : 'Zwei Handschriften, ein Absender. Markus schreibt über Angebote, Pfade und Garantien. Aljona über Führung, Selbstführung und die Kultur dahinter.'}
          </p>
          <div className="mt-9">
            <AuthorSwitch active={author?.slug ?? null} counts={counts} />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-6 py-14">
        {posts.length === 0 ? <Empty accent={accent} /> : <BentoGrid posts={posts} accentFallback={accent} />}
      </main>

      <div className="pb-20">
        <BlogCta author={author ?? AUTHORS.markus} />
      </div>
    </div>
  )
}

function headlineFor(a: Author) {
  return a.slug === 'markus'
    ? 'Was im Coaching passiert, bevor der Umsatz kommt.'
    : 'Führung ist eine Fähigkeit. Keine Position.'
}

/** Etwas dunkler fuer den Verlauf — ohne eine zweite Farbe pflegen zu muessen. */
function shade(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  const f = 1.35
  const r = Math.min(255, Math.round(((n >> 16) & 255) * f))
  const g = Math.min(255, Math.round(((n >> 8) & 255) * f))
  const b = Math.min(255, Math.round((n & 255) * f))
  return `rgb(${r},${g},${b})`
}

function Empty({ accent }: { accent?: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-16 text-center">
      <div
        className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ backgroundColor: `${accent ?? '#1A5FD4'}14` }}
      >
        <BookOpen size={22} style={{ color: accent ?? '#1A5FD4' }} />
      </div>
      <h2 className="text-2xl font-bold text-gray-900">Hier steht bald der erste Beitrag.</h2>
      <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-gray-600">
        Bis dahin geht das Briefing per E-Mail raus — die Anmeldung steht direkt darunter.
      </p>
    </div>
  )
}
