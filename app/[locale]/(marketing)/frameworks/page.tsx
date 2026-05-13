import type { Metadata } from 'next'
import Link from 'next/link'
import { db } from '@/lib/db'
import { landingPages } from '@/lib/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import {
  ArrowRight, Sparkles, MessageSquareText, Target, Wand2, Radar,
  Lightbulb, GitBranch, FileText, BookOpen, FileDown, Video, ClipboardList,
} from 'lucide-react'
import { redirect } from 'next/navigation'

/** Per-slug visual config — mirrors HVCOSection so the design language matches.
 *  But here we have more space: longer body + deliverables list per card. */
const SLUG_VISUALS: Record<
  string,
  {
    icon: typeof BookOpen
    agentLabel: string
    posterTitle: string
    posterSub: string
    tone: { from: string; to: string; accent: string }
    deliverables: { icon: typeof FileDown; label: string }[]
    featured?: boolean
  }
> = {
  'instant-influence': {
    icon: MessageSquareText,
    agentLabel: 'Discovery-Call AI',
    posterTitle: 'INSTANT\nINFLUENCE',
    posterSub: 'Win the first conversation',
    tone: { from: '#0F1E3A', to: '#1A5FD4', accent: '#5DDBF5' },
    deliverables: [
      { icon: FileDown, label: '32-S. PDF: Generator-Template + 3 Notes-AI-Modi' },
      { icon: Video, label: '24-Min Video-Walkthrough: erstes Gespräch live' },
      { icon: ClipboardList, label: 'Bonus: Discovery-Call-Score-Karte' },
    ],
    featured: true,
  },
  'b2b-angebote': {
    icon: Target,
    agentLabel: 'PDF + Video',
    posterTitle: 'UNWIDERSTEHLICHE\nANGEBOTE',
    posterSub: 'Der 8-Schritte-Bauplan',
    tone: { from: '#0F1E3A', to: '#0A2851', accent: '#FFD37A' },
    deliverables: [
      { icon: FileDown, label: '40-S. PDF: 8 Schritte zum unwiderstehlichen Angebot' },
      { icon: Video, label: '47-Min Video-Masterclass von Markus Eilers' },
      { icon: ClipboardList, label: 'Bonus: Angebots-Template als Google-Doc' },
    ],
    featured: true,
  },
  'hailiom': {
    icon: Wand2,
    agentLabel: '4 GPT Engines',
    posterTitle: 'SOCIAL MEDIA\nROCKSTAR',
    posterSub: '9-Schritte AI Content',
    tone: { from: '#1A5FD4', to: '#0F3D8E', accent: '#5DDBF5' },
    deliverables: [
      { icon: FileDown, label: 'Bauplan: 9-Schritte-Content-Prozess' },
      { icon: Wand2, label: '4 GPT Engines: Voice · Idea · Atomization · Drafting' },
      { icon: ClipboardList, label: 'Wochen-Kadenz-Template' },
    ],
  },
  'beef-radar': {
    icon: Radar,
    agentLabel: 'Worksheet',
    posterTitle: 'BEEF\nRADAR',
    posterSub: 'Konflikte sehen, bevor sie ausbrechen',
    tone: { from: '#0F1E3A', to: '#08193D', accent: '#5DDBF5' },
    deliverables: [
      { icon: FileDown, label: 'Worksheet: 7 Signale, die andere übersehen' },
      { icon: ClipboardList, label: 'Diagnose-Karte für Vorstandsgespräche' },
      { icon: Video, label: '12-Min Walk-Through mit echten Beispielen' },
    ],
  },
  'core-messages': {
    icon: Lightbulb,
    agentLabel: '18-Min AI-Worksheet',
    posterTitle: 'CORE 11',
    posterSub: 'Die Botschaften jedes Unternehmers',
    tone: { from: '#1A4DB0', to: '#0F3D8E', accent: '#5DDBF5' },
    deliverables: [
      { icon: FileDown, label: 'Bauplan: Die 11 Kern-Botschaften' },
      { icon: ClipboardList, label: '18-Min AI-Worksheet — Deine 11 finden' },
      { icon: Video, label: 'Beispiel-Set: 11 Botschaften eines SaaS-Founders' },
    ],
  },
  'strategic-preparation': {
    icon: GitBranch,
    agentLabel: 'Pre-Meeting Checklist',
    posterTitle: 'STRATEGIC\nPREP',
    posterSub: '18 Min vor jedem Pitch',
    tone: { from: '#1F2228', to: '#0F1E3A', accent: '#C8A67A' },
    deliverables: [
      { icon: FileDown, label: '8-Schritte-Checklist als PDF + Google-Doc' },
      { icon: Wand2, label: 'GPT Engine: füllt 60 % der Vorbereitung selbst' },
      { icon: ClipboardList, label: 'Beispiel-Prep für einen Series-A-Pitch' },
    ],
  },
  'recommendation-pitch': {
    icon: FileText,
    agentLabel: 'Skript-Vorlage',
    posterTitle: 'RECOMMENDATION\nPITCH',
    posterSub: 'Käufer:in im Driver-Seat',
    tone: { from: '#1A5FD4', to: '#0F66C8', accent: '#FFFFFF' },
    deliverables: [
      { icon: FileDown, label: 'Skript-Vorlage: 5 Recommendation-Muster' },
      { icon: Video, label: '10-Min Coaching-Video: wie es klingt' },
      { icon: ClipboardList, label: 'Konversations-Karte für Live-Gespräche' },
    ],
  },
}

const FEATURED_ORDER = ['instant-influence', 'b2b-angebote']

export const metadata: Metadata = {
  title: 'Frameworks — Eilers+Friends',
  description:
    'Praxiserprobte Bauplaene für B2B-Vertrieb, Leadership und Wachstum. Jeder kostenlos als PDF — direkt anwendbar.',
}

interface PageProps {
  params: Promise<{ locale: string }>
}

export default async function FrameworksIndex({ params }: PageProps) {
  const { locale } = await params
  if (locale !== 'de') redirect('/de/frameworks')

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

  // Sort: featured first (in defined order), then rest by updatedAt
  const sorted = [...frameworks].sort((a, b) => {
    const ai = FEATURED_ORDER.indexOf(a.slug)
    const bi = FEATURED_ORDER.indexOf(b.slug)
    if (ai !== -1 && bi !== -1) return ai - bi
    if (ai !== -1) return -1
    if (bi !== -1) return 1
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>

      {/* Hero */}
      <section className="px-6 py-20" style={{ backgroundColor: '#EBF1FF' }}>
        <div className="mx-auto max-w-3xl text-center">
          <span
            className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4"
            style={{ backgroundColor: 'white', color: '#1A5FD4', border: '1px solid #BBCFF5' }}
          >
            Bibliothek
          </span>
          <h1 className="text-4xl font-bold sm:text-5xl mb-4" style={{ color: '#0D0D0B' }}>
            Frameworks
          </h1>
          <p className="text-lg text-gray-600">
            Praxiserprobte Baupläne für B2B-Vertrieb, Leadership und Wachstum.
            Jeder kostenlos als PDF — direkt anwendbar. Jedes Framework kommt mit
            Bauplan + den AI-Agenten, die wir dafür gebaut haben.
          </p>
        </div>
      </section>

      {/* Bento Grid */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-7xl">
          {sorted.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-16 text-center">
              <BookOpen size={32} className="mx-auto mb-4 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">Bald verfügbar.</p>
              <p className="mt-1 text-xs text-gray-400">
                Die ersten Frameworks gehen demnächst live.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {sorted.map((f) => {
                const visual = SLUG_VISUALS[f.slug] ?? {
                  icon: BookOpen,
                  agentLabel: 'Bauplan',
                  posterTitle: f.title.toUpperCase(),
                  posterSub: '',
                  tone: { from: '#0F1E3A', to: '#1A5FD4', accent: '#5DDBF5' },
                  deliverables: [],
                }
                const Icon = visual.icon
                const tone = visual.tone
                const spanClass = visual.featured ? 'sm:col-span-2 lg:col-span-2' : 'lg:col-span-1'

                return (
                  <Link
                    key={f.id}
                    href={`/frameworks/${f.slug}`}
                    className={`group relative flex flex-col overflow-hidden rounded-2xl bg-white transition-all hover:-translate-y-0.5 ${spanClass}`}
                    style={{
                      border: '1px solid #E5E7EB',
                      boxShadow: visual.featured ? '0 6px 24px rgba(15,30,58,0.10)' : '0 1px 2px rgba(15,30,58,0.04)',
                    }}
                  >
                    {/* Poster hero */}
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <div
                        className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                        aria-hidden="true"
                        style={{
                          backgroundImage: `url(${f.ogImageUrl || `/frameworks/${f.slug}.jpg`})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      />
                      <div
                        className="absolute inset-0 pointer-events-none"
                        aria-hidden="true"
                        style={{
                          background: `linear-gradient(180deg, ${tone.from}66 0%, ${tone.from}DD 70%, ${tone.from} 100%)`,
                        }}
                      />
                      <div
                        className="absolute -top-10 -right-10 h-40 w-40 rounded-full pointer-events-none"
                        aria-hidden="true"
                        style={{ background: `radial-gradient(circle, ${tone.accent}40 0%, transparent 70%)` }}
                      />
                      {/* Top row badges */}
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
                      {/* Poster title */}
                      <div className="absolute bottom-5 left-5 right-5">
                        <h3
                          className="font-bold leading-[0.95] tracking-tight whitespace-pre-line"
                          style={{
                            color: '#FFFFFF',
                            fontSize: visual.featured ? '32px' : '26px',
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

                    {/* Body — more detail than HVCO */}
                    <div className="flex flex-col flex-1 p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-lg"
                          style={{ backgroundColor: `${tone.from}10`, color: tone.from }}
                        >
                          <Icon size={16} />
                        </div>
                        <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: tone.from }}>
                          {f.title.split(' — ')[0] || f.title.split(' - ')[0] || f.title}
                        </span>
                      </div>

                      {f.metaDescription && (
                        <p className="text-sm leading-relaxed text-gray-700 mb-5">
                          {f.metaDescription}
                        </p>
                      )}

                      {/* Deliverables list */}
                      {visual.deliverables.length > 0 && (
                        <ul className="mb-6 space-y-2">
                          {visual.deliverables.map((d, i) => {
                            const DIcon = d.icon
                            return (
                              <li key={i} className="flex items-start gap-2.5 text-xs leading-snug text-gray-600">
                                <DIcon size={14} className="mt-0.5 flex-shrink-0" style={{ color: tone.from }} />
                                <span>{d.label}</span>
                              </li>
                            )
                          })}
                        </ul>
                      )}

                      <div className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: tone.from }}>
                        Hol dir den Bauplan
                        <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Footer reassurance */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-3xl">
          <div
            className="rounded-2xl px-6 py-5 text-center text-sm"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #BBCFF5', color: '#374151' }}
          >
            Jeder Bauplan ist kostenlos. Email rein → PDF + AI-Agent direkt in den Posteingang.
            Kein Spam, 1× pro Woche der SalesMade-Newsletter — Abmeldung mit einem Klick.
          </div>
        </div>
      </section>

    </main>
  )
}
