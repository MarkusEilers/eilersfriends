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
 *   1) lib/i18n/messages/<locale>.json :: frameworks.<slug>  (i18n source of truth)
 *   2) DB landing_pages.card_meta                            (admin-edited override)
 *   3) DEFAULT_CARD_META in framework-meta.ts                (hardcoded fallback)
 */
export async function resolveFrameworkMeta(
  slug: string,
  dbMeta: CardMeta | null,
): Promise<ResolvedFrameworkMeta> {
  const locale = await getLocale()
  const fromMessages = MESSAGE_FRAMEWORKS[locale]?.[slug] ?? MESSAGE_FRAMEWORKS['de']?.[slug]
  const base = mergedMeta(slug, dbMeta)
  if (!fromMessages) return base

  return {
    ...base,
    posterTitle: (fromMessages.posterTitle as string) ?? base.posterTitle,
    posterSubtitle: (fromMessages.posterSubtitle as string) ?? base.posterSubtitle,
    tagline: (fromMessages.tagline as string) ?? base.tagline,
    agentLabel: (fromMessages.agentLabel as string) ?? base.agentLabel,
    deliverables: (fromMessages.deliverables as Deliverable[]) ?? base.deliverables,
    title: fromMessages.title as string | undefined,
    metaDescription: fromMessages.metaDescription as string | undefined,
  }
}
