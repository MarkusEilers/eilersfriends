import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

/**
 * Übersetzungs-Einstellung je Seite (Landingpages):
 *  - off:   nicht übersetzen, nicht melden
 *  - check: wöchentlich prüfen und melden, was fehlt oder veraltet ist
 *  - auto:  wöchentlich prüfen und fehlende/veraltete Sektionen automatisch übersetzen
 * Veröffentlichte Seiten stehen ohne Eintrag auf „check“, Entwürfe auf „off“.
 */
export type TranslateMode = 'off' | 'check' | 'auto'
let ready = false
async function ensure() {
  if (ready) return
  await db.execute(sql`CREATE TABLE IF NOT EXISTS page_translation_settings (page_key TEXT PRIMARY KEY, mode TEXT NOT NULL DEFAULT 'check', updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`)
  ready = true
}
type Row = Record<string, unknown>
const rows = (r: unknown) => (Array.isArray(r) ? r : ((r as { rows?: Row[] })?.rows ?? [])) as Row[]

export async function translationModes(): Promise<Map<string, TranslateMode>> {
  await ensure()
  return new Map(rows(await db.execute(sql`SELECT page_key, mode FROM page_translation_settings`)).map((r) => [String(r.page_key), r.mode as TranslateMode]))
}
export async function setTranslationMode(pageKey: string, mode: TranslateMode) {
  await ensure()
  await db.execute(sql`INSERT INTO page_translation_settings (page_key, mode) VALUES (${pageKey}, ${mode}) ON CONFLICT (page_key) DO UPDATE SET mode = excluded.mode, updated_at = now()`)
}
export const defaultMode = (status: string): TranslateMode => (status === 'published' ? 'check' : 'off')
