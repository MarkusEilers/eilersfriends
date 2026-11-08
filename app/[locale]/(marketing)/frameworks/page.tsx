import type { Metadata } from 'next'
import Link from 'next/link'
import { db } from '@/lib/db'
import { landingPages } from '@/lib/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import {
  ArrowRight, Sparkles, MessageSquareText, Target, Wand2, Radar,
  Lightbulb, GitBranch, FileText, BookOpen, FileDown, Video, ClipboardList,
} from 'lucide-react'
import { ensureCardMetaColumn, type CardMeta } from '@/lib/db/queries/framework-meta'
import { resolveFrameworkMeta } from '@/lib/db/queries/framework-meta-i18n'
import { HOME_CSS } from '@/components/lp/story/home-assets'
import { HeroBackdrop } from '@/components/lp/story/HeroBackdrop'

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
    posterSub: 'Kunden im ersten Gespräch gewinnen',
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
  title: 'Kostenlose Frameworks für B2B-Vertrieb & Führung · Eilers+Friends',
  description:
    'Praxiserprobte Baupläne für B2B-Vertrieb, Angebote und Führung: Beef Radar, Instant Influence, B2B-Angebote und mehr. Jedes Framework kostenlos — direkt anwendbar.',
}

interface PageProps {
  params: Promise<{ locale: string }>
}

/** Bilder im Stil der Seiten (S/W mit Blau-Akzent) */
const CARD_IMAGES: Record<string, string> = {
  'b2b-angebote': '/heroes/fw-angebote.jpg',
  'instant-influence': '/heroes/fw-influence.jpg',
  'beef-radar': '/heroes/fw-beef.jpg',
  'recommendation-pitch': '/heroes/fw-pitch.jpg',
}

const TX = {
  de: { eyebrow: 'Bibliothek · kostenlos', h1a: 'Klau unsere', h1b: 'Frameworks.', lead: 'Praxiserprobte Baupläne für B2B-Vertrieb, Leadership und Wachstum. Jeder kostenlos als PDF — direkt anwendbar. Jedes Framework kommt mit Bauplan + den AI-Agenten, die wir dafür gebaut haben.', count: 'Baupläne', popular: 'Beliebt', cta: 'Hol Dir den Bauplan', soon: 'Bald verfügbar.', note: 'Jeder Bauplan ist kostenlos. E-Mail rein → PDF + AI-Agent direkt in den Posteingang. Kein Spam, 1× pro Woche der SalesMade-Newsletter — Abmeldung mit einem Klick.', alt: 'Ein Team arbeitet an einem Whiteboard' },
  en: { eyebrow: 'Library · free', h1a: 'Steal our', h1b: 'frameworks.', lead: 'Field-tested blueprints for B2B sales, leadership and growth. Each one free as a PDF — ready to use. Every framework comes with the blueprint + the AI agents we built for it.', count: 'blueprints', popular: 'Popular', cta: 'Get the blueprint', soon: 'Coming soon.', note: 'Every blueprint is free. Email in → PDF + AI agent straight to your inbox. No spam, the SalesMade newsletter once a week — unsubscribe with one click.', alt: 'A team working at a whiteboard' },
  es: { eyebrow: 'Biblioteca · gratis', h1a: 'Roba nuestros', h1b: 'frameworks.', lead: 'Planos probados en la práctica para ventas B2B, liderazgo y crecimiento. Cada uno gratis en PDF, listo para usar. Cada framework incluye el plano + los agentes de IA que creamos para él.', count: 'planos', popular: 'Popular', cta: 'Consigue el plano', soon: 'Próximamente.', note: 'Cada plano es gratis. Tu email → PDF + agente de IA directo a tu bandeja. Sin spam, la newsletter de SalesMade una vez por semana — date de baja con un clic.', alt: 'Un equipo trabajando en una pizarra' },
} as const

export default async function FrameworksIndex({ params }: PageProps) {
  const { locale } = await params
  const t = TX[(locale as keyof typeof TX)] ?? TX.de

  let frameworks: (typeof landingPages.$inferSelect)[] = []
  try {
    await ensureCardMetaColumn()
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

  const resolvedMetas: Record<string, Awaited<ReturnType<typeof resolveFrameworkMeta>>> = {}
  await Promise.all(sorted.map(async (f) => {
    resolvedMetas[f.slug] = await resolveFrameworkMeta(f.slug, f.cardMeta as CardMeta | null)
  }))
  const ICON_LOOKUP = { FileDown, Video, ClipboardList, Wand2, BookOpen, Sparkles }

  return (
    <main className="hm">
      <style href="home-css" precedence="default">{HOME_CSS}</style>

      {/* Hero */}
      <section className="efh" style={{ padding: 'clamp(56px,7vw,96px) clamp(20px,6vw,96px)' }}>
        <HeroBackdrop src="/heroes/fw-beef.jpg" label={t.alt} />
        <div className="wrap">
          <div className="efh-copy" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <span className="mono">{t.eyebrow}{sorted.length ? ` · ${sorted.length} ${t.count}` : ''}</span>
            <h1 style={{ margin: 0, fontSize: 'clamp(48px,6vw,96px)', fontWeight: 600, letterSpacing: '-.05em', lineHeight: 0.95 }}>
              {t.h1a} <span style={{ color: '#1A5FD4' }}>{t.h1b}</span>
            </h1>
            <p className="lead" style={{ maxWidth: 560 }}>{t.lead}</p>
          </div>
        </div>
      </section>

      {/* Karten */}
      <section className="sec sand" style={{ paddingTop: 'clamp(48px,6vw,80px)' }}>
        <div className="wrap">
          {sorted.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: 'center' }}><p className="body" style={{ margin: 0 }}>{t.soon}</p></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 }}>
              {sorted.map((f) => {
                const fallback = SLUG_VISUALS[f.slug]
                const dbMeta = resolvedMetas[f.slug]
                const dbDeliverables = (dbMeta.deliverables ?? []).map((d) => ({
                  icon: (ICON_LOOKUP[d.icon as keyof typeof ICON_LOOKUP] ?? BookOpen) as typeof BookOpen,
                  label: d.label,
                }))
                const deliverables = dbDeliverables.length > 0 ? dbDeliverables : fallback?.deliverables ?? []
                const agentLabel = dbMeta.agentLabel ?? fallback?.agentLabel ?? 'Bauplan'
                const cardTitle = f.title.split(' — ')[0].split(' - ')[0]
                const posterSub = dbMeta.posterSubtitle ?? fallback?.posterSub ?? ''
                const img = CARD_IMAGES[f.slug] ?? f.ogImageUrl ?? `/frameworks/${f.slug}.jpg`
                return (
                  <Link key={f.id} href={`/frameworks/${f.slug}`} className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', textDecoration: 'none', color: '#0D0D0B' }}>
                    <div style={{ position: 'relative', aspectRatio: '16/9', background: `#D8D1C7 url(${img}) 70% center/cover` }}>
                      <span className="chip" style={{ position: 'absolute', left: 14, top: 14, background: 'rgba(255,255,255,.92)', color: '#124293', fontSize: 11, padding: '5px 10px' }}>
                        <Sparkles size={10} style={{ marginRight: 5 }} /> {agentLabel}
                      </span>
                      {fallback?.featured && (
                        <span className="chip" style={{ position: 'absolute', right: 14, top: 14, background: '#1A5FD4', color: '#fff', fontSize: 11, padding: '5px 10px' }}>★ {t.popular}</span>
                      )}
                    </div>
                    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                      <span style={{ fontSize: 'clamp(24px,2.2vw,30px)', fontWeight: 600, letterSpacing: '-.03em', lineHeight: 1.08, textTransform: 'none' }}>
                        {cardTitle}
                      </span>
                      {posterSub && <span className="mono" style={{ color: '#1A5FD4' }}>{posterSub}</span>}
                      {(dbMeta.metaDescription ?? f.metaDescription) && (
                        <p className="body" style={{ margin: 0 }}>{dbMeta.metaDescription ?? f.metaDescription}</p>
                      )}
                      {deliverables.length > 0 && (
                        <ul style={{ listStyle: 'none', margin: '4px 0 0', padding: '14px 0 0', borderTop: '1px solid #E8E2D9', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {deliverables.map((d, i) => {
                            const DIcon = d.icon
                            return (
                              <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, lineHeight: 1.45, color: '#4A4642' }}>
                                <DIcon size={15} style={{ marginTop: 2, flex: 'none', color: '#1A5FD4' }} />
                                <span>{d.label}</span>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                      <span style={{ marginTop: 'auto', paddingTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 600, color: '#1A5FD4' }}>
                        {t.cta} <ArrowRight size={15} />
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
          <p className="mono" style={{ marginTop: 40, maxWidth: 760, lineHeight: 1.7, textTransform: 'none', letterSpacing: '.01em', fontSize: 13 }}>{t.note}</p>
        </div>
      </section>
    </main>
  )
}
