import Image from 'next/image'
import { Link } from '@/lib/i18n/navigation'
import { ArrowRight, Calendar, Clock } from 'lucide-react'
import type { Post } from '@/lib/blog/posts'
import { FORMATS, FORMAT_LABEL } from '@/lib/blog/formats'
import { AUTHORS, authorOf, type Author } from '@/lib/blog/authors'
import { BlogCta } from './BlogCta'

/**
 * Der Hub „Winning Team Stories".
 *
 * Drei Farbwelten auf einer Seite: Eilers+Friends (Navy/Gold) traegt den Rahmen,
 * jede Karte traegt die Welt ihres Autors — Blau fuer SalesMade/Markus, Rot fuer
 * Aljona. Formate als Tabs, Disziplin und Thema als Filter, alles ueber die URL,
 * damit jede gefilterte Ansicht teilbar ist.
 */

export interface HubItem {
  key: string; href: string; title: string; excerpt: string | null; image: string | null
  author: Author; format: string; date: string | null; minutes: number | null; tags: string[]
  badge?: string | null
}

export interface HubFilter { format: string | null; d: string | null; thema: string | null }

const TEAM = AUTHORS.team
const GOLD = '#FFD37A'

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
  const n = { ...f, ...patch }
  const q = new URLSearchParams()
  if (n.format) q.set('format', n.format)
  if (n.d) q.set('d', n.d)
  if (n.thema) q.set('thema', n.thema)
  const s = q.toString()
  return `/blog${s ? `?${s}` : ''}`
}

export function StoriesHub({ items, filter, tags, preview }: {
  items: HubItem[]; filter: HubFilter; tags: string[]; preview?: boolean
}) {
  const filtered = !!(filter.format || filter.d || filter.thema)
  const [lead, ...rest] = items
  const side = filtered ? [] : rest.slice(0, 3)
  const grid = filtered ? items : rest.slice(3)
  const grid1 = grid.slice(0, 8), grid2 = grid.slice(8)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>
      {/* Kopf */}
      <section className="px-6 pb-8 pt-16 sm:pt-20">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl lg:text-6xl" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Winning Team <span style={{ color: AUTHORS.markus.accent }}>Stories</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-gray-600">
            Was wir in 500+ Founder-Sparrings über Vertrieb und Führung lernen. Mit Frameworks zum Mitnehmen.
          </p>
          {preview && <p className="mt-3 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">Vorschau · Entwürfe sichtbar</p>}

          {/* Tabs + Filter */}
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <Chip href={hrefWith(filter, { format: null })} active={!filter.format}>Alle</Chip>
            {FORMATS.filter((f) => f.key !== 'artikel').map((f) => (
              <Chip key={f.key} href={hrefWith(filter, { format: f.key })} active={filter.format === f.key}>{f.label}</Chip>
            ))}
            <span className="mx-2 hidden h-5 w-px bg-gray-200 sm:block" />
            <Chip href={hrefWith(filter, { d: filter.d === 'revenue' ? null : 'revenue' })} active={filter.d === 'revenue'} color={AUTHORS.markus.accent}>Revenue</Chip>
            <Chip href={hrefWith(filter, { d: filter.d === 'leadership' ? null : 'leadership' })} active={filter.d === 'leadership'} color={AUTHORS.aljona.accent}>Leadership</Chip>
          </div>
          {tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <Link key={t} href={hrefWith(filter, { thema: filter.thema === t ? null : t }) as '/'}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${filter.thema === t ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                  #{t}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-6 pb-6">
        {items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-14 text-center">
            <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'DM Serif Display', serif" }}>Hier ist noch nichts erschienen.</h2>
            <p className="mt-2 text-gray-600">{filtered ? 'Für diesen Filter gibt es noch keinen Beitrag.' : 'Die ersten Stories sind in Arbeit.'}</p>
            {filtered && <Link href={'/blog' as '/'} className="mt-5 inline-flex text-sm font-bold" style={{ color: AUTHORS.markus.accent }}>Alle Stories zeigen</Link>}
          </div>
        ) : !filtered ? (
          <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
            <LeadCard item={lead} />
            <div className="flex flex-col gap-5">
              {side.map((it) => <SideCard key={it.key} item={it} />)}
            </div>
          </div>
        ) : null}
      </main>

      {/* Die Serie */}
      {!filter.format || filter.format === 'serie' ? (
        <section className="mt-10 px-6 py-12" style={{ background: TEAM.deep }}>
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: GOLD }}>Die Serie</p>
              <h2 className="mt-2 text-3xl font-bold text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>Gekippt bei Minute …</h2>
              <p className="mt-3 text-white/75">
                Ein echtes Erstgespräch, anonymisiert. Wir zeigen die Fragekette, die Stelle, an der es kippt, und drei Sätze, die es gerettet hätten.
              </p>
            </div>
            <div className="text-right">
              <a href="/gespraechs-check" className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold" style={{ background: GOLD, color: TEAM.deep }}>
                Dein Gespräch auswerten lassen <ArrowRight size={15} />
              </a>
              <p className="mt-2 text-xs text-white/50">Kostenlos über den Gesprächs-Check.</p>
            </div>
          </div>
        </section>
      ) : null}

      {/* Raster */}
      {grid1.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pt-12">
          {!filtered && <h2 className="mb-5 text-xl font-bold text-gray-900">Neu</h2>}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {grid1.map((it) => <GridCard key={it.key} item={it} />)}
          </div>
        </section>
      )}

      {/* Frameworks als Lead-Magnet */}
      <section className="mx-auto max-w-6xl px-6 pt-12">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-3xl p-8 sm:p-10" style={{ background: AUTHORS.markus.tint }}>
          <div className="max-w-xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: AUTHORS.markus.accent }}>Pretrained AI-Agenten · gratis</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900" style={{ fontFamily: "'DM Serif Display', serif" }}>Klau Dir unsere Frameworks. Inklusive AI-Agenten.</h2>
            <p className="mt-2 text-sm text-gray-600">Jedes Framework kommt mit Bauplan und dem Agenten, den wir dafür trainiert haben.</p>
          </div>
          <Link href={'/frameworks' as '/'} className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white" style={{ background: AUTHORS.markus.accent }}>
            Zu den Frameworks <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {grid2.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pt-12">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {grid2.map((it) => <GridCard key={it.key} item={it} />)}
          </div>
        </section>
      )}

      {/* Zwei Wege zum Gespräch — getrennte Kalender */}
      <section className="mx-auto max-w-6xl px-6 pt-14">
        <div className="grid gap-5 md:grid-cols-2">
          {[AUTHORS.markus, AUTHORS.aljona].map((a) => (
            <div key={a.slug} className="flex items-center gap-4 rounded-3xl p-6" style={{ background: a.tint }}>
              {a.avatar ? (
                <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full">
                  <Image src={a.avatar} alt={a.name} fill sizes="56px" className="object-cover" />
                </span>
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: a.accent }}>{a.tagline}</p>
                <p className="text-base font-bold text-gray-900">{a.name}</p>
                <p className="text-xs text-gray-600">{a.role}</p>
              </div>
              <Link href={a.booking as '/'} className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-white" style={{ background: a.accent }}>
                <Calendar size={12} /> Termin
              </Link>
            </div>
          ))}
        </div>
      </section>

      <div className="pb-20">
        <BlogCta author={TEAM} />
      </div>
    </div>
  )
}

function Chip({ href, active, children, color }: { href: string; active: boolean; children: React.ReactNode; color?: string }) {
  return (
    <Link href={href as '/'}
      className="rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors"
      style={active
        ? { background: color ?? '#0F1E3A', borderColor: color ?? '#0F1E3A', color: '#fff' }
        : { borderColor: '#E5E7EB', color: color ?? '#374151', background: '#fff' }}>
      {children}
    </Link>
  )
}

function Meta({ it }: { it: HubItem }) {
  const a = it.author
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
      <span className="font-bold" style={{ color: a.accent }}>{FORMAT_LABEL[it.format] ?? 'Artikel'}</span>
      <span className="text-gray-300">·</span>
      <span className="text-gray-500">{a.discipline === 'leadership' ? 'Leadership' : a.discipline === 'revenue' ? 'Revenue' : 'Revenue & Leadership'}</span>
      {it.minutes ? (<><span className="text-gray-300">·</span><span className="inline-flex items-center gap-1 text-gray-500"><Clock size={10} />{it.minutes} Min</span></>) : null}
      <span className="text-gray-300">·</span>
      <span className="text-gray-500">{a.slug === 'team' ? 'Eilers+Friends' : a.name.split(' ')[0]}</span>
    </div>
  )
}

function Visual({ it, className }: { it: HubItem; className: string }) {
  const a = it.author
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: it.image ? undefined : `linear-gradient(135deg, ${a.deep}, ${a.accent})` }}>
      {it.image ? <Image src={it.image} alt="" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" /> : null}
      {it.badge ? (
        <span className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold text-white" style={{ background: a.accent }}>{it.badge}</span>
      ) : null}
      <span className="absolute inset-x-0 bottom-0 h-1" style={{ background: a.accent }} />
    </div>
  )
}

function LeadCard({ item }: { item: HubItem }) {
  return (
    <Link href={item.href as '/'} className="group flex flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white transition-shadow hover:shadow-xl">
      <Visual it={item} className="h-64 sm:h-80" />
      <div className="p-7">
        <h2 className="text-2xl font-bold leading-snug text-gray-900 sm:text-3xl" style={{ fontFamily: "'DM Serif Display', serif" }}>{item.title}</h2>
        {item.excerpt && <p className="mt-3 text-base leading-relaxed text-gray-600">{item.excerpt}</p>}
        <div className="mt-4"><Meta it={item} /></div>
      </div>
    </Link>
  )
}

function SideCard({ item }: { item: HubItem }) {
  return (
    <Link href={item.href as '/'} className="group flex gap-4 overflow-hidden rounded-2xl border border-gray-200 bg-white p-3 transition-shadow hover:shadow-lg">
      <Visual it={item} className="h-24 w-32 shrink-0 rounded-xl" />
      <div className="min-w-0 py-1">
        <h3 className="line-clamp-2 text-base font-bold leading-snug text-gray-900">{item.title}</h3>
        <div className="mt-2"><Meta it={item} /></div>
      </div>
    </Link>
  )
}

function GridCard({ item }: { item: HubItem }) {
  return (
    <Link href={item.href as '/'} className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <Visual it={item} className="h-40" />
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-[15px] font-bold leading-snug text-gray-900">{item.title}</h3>
        <div className="mt-auto pt-3"><Meta it={item} /></div>
      </div>
    </Link>
  )
}
