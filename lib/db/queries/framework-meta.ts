import { db } from '@/lib/db'
import { landingPages } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'

/**
 * Framework Card Meta — DB-backed config that drives the poster cards
 * on the homepage (HVCOSection) and the /frameworks listing page.
 *
 * Source of truth is the `card_meta` json column on landing_pages.
 * Hardcoded DEFAULTS live below as fallback so the site never goes
 * blank if a row hasn't been edited yet.
 *
 * Self-healing: ensures the column exists on every read/write.
 */

export interface Deliverable {
  /** Lucide icon name from a small allowlist — rendered by FrameworkCardBody. */
  icon: 'FileDown' | 'Video' | 'ClipboardList' | 'Wand2' | 'BookOpen' | 'Sparkles'
  label: string
}

export interface CardMeta {
  posterTitle?: string
  posterSubtitle?: string
  tagline?: string
  agentLabel?: string
  tone?: { from: string; to: string; accent: string }
  deliverables?: Deliverable[]
  heroImageUrl?: string
}

let columnEnsured = false
async function ensureColumn() {
  if (columnEnsured) return
  try {
    await db.execute(sql`ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS card_meta json`)
    columnEnsured = true
  } catch (err) {
    console.error('[framework-meta] ensureColumn failed', err)
  }
}

/** Hardcoded defaults — used as fallback when DB row has no cardMeta yet. */
export const DEFAULT_CARD_META: Record<string, CardMeta> = {
  'instant-influence': {
    posterTitle: 'INSTANT\nINFLUENCE',
    posterSubtitle: 'Win the first conversation',
    tagline: 'Generator + Notes-AI',
    agentLabel: 'Discovery-Call AI',
    tone: { from: '#0F1E3A', to: '#1A5FD4', accent: '#5DDBF5' },
    deliverables: [
      { icon: 'FileDown', label: '32-S. PDF: Generator-Template + 3 Notes-AI-Modi' },
      { icon: 'Video', label: '24-Min Video-Walkthrough: erstes Gespräch live' },
      { icon: 'ClipboardList', label: 'Bonus: Discovery-Call-Score-Karte' },
    ],
  },
  'b2b-angebote': {
    posterTitle: 'UNWIDERSTEHLICHE\nANGEBOTE',
    posterSubtitle: 'Der 8-Schritte-Bauplan',
    tagline: '8-Schritte-Bauplan',
    agentLabel: 'PDF + Video',
    tone: { from: '#0F1E3A', to: '#0A2851', accent: '#FFD37A' },
    deliverables: [
      { icon: 'FileDown', label: '40-S. PDF: 8 Schritte zum unwiderstehlichen Angebot' },
      { icon: 'Video', label: '47-Min Video-Masterclass von Markus Eilers' },
      { icon: 'ClipboardList', label: 'Bonus: Angebots-Template als Google-Doc' },
    ],
  },
  'hailiom': {
    posterTitle: 'SOCIAL MEDIA\nROCKSTAR',
    posterSubtitle: '9-Schritte AI Content',
    tagline: 'Voice · Idea · Atomization · Drafting',
    agentLabel: '4 GPT Engines',
    tone: { from: '#1A5FD4', to: '#0F3D8E', accent: '#5DDBF5' },
    deliverables: [
      { icon: 'FileDown', label: 'Bauplan: 9-Schritte-Content-Prozess' },
      { icon: 'Wand2', label: '4 GPT Engines: Voice · Idea · Atomization · Drafting' },
      { icon: 'ClipboardList', label: 'Wochen-Kadenz-Template' },
    ],
  },
  'beef-radar': {
    posterTitle: 'BEEF\nRADAR',
    posterSubtitle: 'Konflikte sehen, bevor sie ausbrechen',
    tagline: 'Konflikt-Diagnose',
    agentLabel: 'Worksheet',
    tone: { from: '#0F1E3A', to: '#08193D', accent: '#5DDBF5' },
    deliverables: [
      { icon: 'FileDown', label: 'Worksheet: 7 Signale, die andere übersehen' },
      { icon: 'ClipboardList', label: 'Diagnose-Karte für Vorstandsgespräche' },
      { icon: 'Video', label: '12-Min Walk-Through mit echten Beispielen' },
    ],
  },
  'core-messages': {
    posterTitle: 'CORE 11',
    posterSubtitle: 'Die Botschaften jedes Unternehmers',
    tagline: 'Die 11 Botschaften',
    agentLabel: '18-Min AI-Worksheet',
    tone: { from: '#1A4DB0', to: '#0F3D8E', accent: '#5DDBF5' },
    deliverables: [
      { icon: 'FileDown', label: 'Bauplan: Die 11 Kern-Botschaften' },
      { icon: 'ClipboardList', label: '18-Min AI-Worksheet — Deine 11 finden' },
      { icon: 'Video', label: 'Beispiel-Set: 11 Botschaften eines SaaS-Founders' },
    ],
  },
  'strategic-preparation': {
    posterTitle: 'STRATEGIC\nPREP',
    posterSubtitle: '18 Min vor jedem Pitch',
    tagline: 'Vor dem wichtigen Gespräch',
    agentLabel: 'Pre-Meeting Checklist',
    tone: { from: '#1F2228', to: '#0F1E3A', accent: '#C8A67A' },
    deliverables: [
      { icon: 'FileDown', label: '8-Schritte-Checklist als PDF + Google-Doc' },
      { icon: 'Wand2', label: 'GPT Engine: füllt 60 % der Vorbereitung selbst' },
      { icon: 'ClipboardList', label: 'Beispiel-Prep für einen Series-A-Pitch' },
    ],
  },
  'recommendation-pitch': {
    posterTitle: 'RECOMMENDATION\nPITCH',
    posterSubtitle: 'Käufer:in im Driver-Seat',
    tagline: 'Verkaufen ohne zu verkaufen',
    agentLabel: 'Skript-Vorlage',
    tone: { from: '#1A5FD4', to: '#0F66C8', accent: '#FFFFFF' },
    deliverables: [
      { icon: 'FileDown', label: 'Skript-Vorlage: 5 Recommendation-Muster' },
      { icon: 'Video', label: '10-Min Coaching-Video: wie es klingt' },
      { icon: 'ClipboardList', label: 'Konversations-Karte für Live-Gespräche' },
    ],
  },
}

/** Get card meta for a slug — DB value merged with hardcoded default. */
export function mergedMeta(slug: string, dbMeta: CardMeta | null | undefined): CardMeta {
  const fallback = DEFAULT_CARD_META[slug] ?? {}
  return { ...fallback, ...(dbMeta ?? {}) }
}

export async function getCardMeta(slug: string, dbMeta?: CardMeta | null): Promise<CardMeta> {
  await ensureColumn()
  return mergedMeta(slug, dbMeta)
}

export async function updateCardMeta(slug: string, meta: CardMeta): Promise<void> {
  await ensureColumn()
  await db.update(landingPages)
    .set({ cardMeta: meta, updatedAt: new Date() })
    .where(eq(landingPages.slug, slug))
}
