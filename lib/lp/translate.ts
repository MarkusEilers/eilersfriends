import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { callModel } from '@/lib/ai/call'
import { ensureLpI18n, translatable } from './i18n'

/**
 * Übersetzen und Versionsstand im Landingpage-System.
 * Eine Sektion ist je Sprache: „fehlt“ (keine Übersetzung), „veraltet“ (Grundtext nach
 * der Übersetzung geändert) oder „aktuell“.
 */
export type TrLang = 'en' | 'es'
export const TR_LANGS: TrLang[] = ['en', 'es']
const LANG_NAME: Record<TrLang, string> = { en: 'English', es: 'Spanish (neutral, for business readers)' }

type Row = Record<string, unknown>
const rows = (r: unknown) => (Array.isArray(r) ? r : ((r as { rows?: Row[] })?.rows ?? [])) as Row[]

export interface SectionState { id: string; type: string; state: Record<TrLang, 'ok' | 'missing' | 'stale' | 'empty'> }

export async function sectionStates(pageId: string): Promise<SectionState[]> {
  await ensureLpI18n()
  const r = rows(await db.execute(sql`SELECT id, type, content, content_i18n, content_changed_at, i18n_changed_at FROM landing_page_sections WHERE landing_page_id = ${pageId} AND is_visible ORDER BY "order"`))
  return r.map((x) => {
    const src = translatable(x.content as Record<string, unknown>)
    const empty = !src || (typeof src === 'object' && !Object.keys(src as object).length)
    const tr = (x.content_i18n ?? {}) as Record<string, unknown>
    const at = (x.i18n_changed_at ?? {}) as Record<string, string>
    const changed = new Date(String(x.content_changed_at)).getTime()
    const state = {} as SectionState['state']
    for (const l of TR_LANGS) {
      const has = tr[l] && typeof tr[l] === 'object' && Object.keys(tr[l] as object).length > 0
      state[l] = empty ? 'empty' : !has ? 'missing' : at[l] && new Date(at[l]).getTime() + 1000 < changed ? 'stale' : 'ok'
    }
    return { id: String(x.id), type: String(x.type), state }
  })
}

/** Eine Sektion übersetzen (Texte, auch HTML-Sektionen). Gibt die Übersetzung zurück. */
export async function translateContent(content: Record<string, unknown>, lang: TrLang): Promise<Record<string, unknown> | null> {
  const src = translatable(content)
  if (!src || (typeof src === 'object' && !Object.keys(src as object).length)) return null
  const res = await callModel({
    model: process.env.LP_TRANSLATE_MODEL || 'gpt-4.1',
    temperature: 0.2,
    anlass: { agentKey: 'lp-translate', stepKey: lang },
    system: `You translate German B2B landing page copy into ${LANG_NAME[lang]}. Keep the JSON structure and keys exactly. Translate only the string values. Some values contain HTML: keep every tag, attribute, class, inline style, URL and entity exactly as it is and translate only the visible text (and alt/aria-label/title/placeholder values). Keep {placeholders} and | separators. Keep the tone: direct, concrete, no hype, no marketing clichés. Keep informal address (German "Du/Ihr" → English "you"; Spanish "tú"). Keep product and framework names (SalesMade, SalesMade Academy, Mystery Shopping, Beef Radar, Instant Influence, Gesprächs-Check → "Call Check" in English, "Análisis de conversación" in Spanish). Return only the JSON.`,
    user: JSON.stringify(src),
  })
  const val = (res.value ?? null) as Record<string, unknown> | null
  return val && typeof val === 'object' ? val : null
}

export async function storeTranslation(sectionId: string, lang: string, val: Record<string, unknown> | null) {
  await ensureLpI18n()
  if (val === null) {
    await db.execute(sql`UPDATE landing_page_sections SET content_i18n = content_i18n - ${lang}, i18n_changed_at = i18n_changed_at - ${lang}, updated_at = now() WHERE id = ${sectionId}`)
    return
  }
  await db.execute(sql`UPDATE landing_page_sections SET
      content_i18n = jsonb_set(COALESCE(content_i18n, '{}'::jsonb), ${'{' + lang + '}'}::text[], ${JSON.stringify(val)}::jsonb),
      i18n_changed_at = jsonb_set(COALESCE(i18n_changed_at, '{}'::jsonb), ${'{' + lang + '}'}::text[], to_jsonb(now()::text)),
      updated_at = now()
    WHERE id = ${sectionId}`)
}

/** Fehlende und veraltete Sektionen einer Seite übersetzen (overwrite: alle). */
export async function translateStale(pageId: string, langs: TrLang[] = TR_LANGS, overwrite = false): Promise<{ translated: number; failed: number; sections: Record<string, Record<string, Record<string, unknown>>> }> {
  const states = await sectionStates(pageId)
  const content = new Map(rows(await db.execute(sql`SELECT id, content FROM landing_page_sections WHERE landing_page_id = ${pageId}`)).map((x) => [String(x.id), x.content as Record<string, unknown>]))
  let translated = 0, failed = 0
  const sections: Record<string, Record<string, Record<string, unknown>>> = {}
  for (const s of states) {
    for (const l of langs) {
      const st = s.state[l]
      if (st === 'empty' || (st === 'ok' && !overwrite)) continue
      const val = await translateContent(content.get(s.id) ?? {}, l).catch(() => null)
      if (!val) { failed++; continue }
      await storeTranslation(s.id, l, val)
      ;(sections[s.id] ??= {})[l] = val
      translated++
    }
  }
  return { translated, failed, sections }
}
