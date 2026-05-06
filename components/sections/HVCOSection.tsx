import { db } from '@/lib/db'
import { landingPages } from '@/lib/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import Link from 'next/link'
import {
  ArrowRight, Bot, Sparkles, Wand2, Radar, MessageSquareText,
  GitBranch, Lightbulb, Target, FileText, BookOpen, Zap,
} from 'lucide-react'

/**
 * Per-slug visual mapping. Each framework gets its own icon, so the row
 * visually breaks the "wall of identical book icons".
 * Falls back to BookOpen for unknown slugs.
 */
const SLUG_VISUALS: Record<
  string,
  { icon: typeof BookOpen; agentLabel: string; tagline?: string }
> = {
  'hailiom': {
    icon: Wand2,
    agentLabel: '4 GPT Engines',
    tagline: 'Voice · Idea · Atomization · Drafting',
  },
  'b2b-angebote': {
    icon: Target,
    agentLabel: 'PDF + Video',
  },
  'instant-influence': {
    icon: MessageSquareText,
    agentLabel: 'Discovery-Call AI',
    tagline: 'Generator + Notes-AI',
  },
  'beef-radar': {
    icon: Radar,
    agentLabel: 'Worksheet',
  },
  'core-messages': {
    icon: Lightbulb,
    agentLabel: '18-Min AI-Worksheet',
  },
  'strategic-preparation': {
    icon: GitBranch,
    agentLabel: 'Pre-Meeting Checklist',
  },
  'recommendation-pitch': {
    icon: FileText,
    agentLabel: 'Skript-Vorlage',
  },
}

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
      .limit(6)
  } catch (_) {}

  if (frameworks.length === 0) return null

  return (
    <section className="bg-white px-6 py-20">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="text-center mb-14">
          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-5"
            style={{ backgroundColor: '#0F1E3A', color: '#93B8F5' }}
          >
            <Bot size={12} />
            Pretrained AI-Agenten · Gratis
          </span>
          <h2 className="text-4xl font-bold leading-tight sm:text-5xl" style={{ color: '#0D0D0B' }}>
            Klau dir unsere Frameworks.<br />
            <span style={{ color: '#1A5FD4' }}>Inklusive AI-Agenten.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-gray-600">
            Du brauchst nicht 47 Custom-GPTs basteln. Wir haben sie schon trainiert.
            Jedes Framework kommt mit Bauplan{' '}
            <span className="font-semibold" style={{ color: '#0D0D0B' }}>+ den AI-Agenten</span>,
            die wir dafür gebaut haben. Email rein — Zugang raus.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {frameworks.map((f, i) => {
            const accent = f.accentColor ?? '#1A5FD4'
            const accentBg = accent === '#D4192B' ? '#FFEBEC' : '#EBF1FF'
            const visual = SLUG_VISUALS[f.slug] ?? {
              icon: BookOpen,
              agentLabel: 'Bauplan',
            }
            const Icon = visual.icon

            return (
              <Link
                key={f.id}
                href={`/frameworks/${f.slug}`}
                className="group relative flex flex-col rounded-2xl bg-white p-6 transition-all hover:-translate-y-0.5"
                style={{
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 1px 2px rgba(15,30,58,0.04)',
                }}
              >
                {/* Top row: icon + AI-Agent badge */}
                <div className="flex items-start justify-between mb-5">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
                    style={{ backgroundColor: accentBg, color: accent }}
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

                {/* Title */}
                <h3 className="text-lg font-bold leading-snug" style={{ color: '#0D0D0B' }}>
                  {f.title}
                </h3>

                {/* Tagline (optional, e.g. tool components) */}
                {visual.tagline && (
                  <p className="mt-1 text-xs font-medium" style={{ color: accent }}>
                    {visual.tagline}
                  </p>
                )}

                {/* Description */}
                {f.metaDescription && (
                  <p className="mt-3 text-sm leading-relaxed text-gray-600 line-clamp-3 flex-1">
                    {f.metaDescription}
                  </p>
                )}

                {/* CTA */}
                <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: accent }}>
                  Pack's an
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
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
        {frameworks.length >= 6 ? (
          <div className="mt-12 text-center">
            <Link
              href="/frameworks"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#0F1E3A' }}
            >
              <Zap size={14} />
              Alle Frameworks ansehen
            </Link>
          </div>
        ) : (
          <p className="mt-10 text-center text-xs text-gray-400">
            Mehr Frameworks rollen wöchentlich aus. Mit jedem ein neuer AI-Agent.
          </p>
        )}
      </div>
    </section>
  )
}
