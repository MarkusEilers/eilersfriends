import { getLocale } from 'next-intl/server'
import type { CardMeta, Deliverable } from '@/lib/db/queries/framework-meta'
import { mergedMeta } from '@/lib/db/queries/framework-meta'

import deMessages from '@/lib/i18n/messages/de.json'
import enMessages from '@/lib/i18n/messages/en.json'
import ruMessages from '@/lib/i18n/messages/ru.json'
import esMessages from '@/lib/i18n/messages/es.json'

const MESSAGE_FRAMEWORKS: Record<string, Record<string, Record<string, unknown>>> = {
  de: (deMessages as Record<string, unknown>).frameworks as Record<string, Record<string, unknown>>,
  en: (enMessages as Record<string, unknown>).frameworks as Record<string, Record<string, unknown>>,
  ru: (ruMessages as Record<string, unknown>).frameworks as Record<string, Record<string, unknown>>,
  es: (esMessages as Record<string, unknown>).frameworks as Record<string, Record<string, unknown>>,
}

export type ResolvedFrameworkMeta = CardMeta & { title?: string; metaDescription?: string }

/**
 * Resolve a Framework's display meta in this priority:
 *   1) DB landing_pages.card_meta                            (admin-edited — SIEGT)
 *   2) lib/i18n/messages/<locale>.json :: frameworks.<slug>  (i18n fallback für Lokalisierung)
 *   3) DEFAULT_CARD_META in framework-meta.ts                (hardcoded letzte Rettung)
 *
 * Pro Feld: wenn DB einen non-empty Wert hat → DB. Sonst i18n. Sonst Default.
 * Das ist der "Admin-Edits gewinnen immer"-Garantie, die wir der UI versprechen.
 */
export async function resolveFrameworkMeta(
  slug: string,
  dbMeta: CardMeta | null,
): Promise<ResolvedFrameworkMeta> {
  const locale = await getLocale()
  const fromMessages = MESSAGE_FRAMEWORKS[locale]?.[slug] ?? MESSAGE_FRAMEWORKS['de']?.[slug]
  const merged = mergedMeta(slug, dbMeta)            // DEFAULT × DB

  // Helper: take dbVal if non-empty, else i18nVal, else mergedVal (which has default)
  function pick<T>(dbVal: T | undefined, i18nVal: T | undefined, mergedVal: T | undefined): T | undefined {
    if (dbVal !== undefined && dbVal !== null && dbVal !== '') return dbVal
    if (i18nVal !== undefined && i18nVal !== null) return i18nVal
    return mergedVal
  }

  const db = dbMeta ?? {} as CardMeta
  const i18n = (fromMessages ?? {}) as Record<string, unknown>
  const isDe = locale === 'de'

  // Lokalisierbare Textfelder: Auf DE gewinnt die DB (Admin-Edits siegen).
  // Auf allen anderen Sprachen gewinnt die vorhandene Übersetzung — sonst
  // würde ein auf Deutsch angelegter DB-Wert die EN/ES/RU-Version überschreiben.
  function pickText(dbVal: string | undefined, i18nVal: string | undefined, mergedVal: string | undefined): string | undefined {
    if (!isDe && i18nVal !== undefined && i18nVal !== null && i18nVal !== '') return i18nVal
    return pick<string>(dbVal, i18nVal, mergedVal)
  }

  return {
    ...merged,
    posterTitle:    pickText(db.posterTitle,    i18n.posterTitle    as string | undefined, merged.posterTitle),
    posterSubtitle: pickText(db.posterSubtitle, i18n.posterSubtitle as string | undefined, merged.posterSubtitle),
    tagline:        pickText(db.tagline,        i18n.tagline        as string | undefined, merged.tagline),
    agentLabel:     pickText(db.agentLabel,     i18n.agentLabel     as string | undefined, merged.agentLabel),
    tone:           db.tone ?? merged.tone,
    deliverables:   (db.deliverables && db.deliverables.length > 0)
                      ? db.deliverables
                      : (i18n.deliverables as Deliverable[] | undefined) ?? merged.deliverables,
    title:          (i18n.title          as string | undefined),
    metaDescription:(i18n.metaDescription as string | undefined),
  }
}
