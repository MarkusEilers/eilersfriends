import Image from 'next/image'
import { Link } from '@/lib/i18n/navigation'
import { ArrowUpRight, Clock } from 'lucide-react'
import type { Post } from '@/lib/blog/posts'
import { authorOf } from '@/lib/blog/authors'

const dt = (s: string | null) =>
  s ? new Date(s).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

/**
 * Das Bento-Raster.
 *
 * Nicht alle Kacheln sind gleich gross, und das ist der ganze Sinn: Der neueste
 * Beitrag bekommt die grosse Flaeche, die naechsten zwei die mittleren, der Rest
 * die kleinen. Ein Raster aus lauter gleichen Karten ist eine Liste mit
 * Zwischenraum — es trifft keine Aussage darueber, was gerade zaehlt.
 */
export function BentoGrid({ posts, accentFallback }: { posts: Post[]; accentFallback?: string }) {
  if (!posts.length) return null
  const [lead, ...rest] = posts
  const mid = rest.slice(0, 2)
  const small = rest.slice(2, 8)

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card post={lead} size="lead" accentFallback={accentFallback} className="lg:col-span-2 lg:row-span-2" />
      {mid.map((p) => <Card key={p.slug} post={p} size="mid" accentFallback={accentFallback} />)}
      {small.map((p) => <Card key={p.slug} post={p} size="small" accentFallback={accentFallback} />)}
    </div>
  )
}

function Card({
  post, size, className, accentFallback,
}: { post: Post; size: 'lead' | 'mid' | 'small'; className?: string; accentFallback?: string }) {
  const a = authorOf(post.author_slug)
  const accent = accentFallback ?? a.accent
  const img = post.hero_image ?? post.og_image
  const lead = size === 'lead'

  return (
    <Link
      href={`/blog/${post.slug}` as '/'}
      className={`group relative flex flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white transition-all hover:-translate-y-0.5 hover:border-transparent hover:shadow-xl ${className ?? ''}`}
    >
      {img && (
        <div className={`relative w-full overflow-hidden ${lead ? 'h-64 sm:h-80' : 'h-36'}`}>
          <Image
            src={img} alt="" fill sizes={lead ? '(max-width: 1024px) 100vw, 66vw' : '33vw'}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
        </div>
      )}

      <div className={`flex flex-1 flex-col ${lead ? 'p-7 sm:p-8' : 'p-5'}`}>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em]">
          <span className="rounded-full px-2 py-0.5" style={{ background: a.tint, color: accent }}>
            {a.name.split(' ')[0]}
          </span>
          <span className="text-gray-400">{dt(post.published_at)}</span>
          {post.reading_minutes ? (
            <span className="ml-auto inline-flex items-center gap-1 text-gray-400">
              <Clock size={10} /> {post.reading_minutes} Min
            </span>
          ) : null}
        </div>

        <h3
          className={`mt-3 font-bold leading-snug text-gray-900 ${lead ? 'text-2xl sm:text-3xl' : size === 'mid' ? 'text-lg' : 'text-base'}`}
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          {post.title}
        </h3>

        {post.subtitle && lead && (
          <p className="mt-2 text-[15px] leading-relaxed text-gray-500">{post.subtitle}</p>
        )}
        {post.excerpt && size !== 'small' && (
          <p className={`mt-3 leading-relaxed text-gray-600 ${lead ? 'text-base' : 'text-sm line-clamp-3'}`}>
            {post.excerpt}
          </p>
        )}

        <div className="mt-auto flex items-center gap-2 pt-4">
          {(post.tags ?? []).slice(0, lead ? 3 : 2).map((t) => (
            <span key={t} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
              {t}
            </span>
          ))}
          <ArrowUpRight
            size={16}
            className="ml-auto shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            style={{ color: accent }}
          />
        </div>
      </div>

      <span
        className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
        style={{ background: accent }}
      />
    </Link>
  )
}
