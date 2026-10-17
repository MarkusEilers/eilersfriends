import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

/**
 * Übersetzungen im Landingpage-System.
 *
 * Deutsch ist der Grundtext (content). Je Sprache liegt eine Übersetzung in
 * content_i18n[locale] — vollständig oder teilweise. Beim Rendern wird die
 * Übersetzung über den Grundtext gelegt; was fehlt, bleibt deutsch. So kann
 * eine Seite live gehen, bevor jede Sprache fertig ist.
 */

export const LP_LOCALES = ['de', 'en', 'es'] as const

let ready = false
export async function ensureLpI18n() {
  if (ready) return
  await db.execute(sql`ALTER TABLE landing_page_sections ADD COLUMN IF NOT EXISTS content_i18n JSONB NOT NULL DEFAULT '{}'::jsonb`)
  // Eigener Sektionstyp für eingebettete Werkzeuge (Gesprächs-Check)
  await db.execute(sql`ALTER TYPE landing_page_section_type ADD VALUE IF NOT EXISTS 'call_check'`)
  ready = true
}

export { overlay, localize, translatable } from './overlay'

/** content_i18n je Sektion einer Seite (Drizzle kennt die Spalte nicht). */
export async function sectionI18n(landingPageId: string): Promise<Map<string, Record<string, unknown>>> {
  await ensureLpI18n()
  const rows = (await db.execute(sql`SELECT id, content_i18n FROM landing_page_sections WHERE landing_page_id=${landingPageId}`)) as unknown as { id: string; content_i18n: Record<string, unknown> }[]
  return new Map(rows.map((r) => [r.id, r.content_i18n ?? {}]))
}

