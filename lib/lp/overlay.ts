/** Reine Hilfsfunktionen ohne Datenbank — auch im Browser nutzbar. */

type Json = unknown
/** Übersetzung über den Grundtext legen — Objekte feldweise, Listen elementweise. */
export function overlay(base: Json, tr: Json): Json {
  if (tr === undefined || tr === null || tr === '') return base
  if (Array.isArray(base) && Array.isArray(tr)) return base.map((b, i) => overlay(b, tr[i]))
  if (base && typeof base === 'object' && tr && typeof tr === 'object' && !Array.isArray(base)) {
    const out: Record<string, Json> = { ...(base as Record<string, Json>) }
    for (const [k, v] of Object.entries(tr as Record<string, Json>)) out[k] = overlay((base as Record<string, Json>)[k], v)
    return out
  }
  return typeof base === typeof tr || base === undefined ? tr : base
}

export function localize(content: Record<string, unknown>, i18n: Record<string, unknown> | null | undefined, locale: string) {
  if (!locale || locale === 'de' || !i18n?.[locale]) return content
  return overlay(content, i18n[locale]) as Record<string, unknown>
}

/** Welche Felder übersetzt werden: Texte ja; URLs, Farben, Icons, Schlüssel nicht. */
const SKIP_KEYS = /^(id|key|icon|ctaHref|href|url|photoUrl|imageUrl|videoUrl|src|color|accent|tone|socials|size|format|type)$/i
export function translatable(v: unknown, key = ''): unknown {
  if (SKIP_KEYS.test(key)) return undefined
  if (typeof v === 'string') return /^(https?:|\/|#|mailto:)/.test(v) || v.trim() === '' ? undefined : v
  if (Array.isArray(v)) return v.map((x) => translatable(x))
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) { const t = translatable(x, k); if (t !== undefined) out[k] = t }
    return out
  }
  return undefined
}
