import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Link } from '@/lib/i18n/navigation'
import { ArrowLeft, Clock, Calendar, ArrowUpRight } from 'lucide-react'
import { getPost, listPosts, relatedPosts, type Post } from '@/lib/blog/posts'
import { authorOf } from '@/lib/blog/authors'
import { BlogCta } from '@/components/blog/BlogCta'
import { Comments } from '@/components/blog/Comments'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug, true)
  if (!post) return { title: 'Beitrag nicht gefunden' }
  const a = authorOf(post.author_slug)
  return {
    title: post.title,
    description: post.excerpt ?? post.subtitle ?? undefined,
    authors: [{ name: a.name }],
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      type: 'article',
      images: post.hero_image ?? post.og_image ? [post.hero_image ?? post.og_image!] : undefined,
    },
  }
}

const dt = (s: string | null) =>
  s ? new Date(s).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

export default async function PostPage({
  params, searchParams,
}: { params: Promise<{ slug: string }>; searchParams: Promise<{ preview?: string }> }) {
  const [{ slug }, sp] = await Promise.all([params, searchParams])
  const post = await getPost(slug, sp.preview === '1')
  if (!post) notFound()

  const a = authorOf(post.author_slug)
  const related = await relatedPosts(post, 3)
  const hero = post.hero_image ?? post.og_image

  return (
    <article className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>
      {/* Kopf. Der Titel steht auf dem dunklen Grund des Autors, damit man schon
          an der Farbe sieht, wer hier spricht — noch bevor man den Namen liest. */}
      <header className="relative overflow-hidden px-6 pb-16 pt-16 sm:pb-20 sm:pt-20" style={{ background: a.deep }}>
        <div className="relative mx-auto max-w-3xl">
          <Link
            href={`/blog/${a.slug}` as '/'}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/55 transition-colors hover:text-white"
          >
            <ArrowLeft size={13} /> Alle Beiträge von {a.name.split(' ')[0]}
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em]">
            {(post.tags ?? []).slice(0, 3).map((t) => (
              <span key={t} className="rounded-full px-2.5 py-1" style={{ background: 'rgba(255,255,255,0.12)', color: a.onDeep }}>
                {t}
              </span>
            ))}
          </div>

          <h1
            className="mt-5 text-4xl font-bold leading-[1.1] text-white sm:text-5xl"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            {post.title}
          </h1>
          {post.subtitle && (
            <p className="mt-5 text-lg leading-relaxed text-white/70">{post.subtitle}</p>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-4 text-xs text-white/55">
            <span className="inline-flex items-center gap-2">
              <span className="relative h-8 w-8 overflow-hidden rounded-full ring-2 ring-white/20">
                <Image src={a.avatar} alt={a.name} fill sizes="32px" className="object-cover" />
              </span>
              <span className="font-semibold text-white/85">{a.name}</span>
            </span>
            {post.published_at && (
              <span className="inline-flex items-center gap-1.5"><Calendar size={12} /> {dt(post.published_at)}</span>
            )}
            {post.reading_minutes ? (
              <span className="inline-flex items-center gap-1.5"><Clock size={12} /> {post.reading_minutes} Min Lesezeit</span>
            ) : null}
            {post.status !== 'published' && (
              <span className="rounded-full bg-amber-400/20 px-2 py-0.5 font-bold text-amber-200">Entwurf</span>
            )}
          </div>
        </div>
      </header>

      {hero && (
        <div className="mx-auto -mt-8 max-w-4xl px-6">
          <div className="relative h-64 overflow-hidden rounded-2xl shadow-xl sm:h-96">
            <Image src={hero} alt="" fill sizes="(max-width: 896px) 100vw, 896px" className="object-cover" priority />
          </div>
        </div>
      )}

      {/* Fliesstext. Schmale Spalte, grosse Zeilenhoehe, Serifen — ein Text, den
          man liest, und keiner, den man ueberfliegt. */}
      <div className="mx-auto max-w-[680px] px-6 py-14">
        <Prose content={post.content} accent={a.accent} />

        {/* Kurzbio direkt unter dem Text: wer das gelesen hat, will jetzt wissen,
            von wem es kam. */}
        <aside className="mt-14 rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-start gap-4">
            <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full">
              <Image src={a.avatar} alt={a.name} fill sizes="64px" className="object-cover" />
            </span>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: a.accent }}>
                {a.tagline}
              </div>
              <div className="mt-0.5 text-lg font-bold text-gray-900">{a.name}</div>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{a.bio}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={a.page as '/'}
                  className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-colors"
                  style={{ color: a.accent, borderColor: `${a.accent}44` }}
                >
                  Mehr über {a.name.split(' ')[0]} <ArrowUpRight size={12} />
                </Link>
                <Link
                  href={a.booking as '/'}
                  className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-white"
                  style={{ background: a.accent }}
                >
                  <Calendar size={12} /> Termin
                </Link>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pb-4">
          <h2 className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Dazu passt</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {related.map((r) => <RelatedCard key={r.slug} post={r} />)}
          </div>
        </section>
      )}

      {post.status === 'published' && (
        <Comments postId={post.id} author={a} open={(post as { comments_open?: boolean }).comments_open !== false} />
      )}

      <div className="pb-20">
        <BlogCta author={a} />
      </div>
    </article>
  )
}

function RelatedCard({ post }: { post: Post }) {
  const a = authorOf(post.author_slug)
  return (
    <Link
      href={`/blog/${post.slug}` as '/'}
      className="group rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: a.accent }}>
        {a.name.split(' ')[0]} · {dt(post.published_at)}
      </div>
      <h3 className="mt-2 text-base font-bold leading-snug text-gray-900" style={{ fontFamily: "'DM Serif Display', serif" }}>
        {post.title}
      </h3>
      {post.excerpt && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-500">{post.excerpt}</p>}
    </Link>
  )
}

/**
 * Ein sehr kleiner Markdown-Satz: Ueberschriften, Zitate, Listen, Fettung,
 * Absaetze. Mehr braucht ein Briefing nicht, und alles Weitere waere eine
 * Bibliothek, die wir pflegen muessten, ohne sie zu benutzen.
 */
function Prose({ content, accent }: { content: string | null; accent: string }) {
  if (!content?.trim()) {
    return <p className="text-gray-400">Für diesen Beitrag liegt noch kein Text vor.</p>
  }
  const blocks = content.split(/\n{2,}/)
  return (
    <div className="space-y-6">
      {blocks.map((raw, i) => {
        const b = raw.trim()
        if (b.startsWith('## ')) {
          return (
            <h2 key={i} className="pt-4 text-2xl font-bold text-gray-900" style={{ fontFamily: "'DM Serif Display', serif" }}>
              {b.slice(3)}
            </h2>
          )
        }
        if (b.startsWith('### ')) {
          return <h3 key={i} className="pt-2 text-lg font-bold text-gray-900">{b.slice(4)}</h3>
        }
        if (b.startsWith('> ')) {
          return (
            <blockquote key={i} className="border-l-2 pl-5 text-xl italic leading-relaxed text-gray-700" style={{ borderColor: accent }}>
              {b.replace(/^> ?/gm, '')}
            </blockquote>
          )
        }
        if (/^[-*] /.test(b)) {
          return (
            <ul key={i} className="space-y-2 pl-1">
              {b.split('\n').map((li, j) => (
                <li key={j} className="flex gap-3 text-[17px] leading-relaxed text-gray-700">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: accent }} />
                  <span dangerouslySetInnerHTML={{ __html: inline(li.replace(/^[-*] /, '')) }} />
                </li>
              ))}
            </ul>
          )
        }
        return (
          <p
            key={i}
            className="text-[17px] leading-[1.75] text-gray-700"
            dangerouslySetInnerHTML={{ __html: inline(b) }}
          />
        )
      })}
    </div>
  )
}

/** Fettung und Kursiv — und vorher alles entschaerfen, was nach HTML aussieht. */
function inline(s: string) {
  return s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
}
