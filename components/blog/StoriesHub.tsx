import Image from 'next/image'
import { Link } from '@/lib/i18n/navigation'
import { ChevronDown } from 'lucide-react'
import type { Post } from '@/lib/blog/posts'
import { FORMATS, FORMAT_LABEL } from '@/lib/blog/formats'
import { authorOf, type Author } from '@/lib/blog/authors'
import { EmailCapture } from './EmailCapture'

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

export interface HubFilter { format: string | null; d: string | null; thema: string | null; coach: string | null; n: number }

const BLUE = '#1A5FD4'
const INK = '#0D0D0B'

export function postToItem(p: Post): HubItem {
  const m = p.story?.metrics?.find((x) => x.value)
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
  if (n.n) q.set('n', String(n.n))
  const s = q.toString()
  return `/blog${s ? `?${s}` : ''}`
}

const discLabel = (a: Author) => (a.discipline === 'leadership' ? 'Leadership' : a.discipline === 'revenue' ? 'Revenue' : 'Revenue & Leadership')

export function StoriesHub({ items, filter, tags, preview, hasMore }: {
  items: HubItem[]; filter: HubFilter; tags: string[]; preview?: boolean; hasMore?: boolean
}) {
  const filtered = !!(filter.format || filter.d || filter.thema || filter.coach)
  const [lead, ...rest] = items
  const side = filtered ? [] : rest.slice(0, 3)
  const grid = filtered ? items : rest.slice(3)
  const grid1 = grid.slice(0, 4), grid2 = grid.slice(4)
  const sub = [filter.format ? FORMAT_LABEL[filter.format] : 'Alle Formate', filter.d === 'revenue' ? 'Revenue' : filter.d === 'leadership' ? 'Leadership' : 'Beide Disziplinen'].join(' · ')

  return (
    <div className="min-h-screen bg-white">
      <section className="px-6 pb-6 pt-14 sm:pt-20">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-[3.5rem]" style={{ color: INK }}>
            Winning Team <span style={{ color: BLUE }}>Stories</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-gray-600">
            Was wir in 500+ Founder-Sparrings über Vertrieb und Führung lernen. Mit Frameworks zum Mitnehmen.
          </p>
          {preview && <p className="mt-3 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">Vorschau · Entwürfe sichtbar</p>}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <Tab href={hrefWith(filter, { format: null })} active={!filter.format}>Alle</Tab>
              {FORMATS.filter((f) => !['artikel', 'video'].includes(f.key)).map((f) => (
                <Tab key={f.key} href={hrefWith(filter, { format: f.key })} active={filter.format === f.key}>{f.label}</Tab>
              ))}
            </div>
            <div className="flex items-center gap-5 text-sm text-gray-700">
              <Dropdown label="Disziplin" value={filter.d === 'revenue' ? 'Revenue' : filter.d === 'leadership' ? 'Leadership' : null} options={[
                { label: 'Beide', href: hrefWith(filter, { d: null }) },
                { label: 'Revenue', href: hrefWith(filter, { d: 'revenue' }) },
                { label: 'Leadership', href: hrefWith(filter, { d: 'leadership' }) },
              ]} />
              <Dropdown label="Thema" value={filter.thema} options={[
                { label: 'Alle Themen', href: hrefWith(filter, { thema: null }) },
                ...tags.map((t) => ({ label: t, href: hrefWith(filter, { thema: t }) })),
              ]} />
              <Dropdown label="Coach" value={filter.coach ? authorOf(filter.coach).name.split(' ')[0] : null} options={[
                { label: 'Alle', href: hrefWith(filter, { coach: null }) },
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
            <h2 className="text-2xl font-bold text-gray-900">Hier ist noch nichts erschienen.</h2>
            <p className="mt-2 text-gray-600">{filtered ? 'Für diesen Filter gibt es noch keinen Beitrag.' : 'Die ersten Stories sind in Arbeit.'}</p>
            {filtered && <Link href={'/blog' as '/'} className="mt-5 inline-flex text-sm font-bold" style={{ color: BLUE }}>Alle Stories zeigen</Link>}
          </div>
        ) : !filtered ? (
          <div className="grid gap-8 lg:grid-cols-[1.75fr_1fr]">
            <LeadCard item={lead} />
            <div className="flex flex-col gap-6">
              {side.map((it, i) => <SideCard key={it.key} item={it} withImage={i < 2} />)}
            </div>
          </div>
        ) : null}
      </main>

      {/* Die Serie */}
      {!filtered || filter.format === 'serie' ? (
        <section className="mt-12 px-6 py-12" style={{ background: BLUE }}>
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6">
            <div className="max-w-xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/80">Die Serie</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">Gekippt bei Minute …</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-white/90">
                Jede Woche ein echtes Erstgespräch, anonymisiert. Wir zeigen die Fragekette, die Stelle, an der es kippt, und drei Sätze, die es gerettet hätten.
              </p>
            </div>
            <div className="max-w-xs">
              <a href="/gespraechs-check" className="inline-flex w-full items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-bold" style={{ color: BLUE }}>
                Dein Gespräch auswerten lassen
              </a>
              <p className="mt-2 text-xs leading-snug text-white/85">Kostenlos über den Gesprächs-Check. Auf Wunsch anonym in der Serie.</p>
            </div>
          </div>
        </section>
      ) : null}

      {grid1.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pt-12">
          <div className="mb-5 flex items-baseline gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">{filtered ? 'Ergebnis' : 'Neu'}</h2>
            <span className="text-xs text-gray-500">{sub}</span>
          </div>
          <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {grid1.map((it) => <GridCard key={it.key} item={it} />)}
          </div>
        </section>
      )}

      {/* Frameworks als Lead-Magnet */}
      <section className="mx-auto max-w-6xl px-6 pt-10">
        <div className="grid items-center gap-8 rounded-2xl px-8 py-9 sm:px-10 md:grid-cols-[1.4fr_1fr]" style={{ background: '#EBF1FF' }}>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: BLUE }}>Pretrained AI-Agenten · gratis</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-[1.7rem]">Klau Dir unsere Frameworks. Inklusive AI-Agenten.</h2>
            <p className="mt-2 text-sm text-gray-600">Jedes Framework kommt mit Bauplan und dem Agenten, den wir dafür trainiert haben.</p>
          </div>
          <EmailCapture source="hub:frameworks" button="Zugang holen" buttonClass="bg-gray-900 text-white" />
        </div>
      </section>

      {grid2.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pt-10">
          <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {grid2.map((it) => <GridCard key={it.key} item={it} />)}
          </div>
        </section>
      )}

      {hasMore && (
        <div className="mt-10 text-center">
          <Link href={hrefWith(filter, { n: (filter.n || 24) + 24, format: filter.format, d: filter.d, thema: filter.thema, coach: filter.coach }) as '/'} scroll={false}
            className="inline-flex rounded-full border border-gray-900 px-6 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50">
            Weitere laden
          </Link>
        </div>
      )}

      {/* Newsletter */}
      <section className="mt-16 px-6 py-12" style={{ background: '#F2F2F0' }}>
        <div className="mx-auto grid max-w-6xl items-end gap-8 md:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-600">Der Growth &amp; Leadership Unternehmerletter</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-[1.7rem]">Jeden Dienstag. 6.554 Unternehmer:innen lesen mit.</h2>
          </div>
          <EmailCapture source="hub:newsletter" button="Anmelden" buttonClass="text-white bg-[#1A5FD4]" layout="row" />
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

function Meta({ it, long }: { it: HubItem; long?: boolean }) {
  const a = it.author
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-600">
      <span className="font-bold" style={{ color: a.accent }}>{FORMAT_LABEL[it.format] ?? 'Artikel'}{it.agent ? ' + AI-Agent' : ''}</span>
      <span>{long && a.slug !== 'team' ? a.tagline : discLabel(a)}{it.minutes ? ` · ${it.minutes} Min.` : ''}</span>
      <span className="inline-flex items-center gap-1.5">
        {a.avatar ? (
          <span className="relative inline-block h-5 w-5 overflow-hidden rounded-full"><Image src={a.avatar} alt="" fill sizes="20px" className="object-cover" /></span>
        ) : <span className="inline-block h-5 w-5 rounded-full" style={{ background: a.deep }} />}
        {a.slug === 'team' ? 'Eilers+Friends' : long ? a.name : a.name.split(' ')[0]}
      </span>
    </div>
  )
}

function Visual({ it, className }: { it: HubItem; className: string }) {
  const a = it.author
  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`} style={{ background: it.image ? '#D9D7D4' : `linear-gradient(135deg, ${a.deep}, ${a.accent})` }}>
      {it.image ? <Image src={it.image} alt="" fill sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" /> : null}
      {it.badge ? (
        <span className="absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold text-white" style={{ background: a.accent }}>{it.badge}</span>
      ) : it.agent ? (
        <span className="absolute left-3 top-3 rounded-full bg-[#EBF1FF] px-2.5 py-1 text-[11px] font-bold" style={{ color: BLUE }}>mit AI-Agent</span>
      ) : null}
    </div>
  )
}

function LeadCard({ item }: { item: HubItem }) {
  return (
    <Link href={item.href as '/'} className="group block">
      <Visual it={item} className="aspect-[16/9]" />
      <h2 className="mt-5 max-w-xl text-3xl font-bold leading-[1.15] tracking-tight text-gray-900 sm:text-[2rem]">{item.title}</h2>
      <div className="mt-3"><Meta it={item} long /></div>
    </Link>
  )
}

function SideCard({ item, withImage }: { item: HubItem; withImage: boolean }) {
  return (
    <Link href={item.href as '/'} className="group block">
      {withImage ? <Visual it={item} className="aspect-[2/1]" /> : null}
      <h3 className={`${withImage ? 'mt-3' : ''} text-base font-bold leading-snug text-gray-900`}>{item.title}</h3>
      <div className="mt-1.5"><Meta it={item} /></div>
    </Link>
  )
}

function GridCard({ item }: { item: HubItem }) {
  return (
    <Link href={item.href as '/'} className="group block">
      <Visual it={item} className="aspect-square" />
      <h3 className="mt-3 text-[15px] font-bold leading-snug text-gray-900">{item.title}</h3>
      <div className="mt-1.5"><Meta it={item} /></div>
    </Link>
  )
}
