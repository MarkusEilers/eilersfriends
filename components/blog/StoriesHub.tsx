import Image from 'next/image'
import { Link } from '@/lib/i18n/navigation'
import { ChevronDown } from 'lucide-react'
import type { Post } from '@/lib/blog/posts'
import { formatTabs, formatLabel, localizeAuthor } from '@/lib/blog/i18n-data'
import { authorOf, type Author } from '@/lib/blog/authors'
import { EmailCapture } from './EmailCapture'
import { getTranslations, getLocale } from 'next-intl/server'
import { useLocale } from 'next-intl'

/**
 * Der Hub „Winning Team Stories" — nach der Designvorlage.
 *
 * Heller Grund, Bilder ohne Kartenrahmen, Titel darunter, eine Meta-Zeile mit
 * Format, Disziplin, Lesezeit und Autor. Jede Karte traegt die Farbe ihrer
 * Welt (SalesMade/Markus blau, Aljona rot, Team navy). Formate als Tabs,
 * Disziplin, Thema und Coach als Dropdowns — alles ueber die URL.
 */

export interface HubItem {
  key: string; href: string; title: string; excerpt: string | null; image: string | null
  author: Author; format: string; date: string | null; minutes: number | null; tags: string[]
  badge?: string | null; agent?: boolean
}

export interface HubFilter { format: string | null; d: string | null; thema: string | null; coach: string | null; n: number; q?: string | null }

const BLUE = '#1A5FD4'
const INK = '#0D0D0B'

export function postToItem(p: Post): HubItem {
  const m = p.story?.metrics?.find((x) => x.value) ?? p.story?.data?.metrics?.find((x) => x.value)
  return {
    key: p.slug, href: `/blog/${p.slug}`, title: p.title, excerpt: p.excerpt ?? p.subtitle,
    image: p.hero_image ?? p.og_image, author: authorOf(p.author_slug), format: p.format ?? 'artikel',
    date: p.published_at, minutes: p.reading_minutes, tags: p.tags ?? [],
    badge: m ? `${m.value} ${m.label}` : null,
  }
}

function hrefWith(f: HubFilter, patch: Partial<HubFilter>) {
  const n = { ...f, n: 0, ...patch }
  const q = new URLSearchParams()
  if (n.format) q.set('format', n.format)
  if (n.d) q.set('d', n.d)
  if (n.thema) q.set('thema', n.thema)
  if (n.coach) q.set('coach', n.coach)
  if (n.q) q.set('q', n.q)
  if (n.n) q.set('n', String(n.n))
  const s = q.toString()
  return `/blog${s ? `?${s}` : ''}`
}

const discLabel = (a: Author, t: any) => (a.discipline === 'leadership' ? t('discipline.leadership') : a.discipline === 'revenue' ? t('discipline.revenue') : t('discipline.both'))

export async function StoriesHub({ items, filter, tags, preview, hasMore, formats }: {
  items: HubItem[]; filter: HubFilter; tags: string[]; preview?: boolean; hasMore?: boolean
  /** Formate, zu denen es Inhalte gibt — nur diese bekommen einen Filter-Tab */
  formats?: string[]
}) {
  const t = await getTranslations('blogUi.hub')
  const locale = await getLocale()
  const filtered = !!(filter.format || filter.d || filter.thema || filter.coach || filter.q)
  const [lead, ...rest] = items
  const side = filtered ? [] : rest.slice(0, 2)
  // „Neu“ zeigt immer alles chronologisch (neueste Beiträge zuerst, dann Frameworks) — auch was oben schon als Aufmacher steht
  const grid = items
  const grid1 = grid.slice(0, 4), grid2 = grid.slice(4)
  const sub = [filter.format ? formatLabel(filter.format, locale) : t('tabs.allFormats'), filter.d === 'revenue' ? t('discipline.revenue') : filter.d === 'leadership' ? t('discipline.leadership') : t('discipline.both')].join(' · ')

  return (
    <div className="min-h-screen bg-white">
      <section className="px-6 pb-6 pt-14 sm:pt-20">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-[3.5rem]" style={{ color: INK }}>
            {t.rich('hero.title', {
              b: (c) => <span style={{ color: BLUE }}>{c}</span>
            })}
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-gray-600">
            {t('hero.subtitle')}
          </p>
          {preview && <p className="mt-3 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">{t('preview')}</p>}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <Tab href={hrefWith(filter, { format: null })} active={!filter.format}>{t('tabs.all')}</Tab>
              {formatTabs(locale).filter((f) => f.key !== 'artikel' && (!formats || formats.includes(f.key) || filter.format === f.key)).map((f) => (
                <Tab key={f.key} href={hrefWith(filter, { format: f.key })} active={filter.format === f.key}>{f.label}</Tab>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-5 text-sm text-gray-700">
              <form action={locale === 'de' ? '/blog' : `/${locale}/blog`} method="get" role="search" className="flex items-center">
                <input type="search" name="q" defaultValue={filter.q ?? ''} placeholder={locale === 'en' ? 'Search stories, companies, numbers …' : locale === 'es' ? 'Buscar historias, empresas, cifras …' : 'Stories, Firmen, Zahlen suchen …'}
                  aria-label={locale === 'en' ? 'Search' : locale === 'es' ? 'Buscar' : 'Suchen'}
                  className="w-56 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm outline-none focus:border-gray-400" />
              </form>
              <Dropdown label={t('dropdowns.discipline.label')} value={filter.d === 'revenue' ? t('discipline.revenue') : filter.d === 'leadership' ? t('discipline.leadership') : null} options={[
                { label: t('dropdowns.discipline.both'), href: hrefWith(filter, { d: null }) },
                { label: t('discipline.revenue'), href: hrefWith(filter, { d: 'revenue' }) },
                { label: t('discipline.leadership'), href: hrefWith(filter, { d: 'leadership' }) },
              ]} />
              <Dropdown label={t('dropdowns.topic.label')} value={filter.thema} options={[
                { label: t('dropdowns.topic.all'), href: hrefWith(filter, { thema: null }) },
                ...tags.map((tag) => ({ label: tag, href: hrefWith(filter, { thema: tag }) })),
              ]} />
              <Dropdown label={t('dropdowns.coach.label')} value={filter.coach ? authorOf(filter.coach).name.split(' ')[0] : null} options={[
                { label: t('dropdowns.coach.all'), href: hrefWith(filter, { coach: null }) },
                { label: 'Markus', href: hrefWith(filter, { coach: 'markus' }) },
                { label: 'Aljona', href: hrefWith(filter, { coach: 'aljona' }) },
              ]} />
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-6 pb-4 pt-4">
        {items.length === 0 ? (
          <div className="rounded-2xl bg-[#F4F4F2] p-14 text-center">
            <h2 className="text-2xl font-bold text-gray-900">{t('empty.title')}</h2>
            <p className="mt-2 text-gray-600">{filtered ? t('empty.filtered') : t('empty.unfiltered')}</p>
            {filtered && <Link href={'/blog' as '/'} className="mt-5 inline-flex text-sm font-bold" style={{ color: BLUE }}>{t('empty.showAll')}</Link>}
          </div>
        ) : !filtered ? (
          <div className="grid gap-8 lg:grid-cols-[1.75fr_1fr]">
            <LeadCard item={lead} t={t} />
            <div className="flex flex-col gap-6">
              {side.map((it, i) => <SideCard key={it.key} item={it} withImage t={t} />)}
            </div>
          </div>
        ) : null}
      </main>

      {/* Die Serie */}
      {!filtered || filter.format === 'serie' ? (
        <section className="mt-12 px-6 py-12" style={{ background: BLUE }}>
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6">
            <div className="max-w-xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/80">{t('series.label')}</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">{t('series.title')}</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-white/90">{t('series.desc')}</p>
            </div>
            <div className="max-w-xs">
              <a href="/gespraechs-check" className="inline-flex w-full items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-bold" style={{ color: BLUE }}>
                {t('series.cta')}
              </a>
              <p className="mt-2 text-xs leading-snug text-white/85">{t('series.ctaDesc')}</p>
            </div>
          </div>
        </section>
      ) : null}

      {grid1.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pt-12">
          <div className="mb-5 flex items-baseline gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">{filtered ? t('grid.title.filtered') : t('grid.title.unfiltered')}</h2>
            <span className="text-xs text-gray-500">{sub}</span>
          </div>
          <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {grid1.map((it) => <GridCard key={it.key} item={it} t={t} />)}
          </div>
        </section>
      )}

      {/* Frameworks als Lead-Magnet */}
      <section className="mx-auto max-w-6xl px-6 pt-10">
        <div className="grid items-center gap-8 rounded-2xl px-8 py-9 sm:px-10 md:grid-cols-[1.4fr_1fr]" style={{ background: '#EBF1FF' }}>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: BLUE }}>{t('frameworks.label')}</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-[1.7rem]">{t('frameworks.title')}</h2>
            <p className="mt-2 text-sm text-gray-600">{t('frameworks.desc')}</p>
          </div>
          {/* Keine E-Mail hier: die Adresse gibt man auf der Seite des Frameworks, das man sich aussucht */}
          <Link href={'/frameworks' as '/'} className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-gray-900 px-7 text-sm font-bold text-white hover:bg-[#124293] md:justify-self-end">{t('frameworks.ctaLink')} →</Link>
        </div>
      </section>

      {grid2.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pt-10">
          <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {grid2.map((it) => <GridCard key={it.key} item={it} t={t} />)}
          </div>
        </section>
      )}

      {hasMore && (
        <div className="mt-10 text-center">
          <Link href={hrefWith(filter, { n: (filter.n || 24) + 24, format: filter.format, d: filter.d, thema: filter.thema, coach: filter.coach }) as '/'} scroll={false}
            className="inline-flex rounded-full border border-gray-900 px-6 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50">
            {t('more')}
          </Link>
        </div>
      )}

      {/* Newsletter */}
      <section className="mt-16 px-6 py-12" style={{ background: '#F2F2F0' }}>
        <div className="mx-auto grid max-w-6xl items-end gap-8 md:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-600">{t('newsletter.label')}</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-[1.7rem]">{t('newsletter.title')}</h2>
          </div>
          <EmailCapture source="hub:newsletter" button={t('newsletter.cta')} buttonClass="text-white bg-[#1A5FD4]" layout="row" />
        </div>
      </section>
    </div>
  )
}

function Tab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href as '/'}
      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${active ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-800 hover:border-gray-400'}`}>
      {children}
    </Link>
  )
}

function Dropdown({ label, value, options }: { label: string; value: string | null; options: Array<{ label: string; href: string }> }) {
  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-1 font-medium [&::-webkit-details-marker]:hidden">
        {value ?? label} <ChevronDown size={14} className="transition-transform group-open:rotate-180" />
      </summary>
      <div className="absolute right-0 z-20 mt-2 min-w-44 rounded-xl border border-gray-100 bg-white p-1.5 shadow-lg">
        {options.map((o) => (
          <Link key={o.label} href={o.href as '/'} className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">{o.label}</Link>
        ))}
      </div>
    </details>
  )
}

function Meta({ it, long, t }: { it: HubItem; long?: boolean; t: any }) {
  const locale = useLocale()
  const a = it.author
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-600">
      <span className="font-bold" style={{ color: a.accent }}>{formatLabel(it.format, locale) ?? t('meta.article')}{it.agent ? t('meta.agent') : ''}</span>
      <span>{long && a.slug !== 'team' ? localizeAuthor(a, locale).tagline : discLabel(a, t)}{it.minutes ? t(it.format === 'video' ? 'meta.videoMinutes' : 'meta.minutes', { count: it.minutes }) : ''}</span>
      <span className="inline-flex items-center gap-1.5">
        {a.avatar ? (
          <span className="relative inline-block h-5 w-5 overflow-hidden rounded-full"><Image src={a.avatar} alt="" fill sizes="20px" className="object-cover" /></span>
        ) : <span className="inline-block h-5 w-5 rounded-full" style={{ background: a.deep }} />}
        {a.slug === 'team' ? 'Eilers+Friends' : long ? a.name : a.name.split(' ')[0]}
      </span>
    </div>
  )
}

function Visual({ it, className, t }: { it: HubItem; className: string; t: any }) {
  const a = it.author
  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`} style={{ background: it.image ? '#D9D7D4' : `linear-gradient(135deg, ${a.deep}, ${a.accent})` }}>
      {it.image ? <Image src={it.image} alt="" fill sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" /> : null}
      {/* Keine Pillen auf den Bildern — Kennzahl und AI-Agent stehen in der Meta-Zeile */}
    </div>
  )
}

function LeadCard({ item, t }: { item: HubItem; t: any }) {
  return (
    <Link href={item.href as '/'} className="group block">
      <Visual it={item} className="aspect-[16/9]" t={t} />
      <h2 className="mt-5 max-w-xl text-3xl font-bold leading-[1.15] tracking-tight text-gray-900 sm:text-[2rem]">{item.title}</h2>
      <div className="mt-3"><Meta it={item} long t={t} /></div>
    </Link>
  )
}

function SideCard({ item, withImage, t }: { item: HubItem; withImage: boolean; t: any }) {
  return (
    <Link href={item.href as '/'} className="group block">
      {withImage ? <Visual it={item} className="aspect-[2/1]" t={t} /> : null}
      <h3 className={`${withImage ? 'mt-3' : ''} text-base font-bold leading-snug text-gray-900`}>{item.title}</h3>
      <div className="mt-1.5"><Meta it={item} t={t} /></div>
    </Link>
  )
}

function GridCard({ item, t }: { item: HubItem; t: any }) {
  return (
    <Link href={item.href as '/'} className="group block">
      <Visual it={item} className="aspect-square" t={t} />
      <h3 className="mt-3 text-[15px] font-bold leading-snug text-gray-900">{item.title}</h3>
      <div className="mt-1.5"><Meta it={item} t={t} /></div>
    </Link>
  )
}
