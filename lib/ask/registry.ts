import type { AskFunnelDef } from './types'
import { ENGPASS, ENGPASS_BENCHMARKS } from './funnels/engpass'

/** Alle Funnels. Neuer Funnel = neue Datei in funnels/ + ein Eintrag hier. */
export const FUNNELS: Record<string, { def: AskFunnelDef; benchmarks: Record<string, { red: number; green: number }> }> = {
  engpass: { def: ENGPASS, benchmarks: ENGPASS_BENCHMARKS },
}

export function getFunnel(slug: string) {
  return FUNNELS[slug] ?? null
}
