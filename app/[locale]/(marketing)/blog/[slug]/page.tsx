import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { sql } from 'drizzle-orm'
import { Link } from '@/lib/i18n/navigation'
import { ArrowRight, TrendingUp, Clock3, MoveRight } from 'lucide-react'
import { db } from '@/lib/db'
import { getPost, relatedPosts, type Post } from '@/lib/blog/posts'
import { FORMAT_LABEL, type StoryData } from '@/lib/blog/formats'
import { authorOf, type Author } from '@/lib/blog/authors'
import { Comments } from '@/components/blog/Comments'
import { ShareBar } from '@/components/blog/ShareBar'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug, true)
  if (!post) return { title: 'Beitrag nicht gefunden' }
  const a = authorOf(post.author_slug)
  return {
    title: post.title,
    description: post.excerpt ?? post.subtitle ?? undefined,
    authors: [{ name: a.name }],
    openGraph: {
      title: post.title, description: post.excerpt ?? undefined, type: 'article',
      images: post.hero_image ?? post.og_image ? [post.hero_image ?? post.og_image!] : undefined,
    },
  }
}

const INK = '#0D0D0B'
const dt = (s: string | null) =>
  s ? new Date(s).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
const slugify = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 60)
const discLabel = (a: Author) => (a.discipline === 'leadership' ? 'Transformational Leadership' : a.discipline === 'revenue' ? 'Revenue Systems' : 'Revenue & Leadership')

async function frameworkFor(slug?: string) {
  if (!slug) return null
  const rows = (await db.execute(sql`SELECT slug, title FROM landing_pages WHERE slug = ${slug} AND status = 'published' LIMIT 1`).catch(() => [])) as unknown as Array<{ slug: string; title: string }>
  return rows[0] ?? null
}

export default async function PostPage({
  params, searchParams,
}: { params: Promise<{ slug: string }>; searchParams: Promise<{ preview?: string }> }) {
  const [{ slug }, sp] = await Promise.all([params, searchParams])
  const post = await getPost(slug, sp.preview === '1')
  if (!post) notFound()

  const a = authorOf(post.author_slug)
  const st: StoryData = post.story ?? {}
  const [related, fw] = await Promise.all([relatedPosts(post, 3), frameworkFor(st.framework_slug)])
  const hero = post.hero_image ?? post.og_image
  const heads = (post.content ?? '').split(/\n{2,}/).map((b) => b.trim()).filter((b) => b.startsWith('## ')).map((b) => b.slice(3))
  const facts = [
    ['Unternehmen', st.facts?.company], ['Phase und Teamgröße', st.facts?.phase],
    ['Programm', st.facts?.program], ['Coach', st.facts?.coach],
  ].filter(([, v]) => v) as [string, string][]
  const metrics = (st.metrics ?? []).filter((m) => m.value)
  const first = a.slug === 'team' ? 'uns' : a.name.split(' ')[0]

  return (
    <article className="min-h-screen bg-white">
      {/* Kopf: Text links, Bild rechts */}
      <header className="px-6 pt-10 sm:pt-14">
        <div className={`mx-auto grid max-w-6xl items-center gap-10 ${hero ? 'lg:grid-cols-[1.1fr_1fr]' : ''}`}>
          <div className={hero ? '' : 'max-w-3xl'}>
            <p className="text-xs text-gray-600">
              <Link href={'/blog' as '/'} className="underline">Stories</Link>
              {' / '}
              <span className="font-bold" style={{ color: a.accent }}>{FORMAT_LABEL[post.format ?? 'artikel'] ?? 'Artikel'}</span>
              {' · '}{discLabel(a)}{post.published_at ? ` · ${dt(post.published_at)}` : ''}
              {post.status !== 'published' && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 font-bold text-amber-800">Entwurf</span>}
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl" style={{ color: INK }}>{post.title}</h1>
            {(post.subtitle || post.excerpt) && (
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-gray-600">{post.subtitle ?? post.excerpt}</p>
            )}
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Link href={a.booking as '/'} className="inline-flex items-center rounded-full px-5 py-3 text-sm font-bold text-white" style={{ background: INK }}>
                Strategie-Gespräch buchen
              </Link>
              <span className="inline-flex items-center gap-2 text-sm text-gray-600">
                <Avatar a={a} size={32} />
                {a.slug === 'team' ? 'Von Eilers+Friends' : `${post.format === 'kundenstory' ? 'Begleitet' : 'Geschrieben'} von ${a.name}`}
              </span>
            </div>
          </div>
          {hero && (
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#D9D7D4]">
              <Image src={hero} alt={(post as { hero_alt?: string }).hero_alt ?? ''} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" priority />
            </div>
          )}
        </div>

        {(facts.length > 0 || metrics.length > 0) && (
          <div className="mx-auto mt-10 max-w-6xl space-y-4">
            {facts.length > 0 && (
              <dl className="grid gap-4 rounded-2xl bg-[#F2F2F0] px-6 py-5 sm:grid-cols-4">
                {facts.map(([k, v]) => (
                  <div key={k}><dt className="text-xs text-gray-500">{k}</dt><dd className="mt-0.5 text-sm font-bold text-gray-900">{v}</dd></div>
                ))}
              </dl>
            )}
            {metrics.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-3">
                {metrics.map((m, i) => {
                  const Icon = [TrendingUp, Clock3, MoveRight][i] ?? MoveRight
                  return (
                    <div key={i} className="rounded-2xl px-6 py-5" style={{ background: a.tint }}>
                      <div className="flex items-start justify-between">
                        <Icon size={18} style={{ color: a.accent }} />
                        <span className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: INK }}>{m.value}</span>
                      </div>
                      <p className="mt-3 text-sm text-gray-600">{m.label}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        <div className="mx-auto mt-8 max-w-[640px]">
          <ShareBar audio={st.audio_url} minutes={post.reading_minutes} />
        </div>
      </header>

      {/* Inhalt mit Seitenleiste */}
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[180px_640px] lg:justify-center lg:gap-14">
        <aside className="hidden lg:block">
          <div className="sticky top-28 space-y-6">
            {heads.length > 0 && (
              <nav>
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-500">Inhalt</p>
                <ul className="mt-3 space-y-2.5 text-[13px] leading-snug">
                  {heads.map((h, i) => (
                    <li key={h}><a href={`#${slugify(h)}`} className={i === 0 ? 'font-semibold' : 'text-gray-600 hover:text-gray-900'} style={i === 0 ? { color: a.accent } : undefined}>{h}</a></li>
                  ))}
                </ul>
              </nav>
            )}
            {st.for_whom && (
              <div className="rounded-xl bg-[#F2F2F0] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500">Für Dich, wenn</p>
                <p className="mt-2 text-[13px] leading-snug text-gray-700">{st.for_whom}</p>
              </div>
            )}
          </div>
        </aside>

        <div className="min-w-0">
          {(st.before || st.after) && (
            <div className="mb-8 rounded-2xl bg-[#F2F2F0] p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: a.accent }}>Vorher → Nachher</p>
              <div className="mt-3 grid gap-5 sm:grid-cols-2">
                <div><p className="text-xs font-bold text-gray-700">Vorher</p><p className="mt-1 text-sm leading-relaxed text-gray-700">{st.before}</p></div>
                <div><p className="text-xs font-bold" style={{ color: a.accent }}>Nachher</p><p className="mt-1 text-sm leading-relaxed text-gray-700">{st.after}</p></div>
              </div>
            </div>
          )}

          <Prose content={post.content} accent={a.accent} />

          {fw && (
            <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-6 text-white" style={{ background: a.slug === 'aljona' ? a.accent : '#1A5FD4' }}>
              <div className="max-w-md">
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/80">Das Framework dahinter</p>
                <p className="mt-1.5 text-lg font-bold leading-snug">{fw.title.replace(' — ', ': ')}</p>
                <p className="mt-1 text-xs text-white/85">Bauplan plus trainierter AI-Agent. Kostenlos.</p>
              </div>
              <Link href={`/frameworks/${fw.slug}` as '/'} className="rounded-full bg-white px-5 py-2.5 text-sm font-bold" style={{ color: a.slug === 'aljona' ? a.accent : '#1A5FD4' }}>
                Pack’s an
              </Link>
            </div>
          )}
        </div>
      </div>

      {st.quote && (
        <figure className="mx-auto max-w-4xl px-6 pb-4">
          <blockquote className="text-2xl font-bold leading-snug tracking-tight sm:text-3xl" style={{ color: INK }}>„{st.quote}“</blockquote>
          {st.quote_by && <figcaption className="mt-3 text-sm text-gray-500">{st.quote_by}</figcaption>}
        </figure>
      )}

      {/* Autorenkarte */}
      <div className="mx-auto max-w-[640px] px-6 pt-10 lg:max-w-[640px]">
        <div className="flex flex-wrap items-center gap-6 rounded-2xl bg-[#F2F2F0] p-6">
          {a.avatar ? (
            <span className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-300">
              <Image src={a.avatar} alt={a.name} fill sizes="96px" className="object-cover" />
            </span>
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500">Aufgeschrieben von</p>
            <p className="mt-1 text-lg font-bold text-gray-900">{a.name}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{a.bio}</p>
          </div>
          <Link href={a.booking as '/'} className="shrink-0 rounded-full px-5 py-2.5 text-sm font-bold text-white" style={{ background: a.accent === '#0F1E3A' ? '#1A5FD4' : a.accent }}>
            Mit {first === 'uns' ? 'uns' : first} sprechen
          </Link>
        </div>
      </div>

      {/* Zusammen: Winning Teams */}
      <section className="mx-auto max-w-6xl px-6 pt-14">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-2xl px-8 py-9 sm:px-10" style={{ background: INK }}>
          <div className="max-w-xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#8FB4FF]">Together: Winning Teams</p>
            <p className="mt-2 text-2xl font-bold leading-snug tracking-tight text-white">Revenue Systems + Transformational Leadership = planbares Wachstum</p>
          </div>
          <Link href={'/schedule' as '/'} className="inline-flex items-center gap-2 rounded-full bg-[#1A5FD4] px-6 py-3 text-sm font-bold text-white">
            Strategie-Gespräch buchen <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pt-14">
          <h2 className="mb-5 text-xl font-bold tracking-tight text-gray-900">Mehr aus {discLabel(a)}</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {related.map((r) => <RelatedCard key={r.slug} post={r} />)}
          </div>
        </section>
      )}

      {post.status === 'published' && (
        <Comments postId={post.id} author={a} open={(post as { comments_open?: boolean }).comments_open !== false} />
      )}
      <div className="pb-20" />
    </article>
  )
}

function Avatar({ a, size }: { a: Author; size: number }) {
  return a.avatar ? (
    <span className="relative inline-block overflow-hidden rounded-full" style={{ width: size, height: size }}>
      <Image src={a.avatar} alt="" fill sizes={`${size}px`} className="object-cover" />
    </span>
  ) : <span className="inline-block rounded-full" style={{ width: size, height: size, background: a.deep }} />
}

function RelatedCard({ post }: { post: Post }) {
  const a = authorOf(post.author_slug)
  const img = post.hero_image ?? post.og_image
  return (
    <Link href={`/blog/${post.slug}` as '/'} className="group block">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl" style={{ background: img ? '#D9D7D4' : `linear-gradient(135deg, ${a.deep}, ${a.accent})` }}>
        {img ? <Image src={img} alt="" fill sizes="33vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" /> : null}
      </div>
      <h3 className="mt-3 text-[15px] font-bold leading-snug text-gray-900">{post.title}</h3>
      <p className="mt-1 text-xs text-gray-600">
        <span className="font-bold" style={{ color: a.accent }}>{FORMAT_LABEL[post.format ?? 'artikel'] ?? 'Artikel'}</span>
        {post.reading_minutes ? ` · ${post.reading_minutes} Min.` : ''}
      </p>
    </Link>
  )
}

/**
 * Ein kleiner Markdown-Satz: Ueberschriften (mit Anker fuers Inhaltsverzeichnis),
 * Bilder, Zitate, Listen, Fettung, Absaetze.
 */
function Prose({ content, accent }: { content: string | null; accent: string }) {
  if (!content?.trim()) return <p className="text-gray-400">Für diesen Beitrag liegt noch kein Text vor.</p>
  const blocks = content.split(/\n{2,}/)
  return (
    <div className="space-y-6">
      {blocks.map((raw, i) => {
        const b = raw.trim()
        if (b.startsWith('## ')) return <h2 key={i} id={slugify(b.slice(3))} className="scroll-mt-28 pt-4 text-2xl font-bold tracking-tight text-gray-900">{b.slice(3)}</h2>
        if (b.startsWith('### ')) return <h3 key={i} className="pt-2 text-lg font-bold text-gray-900">{b.slice(4)}</h3>
        const img = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(b)
        if (img) {
          return (
            <figure key={i}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img[2]} alt={img[1]} className="w-full rounded-2xl" />
              {img[1] ? <figcaption className="mt-2 text-xs text-gray-500">{img[1]}</figcaption> : null}
            </figure>
          )
        }
        if (b.startsWith('> ')) {
          return <blockquote key={i} className="border-l-2 pl-5 text-xl leading-relaxed text-gray-800" style={{ borderColor: accent }}>{b.replace(/^> ?/gm, '')}</blockquote>
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
        return <p key={i} className="text-[17px] leading-[1.75] text-gray-700" dangerouslySetInnerHTML={{ __html: inline(b) }} />
      })}
    </div>
  )
}

function inline(s: string) {
  return s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
}
