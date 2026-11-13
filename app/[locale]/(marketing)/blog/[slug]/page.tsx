import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import Image from 'next/image'
import { notFound, redirect } from 'next/navigation'
import { sql } from 'drizzle-orm'
import { Link } from '@/lib/i18n/navigation'
import { ArrowRight, TrendingUp, Clock3, MoveRight } from 'lucide-react'
import { db } from '@/lib/db'
import { getPost, relatedPosts, type Post } from '@/lib/blog/posts'
import { type StoryData } from '@/lib/blog/formats'
import { formatLabel, localizeAuthor } from '@/lib/blog/i18n-data'
import { authorOf, type Author } from '@/lib/blog/authors'
import { Comments } from '@/components/blog/Comments'
import { ShareBar } from '@/components/blog/ShareBar'
import { EmailCapture } from '@/components/blog/EmailCapture'
import { PostBody, headingsOf } from '@/components/blog/PostBody'
import { getTranslations, getLocale } from 'next-intl/server'
import { useLocale } from 'next-intl'
import { useTranslations } from 'next-intl'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const t = await getTranslations('blogUi.post')
  const { slug } = await params
  const post = await getPost(slug, true)
  if (!post) return { title: t('notFoundTitle') }
  const a = authorOf(post.author_slug)
  const langs = (await versionsOf(post)).filter((v) => v.status === 'published')
  const base = 'https://www.eilersfriends.com'
  // Deutsch ohne Sprachpräfix — wie in der Sitemap
  const url = (loc: string, sl: string) => `${base}${loc === 'de' ? '' : `/${loc}`}/blog/${sl}`
  return {
    title: post.title,
    alternates: {
      canonical: url(post.locale ?? 'de', post.slug),
      ...(langs.length > 1 ? { languages: Object.fromEntries([...langs.map((v) => [v.locale, url(v.locale, v.slug)]), ['x-default', url('de', (langs.find((v) => v.locale === 'de') ?? langs[0]).slug)]]) } : {}),
    },
    description: post.excerpt ?? post.subtitle ?? undefined,
    authors: [{ name: a.name }],
    openGraph: {
      title: post.title, description: post.excerpt ?? undefined, type: 'article',
      images: post.hero_image ?? post.og_image ? [post.hero_image ?? post.og_image!] : undefined,
    },
  }
}

const INK = '#0D0D0B'

/** Alle Sprachfassungen eines Beitrags (Original + Übersetzungen über translation_of) */
async function versionsOf(post: { id: string; translation_of?: string | null }) {
  const root = post.translation_of ?? post.id
  const rows = await db.execute(sql`
    SELECT slug, locale, status FROM blog_posts WHERE id = ${root} OR translation_of = ${root}`).catch(() => [])
  return rows as unknown as Array<{ slug: string; locale: string; status: string }>
}

const dt = (s: string | null, loc = 'de') =>
  s ? new Date(s).toLocaleDateString(loc === 'en' ? 'en-US' : loc === 'es' ? 'es-ES' : 'de-DE', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
const slugify = (s: string) => s.toLowerCase().replace(/[^\x000-\x7f\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 60)
const discLabel = (a: Author, t: any) => (a.discipline === 'leadership' ? t('discipline.leadership') : a.discipline === 'revenue' ? t('discipline.revenue') : t('discipline.both'))

async function frameworkFor(slug?: string) {
  if (!slug) return null
  const rows = (await db.execute(sql`SELECT slug, title FROM landing_pages WHERE slug = ${slug} AND status = 'published' LIMIT 1`).catch(() => [])) as unknown as Array<{ slug: string; title: string }>
  return rows[0] ?? null
}

export default async function PostPage({
  params, searchParams,
}: { params: Promise<{ slug: string }>; searchParams: Promise<{ preview?: string }> }) {
  const t = await getTranslations('blogUi.post')
  const locale = await getLocale()
  const [{ slug }, sp] = await Promise.all([params, searchParams])
  const preview = sp.preview === '1' && await isEditor()
  const post = await getPost(slug, preview)
  if (!post) notFound()

  // Sprachfassung: /en/blog/<deutscher-slug> → englische Fassung (und umgekehrt), wenn es sie gibt
  if (post.locale && post.locale !== locale) {
    const v = (await versionsOf(post)).find((x) => x.locale === locale && (x.status === 'published' || preview))
    if (v) redirect(`/${locale}/blog/${v.slug}${preview ? '?preview=1' : ''}`)
  }

  const a = authorOf(post.author_slug)
  const st: StoryData = post.story ?? {}
  const [related, fw] = await Promise.all([relatedPosts(post, 3), frameworkFor(st.framework_slug)])
  const hero = post.hero_image ?? post.og_image
  const heads = headingsOf(post.content)
  const facts = [
    [t('facts.company'), st.facts?.company], [t('facts.phase'), st.facts?.phase],
    [t('facts.program'), st.facts?.program], [t('facts.coach'), st.facts?.coach],
  ].filter(([, v]) => v) as [string, string][]
  const metrics = (st.metrics ?? []).filter((m) => m.value)
  const first = a.slug === 'team' ? t('authorCard.us') : a.name.split(' ')[0]

  return (
    <article className="min-h-screen bg-white">
      {/* Kopf: Text links, Bild rechts */}
      <header className="px-6 pt-10 sm:pt-14">
        <div className={`mx-auto grid max-w-6xl items-center gap-10 ${hero ? 'lg:grid-cols-[1.1fr_1fr]' : 'lg:grid-cols-[180px_640px] lg:justify-center lg:gap-14 xl:grid-cols-[180px_640px_200px]'}`}> 
          <div className={hero ? '' : 'lg:col-start-2'}>
            <p className="text-xs text-gray-600">
              <Link href={'/blog' as '/'} className="underline">{t('breadcrumbs.stories')}</Link>
              {' / '}
              <span className="font-bold" style={{ color: a.accent }}>{formatLabel(post.format ?? 'artikel', locale) ?? t('format.article')}</span>
              {' · '}{discLabel(a, t)}{post.published_at ? ` · ${dt(post.published_at, locale)}` : ''}
              {post.status !== 'published' && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 font-bold text-amber-800">{t('draft')}</span>}
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl" style={{ color: INK }}>{post.title}</h1>
            {(post.subtitle || post.excerpt) && (
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-gray-600">{post.subtitle ?? post.excerpt}</p>
            )}
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Link href={a.booking as '/'} className="inline-flex items-center rounded-full px-5 py-3 text-sm font-bold text-white" style={{ background: INK }}>
                {t('bookStrategy')}
              </Link>
              <span className="inline-flex items-center gap-2 text-sm text-gray-600">
                <Avatar a={a} size={32} />
                {a.slug === 'team' ? t('byline.team') : `${post.format === 'kundenstory' ? t('byline.coachedBy') : t('byline.writtenBy')} ${a.name}`}
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

        {st.series && st.series.parts?.length > 0 && (
          <div className="mx-auto mt-10 max-w-6xl">
            <div className="flex flex-col gap-4 rounded-2xl bg-[#F3F2F2] px-6 py-5 lg:flex-row lg:items-center lg:gap-6">
              <span className="shrink-0 text-[12px] font-bold uppercase tracking-[0.12em] text-gray-600">{st.series.name}</span>
              <div className="grid flex-1 gap-3 sm:grid-cols-3">
                {st.series.parts.map((p, i) => {
                  const box = (
                    <div className={`flex h-full flex-col gap-0.5 rounded-xl bg-white px-3.5 py-2.5 ${p.current ? 'border-2 border-[#1A5FD4]' : ''}`}>
                      <span className={`text-[12px] font-bold ${p.current ? 'text-[#1A5FD4]' : 'text-gray-600'}`}>{p.label}</span>
                      <span className={`text-[14px] font-semibold ${p.current ? 'text-gray-900' : 'text-gray-700'}`}>{p.title}</span>
                    </div>
                  )
                  // Link setzt die Sprache selbst davor — ein gespeichertes /en/… sonst doppelt (→ 404)
                  return p.href && !p.current ? <Link key={i} href={p.href.replace(/^\/(de|en|es)(?=\/)/, '') as '/'}>{box}</Link> : <div key={i}>{box}</div>
                })}
              </div>
            </div>
          </div>
        )}

        {post.format === 'newsletter' && <div className="mx-auto mt-10 max-w-6xl lg:hidden"><GrowthLetterBox locale={locale} badge={st.issue ? `#${st.issue}` : undefined} /></div>}

        <div className="mx-auto mt-8 grid max-w-6xl lg:grid-cols-[180px_640px] lg:justify-center lg:gap-14 xl:grid-cols-[180px_640px_200px]">
          <div className="lg:col-start-2"><ShareBar audio={(post as { audio_url?: string | null }).audio_url ?? st.audio_url} minutes={post.reading_minutes} video={post.format === 'video'} ownVoice={(post as { audio_hash?: string | null }).audio_hash ? ({ markus: 'Markus', aljona: 'Aljona' } as Record<string, string>)[post.author_slug] : undefined} /></div>
        </div>
      </header>

      {/* Inhalt mit Seitenleiste */}
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[180px_640px] lg:justify-center lg:gap-14 xl:grid-cols-[180px_640px_200px]">
        <aside className="hidden lg:block">
          <div className="sticky top-28 space-y-6">
            {heads.length > 0 && (
              <nav>
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-500">{t('toc.title')}</p>
                <ul className="mt-3 space-y-2.5 text-[13px] leading-snug">
                  {heads.map((h, i) => (
                    <li key={h.id}><a href={`#${h.id}`} className={i === 0 ? 'font-semibold' : 'text-gray-600 hover:text-gray-900'} style={i === 0 ? { color: a.accent } : undefined}>{h.text}</a></li>
                  ))}
                </ul>
              </nav>
            )}
            {st.for_whom && (
              <div className="rounded-xl bg-[#F2F2F0] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500">{t('forWhom.title')}</p>
                <p className="mt-2 text-[13px] leading-snug text-gray-700">{st.for_whom}</p>
              </div>
            )}
            {post.format === 'newsletter' && <GrowthLetterBox locale={locale} badge={st.issue ? `#${st.issue}` : undefined} compact />}
          </div>
        </aside>

        <div className="min-w-0">
          {(st.before || st.after) && (
            <div className="mb-8 rounded-2xl bg-[#F2F2F0] p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: a.accent }}>{t('beforeAfter.title')}</p>
              <div className="mt-3 grid gap-5 sm:grid-cols-2">
                <div><p className="text-xs font-bold text-gray-700">{t('beforeAfter.before')}</p><p className="mt-1 text-sm leading-relaxed text-gray-700">{st.before}</p></div>
                <div><p className="text-xs font-bold" style={{ color: a.accent }}>{t('beforeAfter.after')}</p><p className="mt-1 text-sm leading-relaxed text-gray-700">{st.after}</p></div>
              </div>
            </div>
          )}

          <PostBody content={post.content} emptyText={t('prose.noText')} accent={post.author_slug === 'aljona' ? 'red' : undefined} />


          {fw && (
            <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-6 text-white" style={{ background: a.slug === 'aljona' ? a.accent : '#1A5FD4' }}>
              <div className="max-w-md">
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/80">{t('framework.title')}</p>
                <p className="mt-1.5 text-lg font-bold leading-snug">{fw.title.replace(' — ', ': ')}</p>
                <p className="mt-1 text-xs text-white/85">{t('framework.desc')}</p>
              </div>
              <Link href={`/frameworks/${fw.slug}` as '/'} className="rounded-full bg-white px-5 py-2.5 text-sm font-bold" style={{ color: a.slug === 'aljona' ? a.accent : '#1A5FD4' }}>
                {t('framework.cta')}
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

      {/* Zusammen: Winning Teams — im Newsletter nicht, dort führen die drei Wege am Ende */}
      {post.format !== 'newsletter' && <section className="mx-auto max-w-6xl px-6 pt-14">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-2xl px-8 py-9 sm:px-10" style={{ background: st.cta ? '#1A5FD4' : INK }}>
          <div className="max-w-xl">
            <p className={`text-[11px] font-bold uppercase tracking-[0.15em] ${st.cta ? 'text-[#CFE0FF]' : 'text-[#8FB4FF]'}`}>{st.cta?.eyebrow ?? t('together.title')}</p>
            <p className="mt-2 text-2xl font-bold leading-snug tracking-tight text-white">{st.cta?.title ?? t('together.subtitle')}</p>
          </div>
          <Link href={(st.cta?.href ?? '/schedule') as '/'} className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold ${st.cta ? 'bg-white text-[#124293]' : 'bg-[#1A5FD4] text-white'}`}>
            {st.cta?.button ?? t('bookStrategy')} <ArrowRight size={15} />
          </Link>
        </div>
      </section>}

      {/* Autorenkarte: schlichte Kurzbio unter dem letzten Aufruf, weißer Grund, ohne eigenen Knopf */}
      <section className="mx-auto max-w-6xl px-6 pt-10">
        <div className="flex items-start gap-5 sm:items-center">
          {a.avatar ? (
            <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-gray-200">
              <Image src={a.avatar} alt={a.name} fill sizes="80px" className="object-cover" />
            </span>
          ) : null}
          <div className="min-w-0 max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500">{t('authorCard.writtenBy')}</p>
            <p className="mt-1 text-lg font-bold text-gray-900">{a.name}</p>
            <p className="mt-1 text-sm leading-relaxed text-gray-600">{localizeAuthor(a, locale).bio}</p>
          </div>
        </div>
      </section>

      {post.format === 'newsletter' && <section className="mx-auto max-w-6xl px-6 pt-10"><GrowthLetterBox locale={locale} next /></section>}

      {related.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pt-14">
          <h2 className="mb-5 text-xl font-bold tracking-tight text-gray-900">{t('related.title', { discipline: discLabel(a, t) })}</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {related.map((r) => <RelatedCard key={r.slug} post={r} t={t} />)}
          </div>
        </section>
      )}

      {post.status === 'published' && (
        <Comments postId={post.id} author={a} open={(post as { comments_open?: boolean }).comments_open !== false} />
      )}
      {post.status !== 'published' && <div className="pb-20" />}
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

function RelatedCard({ post, t }: { post: Post, t: any }) {
  const locale = useLocale()
  const a = authorOf(post.author_slug)
  const img = post.hero_image ?? post.og_image
  return (
    <Link href={`/blog/${post.slug}` as '/'} className="group block">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl" style={{ background: img ? '#D9D7D4' : `linear-gradient(135deg, ${a.deep}, ${a.accent})` }}>
        {img ? <Image src={img} alt="" fill sizes="33vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" /> : null}
      </div>
      <h3 className="mt-3 text-[15px] font-bold leading-snug text-gray-900">{post.title}</h3>
      <p className="mt-1 text-xs text-gray-600">
        <span className="font-bold" style={{ color: a.accent }}>{formatLabel(post.format ?? 'artikel', locale) ?? t('format.article')}</span>
        {post.reading_minutes ? t(post.format === 'video' ? 'related.videoMinutes' : 'related.readingMinutes', { minutes: post.reading_minutes }) : ''}
      </p>
    </Link>
  )
}

/** Entwürfe nur für Admin und Coach — sonst wäre ?preview=1 eine offene Tür. */
async function isEditor() {
  const s = await auth().catch(() => null)
  return s?.user?.role === 'admin' || s?.user?.role === 'coach'
}

/** Anmeldebox für den GrowthLetter (oben mit Ausgabe-Nummer, unten mit „Nächste Ausgabe“) */
function GrowthLetterBox({ locale, badge, next, compact }: { locale: string; badge?: string; next?: boolean; compact?: boolean }) {
  const T = {
    de: { desc: 'Jede Woche eine Überzeugung zu Sales, Marketing und Führung. Für CEOs und Founder im B2B.', next: 'Nächste Ausgabe: Dienstag', cta: 'Abonnieren', all: 'Alle Ausgaben' },
    en: { desc: 'One conviction on sales, marketing and leadership, every week. For B2B CEOs and founders.', next: 'Next issue: Tuesday', cta: 'Subscribe', all: 'All issues' },
    es: { desc: 'Cada semana, una convicción sobre ventas, marketing y liderazgo. Para CEOs y fundadores B2B.', next: 'Próximo número: martes', cta: 'Suscribirse', all: 'Todos los números' },
  }[locale] ?? { desc: 'Jede Woche eine Überzeugung zu Sales, Marketing und Führung. Für CEOs und Founder im B2B.', next: 'Nächste Ausgabe: Dienstag', cta: 'Abonnieren', all: 'Alle Ausgaben' }
  if (compact) return (
    <div className="flex flex-col gap-3 rounded-xl bg-[#0D0D0B] p-4 text-white">
      <span className="flex items-baseline gap-1.5"><b className="text-[15px] tracking-tight">GrowthLetter</b>{badge && <span className="text-[12px] font-bold text-[#8FB0EC]">{badge}</span>}</span>
      <span className="text-[12px] leading-snug text-white/75">{T.desc}</span>
      <EmailCapture source="growthletter" button={T.cta} buttonClass="bg-[#1A5FD4] text-white" layout="stack" tone="dark" />
      <Link href={'/blog?format=newsletter' as '/'} className="text-[12px] font-semibold text-[#8FB0EC] underline-offset-2 hover:underline">{T.all} →</Link>
    </div>
  )
  return (
    <div className="grid items-center gap-6 rounded-2xl bg-[#0D0D0B] px-6 py-6 text-white sm:px-8 md:grid-cols-[1.3fr_1fr]">
      <div className="flex flex-col gap-2">
        <span className="flex items-baseline gap-2"><b className="text-[20px] tracking-tight">GrowthLetter</b>{badge ? <span className="text-[14px] font-bold text-[#8FB0EC]">{badge}</span> : next ? <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#8FB0EC]">{T.next}</span> : null}</span>
        <span className="text-[14px] leading-relaxed text-white/80">{T.desc}</span>
        <Link href={'/blog?format=newsletter' as '/'} className="text-[13px] font-semibold text-[#8FB0EC] underline-offset-2 hover:underline">{T.all} →</Link>
      </div>
      <EmailCapture source="growthletter" button={T.cta} buttonClass="bg-[#1A5FD4] text-white" layout="row" tone="dark" />
    </div>
  )
}
