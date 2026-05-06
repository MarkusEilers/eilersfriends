import { db } from '@/lib/db'
import { landingPages } from '@/lib/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import Link from 'next/link'
import {
  ArrowRight, Bot, Sparkles, Wand2, Radar, MessageSquareText,
  GitBranch, Lightbulb, Target, FileText, BookOpen, Zap,
} from 'lucide-react'
import { FrameworkArt } from '@/components/blocks/FrameworkArt'

/**
 * Per-slug visual config: icon, AI-Agent label, optional tagline,
 * and Bento-grid `colSpan` (out of 6 cols on desktop).
 *
 * The two FEATURED frameworks ('instant-influence' and 'b2b-angebote') get
 * 4-col cards (2/3 of the row); the rest are 2-col (1/3 of the row).
 */
const SLUG_VISUALS: Record<
  string,
  { icon: typeof BookOpen; agentLabel: string; tagline?: string; colSpan: number; featured?: boolean }
> = {
  // ── Featured ──────────────────────────────────────────────
  'instant-influence': {
    icon: MessageSquareText,
    agentLabel: 'Discovery-Call AI',
    tagline: 'Generator + Notes-AI',
    colSpan: 4,
    featured: true,
  },
  'b2b-angebote': {
    icon: Target,
    agentLabel: 'PDF + Video',
    tagline: '8-Schritte-Bauplan',
    colSpan: 4,
    featured: true,
  },
  // ── Normal ────────────────────────────────────────────────
  'hailiom': {
    icon: Wand2,
    agentLabel: '4 GPT Engines',
    tagline: 'Voice · Idea · Atomization · Drafting',
    colSpan: 2,
  },
  'beef-radar': {
    icon: Radar,
    agentLabel: 'Worksheet',
    colSpan: 2,
  },
  'core-messages': {
    icon: Lightbulb,
    agentLabel: '18-Min AI-Worksheet',
    colSpan: 2,
  },
  'strategic-preparation': {
    icon: GitBranch,
    agentLabel: 'Pre-Meeting Checklist',
    colSpan: 2,
  },
  'recommendation-pitch': {
    icon: FileText,
    agentLabel: 'Skript-Vorlage',
    colSpan: 2,
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
    <section className="relative overflow-hidden px-6 py-24" style={{ backgroundColor: '#0A1A2E' }}>
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
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24" style={{ background: 'linear-gradient(180deg, #0F1E3A 0%, transparent 100%)' }} aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16" style={{ background: 'linear-gradient(0deg, #0F1E3A 0%, transparent 100%)' }} aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl">

        {/* Header */}
        <div className="text-center mb-14">
          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-5"
            style={{ backgroundColor: 'rgba(147,184,245,0.15)', color: '#93B8F5', border: '1px solid rgba(147,184,245,0.30)' }}
          >
            <Bot size={12} />
            Pretrained AI-Agenten · Gratis
          </span>
          <h2 className="text-4xl font-bold leading-tight sm:text-5xl text-white">
            Klau dir unsere Frameworks.<br />
            <span style={{ color: '#7AABF7' }}>Inklusive AI-Agenten.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.70)' }}>
            Du brauchst nicht 47 Custom-GPTs basteln. Wir haben sie schon trainiert.
            Jedes Framework kommt mit Bauplan{' '}
            <span className="font-semibold text-white">+ den AI-Agenten</span>,
            die wir dafür gebaut haben. Email rein — Zugang raus.
          </p>
        </div>

        {/* Bento grid: 2 cols mobile / 4 cols tablet / 6 cols desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {sorted.map((f) => {
            const accent = f.accentColor ?? '#1A5FD4'
            const visual = SLUG_VISUALS[f.slug] ?? {
              icon: BookOpen, agentLabel: 'Bauplan', colSpan: 2,
            }
            const Icon = visual.icon

            // Map colSpan to Tailwind classes
            const spanClass =
              visual.colSpan === 4 ? 'col-span-2 sm:col-span-4 lg:col-span-4'
              : 'col-span-2 lg:col-span-2'

            const minH = visual.featured ? 'min-h-[320px] sm:min-h-[360px]' : 'min-h-[260px]'

            return (
              <Link
                key={f.id}
                href={`/frameworks/${f.slug}`}
                className={`group relative flex flex-col overflow-hidden rounded-2xl bg-white p-6 transition-all hover:-translate-y-0.5 ${spanClass} ${minH}`}
                style={{
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 1px 2px rgba(15,30,58,0.04)',
                }}
              >
                {/* Background SVG art */}
                <FrameworkArt slug={f.slug} accent={accent} />

                {/* Subtle gradient overlay so text stays legible */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.55) 60%, rgba(255,255,255,0.10) 100%)',
                  }}
                />

                {/* Content */}
                <div className="relative flex flex-col h-full">
                  <div className="flex items-start justify-between mb-5">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
                      style={{ backgroundColor: 'white', color: accent, border: `1px solid ${accent}30` }}
                    >
                      <Icon size={20} />
                    </div>
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
                      style={{ backgroundColor: '#0F1E3A', color: '#93B8F5' }}
                    >
                      <Sparkles size={9} /> {visual.agentLabel}
                    </span>
                  </div>

                  <h3
                    className={`font-bold leading-snug ${visual.featured ? 'text-2xl' : 'text-lg'}`}
                    style={{ color: '#0D0D0B' }}
                  >
                    {f.title}
                  </h3>

                  {visual.tagline && (
                    <p className="mt-1 text-xs font-semibold" style={{ color: accent }}>
                      {visual.tagline}
                    </p>
                  )}

                  {f.metaDescription && (
                    <p className={`mt-3 text-sm leading-relaxed text-gray-700 flex-1 ${visual.featured ? 'line-clamp-4' : 'line-clamp-3'}`}>
                      {f.metaDescription}
                    </p>
                  )}

                  <div
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold"
                    style={{ color: accent }}
                  >
                    Pack's an
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </div>
                </div>

                {/* Subtle accent line on hover */}
                <div
                  className="absolute inset-x-0 bottom-0 h-[2px] rounded-b-2xl opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ backgroundColor: accent }}
                />
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
