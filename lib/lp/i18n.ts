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
  // Story-Bausteine (Squeeze/Checkout im Stories-Design)
  for (const v of ["story_topnav", "story_hero_optin", "story_logos", "story_findings", "story_tiles", "story_quote_author", "story_optin_close", "story_checkout_vsl", "story_bento_offer", "story_dark_band", "story_faq", "story_mobile_cta", "story_html", "story_system"]) {
    await db.execute(sql.raw(`ALTER TYPE landing_page_section_type ADD VALUE IF NOT EXISTS '${v}'`))
  }
  // Versionsstand: wann der Grundtext zuletzt geändert wurde, wann je Sprache zuletzt übersetzt.
  // Übersetzung gilt als veraltet, sobald der Grundtext danach geändert wurde.
  await db.execute(sql`ALTER TABLE landing_page_sections ADD COLUMN IF NOT EXISTS content_changed_at TIMESTAMPTZ NOT NULL DEFAULT now()`)
  await db.execute(sql`ALTER TABLE landing_page_sections ADD COLUMN IF NOT EXISTS i18n_changed_at JSONB NOT NULL DEFAULT '{}'::jsonb`)
  ready = true
}

export { overlay, localize, translatable } from './overlay'

/** content_i18n je Sektion einer Seite (Drizzle kennt die Spalte nicht). */
export async function sectionI18n(landingPageId: string): Promise<Map<string, Record<string, unknown>>> {
  await ensureLpI18n()
  const rows = (await db.execute(sql`SELECT id, content_i18n FROM landing_page_sections WHERE landing_page_id=${landingPageId}`)) as unknown as { id: string; content_i18n: Record<string, unknown> }[]
  return new Map(rows.map((r) => [r.id, r.content_i18n ?? {}]))
}

