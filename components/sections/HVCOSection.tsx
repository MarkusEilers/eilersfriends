import { mergedMeta, type Deliverable } from '@/lib/db/queries/framework-meta'

const _slug_visuals_legacy_icons = SLUG_VISUALS // kept for hardcoded icon refs
import { db } from '@/lib/db'
import { landingPages } from '@/lib/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import Link from 'next/link'
import {
  ArrowRight, Bot, Sparkles, Wand2, Radar, MessageSquareText,
  GitBranch, Lightbulb, Target, FileText, BookOpen, Zap,
} from 'lucide-react'

/**
 * Per-slug visual config: icon, AI-Agent label, optional tagline,
 * and Bento-grid `colSpan` (out of 6 cols on desktop).
 *
 * The two FEATURED frameworks ('instant-influence' and 'b2b-angebote') get
 * 4-col cards (2/3 of the row); the rest are 2-col (1/3 of the row).
 */
const SLUG_VISUALS: Record<
  string,
  {
    icon: typeof BookOpen
    agentLabel: string
    tagline?: string
    posterTitle: string
    posterSub: string
    tone: { from: string; to: string; accent: string }
    featured?: boolean
  }
> = {
  // ── Featured ──────────────────────────────────────────────
  'instant-influence': {
    icon: MessageSquareText,
    agentLabel: 'Discovery-Call AI',
    tagline: 'Generator + Notes-AI',
    posterTitle: 'INSTANT\nINFLUENCE',
    posterSub: 'Win the first conversation',
    tone: { from: '#0F1E3A', to: '#1A5FD4', accent: '#5DDBF5' },
    featured: true,
  },
  'b2b-angebote': {
    icon: Target,
    agentLabel: 'PDF + Video',
    tagline: '8-Schritte-Bauplan',
    posterTitle: 'UNWIDERSTEHLICHE\nANGEBOTE',
    posterSub: 'Der 8-Schritte-Bauplan',
    tone: { from: '#0F1E3A', to: '#0A2851', accent: '#FFD37A' },
    featured: true,
  },
  // ── Normal ────────────────────────────────────────────────
  'hailiom': {
    icon: Wand2,
    agentLabel: '4 GPT Engines',
    tagline: 'Voice · Idea · Atomization · Drafting',
    posterTitle: 'SOCIAL MEDIA\nROCKSTAR',
    posterSub: '9-Schritte AI Content',
    tone: { from: '#3A0F58', to: '#1A5FD4', accent: '#EB0028' },
  },
  'beef-radar': {
    icon: Radar,
    agentLabel: 'Worksheet',
    tagline: 'Konflikt-Diagnose',
    posterTitle: 'BEEF\nRADAR',
    posterSub: 'Konflikte sehen, bevor sie ausbrechen',
    tone: { from: '#0F1E3A', to: '#08193D', accent: '#5DDBF5' },
  },
  'core-messages': {
    icon: Lightbulb,
    agentLabel: '18-Min AI-Worksheet',
    tagline: 'Die 11 Botschaften',
    posterTitle: 'CORE 11',
    posterSub: 'Die Botschaften jedes Unternehmers',
    tone: { from: '#1A4DB0', to: '#0F3D8E', accent: '#5DDBF5' },
  },
  'strategic-preparation': {
    icon: GitBranch,
    agentLabel: 'Pre-Meeting Checklist',
    tagline: 'Vor dem wichtigen Gespräch',
    posterTitle: 'STRATEGIC\nPREP',
    posterSub: '18 Min vor jedem Pitch',
    tone: { from: '#1F2228', to: '#0F1E3A', accent: '#C8A67A' },
  },
  'recommendation-pitch': {
    icon: FileText,
    agentLabel: 'Skript-Vorlage',
    tagline: 'Verkaufen ohne zu verkaufen',
    posterTitle: 'RECOMMENDATION\nPITCH',
    posterSub: 'Käufer:in im Driver-Seat',
    tone: { from: '#1A5FD4', to: '#0F66C8', accent: '#FFFFFF' },
  },
}

const FEATURED_ORDER = ['instant-influence', 'b2b-angebote']

export async function HVCOSection() {
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

  if (frameworks.length === 0) return null

  // Sort: featured first (in defined order), then rest by updatedAt
  const sorted = [...frameworks].sort((a, b) => {
    const ai = FEATURED_ORDER.indexOf(a.slug)
    const bi = FEATURED_ORDER.indexOf(b.slug)
    if (ai !== -1 && bi !== -1) return ai - bi
    if (ai !== -1) return -1
    if (bi !== -1) return 1
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  }).slice(0, 7)

  return (
    <section className="relative overflow-hidden px-6 py-24" style={{ backgroundColor: '#08193D' }}>
      {/* Subtle Karo-Pattern for cinematic texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        aria-hidden="true"
        style={{
          backgroundImage:
            'linear-gradient(#93B8F5 1px, transparent 1px), linear-gradient(90deg, #93B8F5 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 50%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 50%, transparent 100%)',
        }}
      />
      {/* Top + bottom gradient fades to anchor against neighboring sections */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24" style={{ background: 'linear-gradient(180deg, #0A2851 0%, transparent 100%)' }} aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16" style={{ background: 'linear-gradient(0deg, #0A2851 0%, transparent 100%)' }} aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl">

        {/* Header */}
        <div className="text-center mb-14">
          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-5"
            style={{ backgroundColor: 'rgba(93,206,240,0.14)', color: '#5DCEF0', border: '1px solid rgba(93,206,240,0.30)' }}
          >
            <Bot size={12} />
            Pretrained AI-Agenten · Gratis
          </span>
          <h2 className="text-4xl font-bold leading-tight sm:text-5xl text-white">
            Klau dir unsere Frameworks.<br />
            <span style={{ color: '#5DDBF5' }}>Inklusive AI-Agenten.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.70)' }}>
            Du brauchst nicht 47 Custom-GPTs basteln. Wir haben sie schon trainiert.
            Jedes Framework kommt mit Bauplan{' '}
            <span className="font-semibold text-white">+ den AI-Agenten</span>,
            die wir dafür gebaut haben. Email rein — Zugang raus.
          </p>
        </div>

        {/* Poster grid: 1 / 2 / 3 cols — each card a self-contained mini-poster */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sorted.map((f) => {
            // Pull card meta from DB merged with hardcoded fallback
            const fallback = SLUG_VISUALS[f.slug]
            const dbMeta = mergedMeta(f.slug, f.cardMeta as Parameters<typeof mergedMeta>[1])
            const visual = {
              icon: fallback?.icon ?? BookOpen,
              agentLabel: dbMeta.agentLabel ?? fallback?.agentLabel ?? 'Bauplan',
              tagline: dbMeta.tagline ?? fallback?.tagline,
              posterTitle: dbMeta.posterTitle ?? fallback?.posterTitle ?? f.title.toUpperCase(),
              posterSub: dbMeta.posterSubtitle ?? fallback?.posterSub ?? '',
              tone: dbMeta.tone ?? fallback?.tone ?? { from: '#0F1E3A', to: '#1A5FD4', accent: '#5DDBF5' },
              featured: fallback?.featured,
            }
            const Icon = visual.icon
            const tone = visual.tone

            return (
              <Link
                key={f.id}
                href={`/frameworks/${f.slug}`}
                className="group relative flex flex-col overflow-hidden rounded-2xl bg-white transition-all hover:-translate-y-0.5"
                style={{
                  border: '1px solid rgba(255,255,255,0.10)',
                  boxShadow: '0 4px 20px rgba(15,30,58,0.18)',
                }}
              >
                {/* Poster hero (image + tonal gradient + overlaid headline) */}
                <div className="relative aspect-[16/11] overflow-hidden">
                  {/* Photo backdrop */}
                  <div
                    className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                    aria-hidden="true"
                    style={{
                      backgroundImage: `url(${f.ogImageUrl || `/frameworks/${f.slug}.jpg`})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                  {/* Tonal lift — strong gradient bottom→top so the title pops */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    aria-hidden="true"
                    style={{
                      background: `linear-gradient(180deg, ${tone.from}66 0%, ${tone.from}DD 70%, ${tone.from} 100%)`,
                    }}
                  />
                  {/* Accent corner glow */}
                  <div
                    className="absolute -top-10 -right-10 h-40 w-40 rounded-full pointer-events-none"
                    aria-hidden="true"
                    style={{ background: `radial-gradient(circle, ${tone.accent}40 0%, transparent 70%)` }}
                  />
                  {/* Top row: agent label + Beliebt */}
                  <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.14)',
                        color: '#FFFFFF',
                        border: '1px solid rgba(255,255,255,0.20)',
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      <Sparkles size={9} /> {visual.agentLabel}
                    </span>
                    {visual.featured && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
                        style={{ backgroundColor: '#FFFFFF', color: tone.from }}
                      >
                        ★ Beliebt
                      </span>
                    )}
                  </div>
                  {/* Poster title — bottom-left */}
                  <div className="absolute bottom-5 left-5 right-5">
                    <h3
                      className="font-bold leading-[0.95] tracking-tight whitespace-pre-line"
                      style={{
                        color: '#FFFFFF',
                        fontSize: visual.featured ? '28px' : '24px',
                        textShadow: '0 2px 14px rgba(0,0,0,0.35)',
                      }}
                    >
                      {visual.posterTitle}
                    </h3>
                    {visual.posterSub && (
                      <p
                        className="mt-2 text-xs font-semibold uppercase tracking-[0.18em]"
                        style={{ color: tone.accent }}
                      >
                        {visual.posterSub}
                      </p>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="relative flex flex-col flex-1 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${tone.from}10`, color: tone.from }}
                    >
                      <Icon size={16} />
                    </div>
                    {visual.tagline && (
                      <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: tone.from }}>
                        {visual.tagline}
                      </span>
                    )}
                  </div>
                  {f.metaDescription && (
                    <p className="text-sm leading-relaxed flex-1 line-clamp-3" style={{ color: '#374151' }}>
                      {f.metaDescription}
                    </p>
                  )}
                  <div
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold"
                    style={{ color: tone.from }}
                  >
                    Pack's an
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Footer */}
        {frameworks.length >= 7 ? (
          <div className="mt-12 text-center">
            <Link
              href="/frameworks"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'white', color: '#0F1E3A' }}
            >
              <Zap size={14} />
              Alle Frameworks ansehen
            </Link>
          </div>
        ) : (
          <p className="mt-10 text-center text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>
            Mehr Frameworks rollen wöchentlich aus. Mit jedem ein neuer AI-Agent.
          </p>
        )}
      </div>
    </section>
  )
}
