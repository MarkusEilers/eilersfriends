import type { AskFunnelDef } from './types'
import { BOTTLENECK, BOTTLENECK_BENCHMARKS } from './funnels/bottleneck'

/** Alle Funnels. Neuer Funnel = neue Datei in funnels/ + ein Eintrag hier. Slugs englisch (URL /check/<slug>). */
export const FUNNELS: Record<string, { def: AskFunnelDef; benchmarks: Record<string, { red: number; green: number }> }> = {
  bottleneck: { def: BOTTLENECK, benchmarks: BOTTLENECK_BENCHMARKS },
}

/** Alte Slugs → neue (Weiterleitung) */
export const FUNNEL_ALIASES: Record<string, string> = { engpass: 'bottleneck' }

export function getFunnel(slug: string) {
  return FUNNELS[slug] ?? null
}
