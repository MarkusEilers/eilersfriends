import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { ensureLeadRadarSchema } from './schema'

/**
 * Die Note. Vier Merkmale, jedes zaehlbar, jedes einzeln erklaerbar.
 *
 * Der Punkt an dieser Rechnung ist nicht die Formel, sondern dass man sie
 * aufmachen kann: Wenn jemand fragt, warum eine Firma auf B steht und nicht auf
 * A, gibt es eine Antwort, die kein Bauchgefuehl ist.
 */

export interface RadarSettings {
  weight_icp: number; weight_signal: number; weight_freshness: number; weight_contact: number
  cut_a: number; cut_b: number; cut_c: number; halflife_days: number
}

const DEFAULTS: RadarSettings = {
  weight_icp: 0.45, weight_signal: 0.30, weight_freshness: 0.15, weight_contact: 0.10,
  cut_a: 0.75, cut_b: 0.55, cut_c: 0.35, halflife_days: 14,
}

export async function radarSettings(companyId: string): Promise<RadarSettings> {
  await ensureLeadRadarSchema()
  const rows = await db.execute(sql`SELECT * FROM lead_radar_settings WHERE company_id = ${companyId}`)
  const r = (rows as unknown as RadarSettings[])[0]
  if (!r) return DEFAULTS
  return {
    weight_icp: Number(r.weight_icp), weight_signal: Number(r.weight_signal),
    weight_freshness: Number(r.weight_freshness), weight_contact: Number(r.weight_contact),
    cut_a: Number(r.cut_a), cut_b: Number(r.cut_b), cut_c: Number(r.cut_c),
    halflife_days: Number(r.halflife_days),
  }
}

export interface ScoreInput {
  icpMatch: number          // 0..100
  signalStrength: number    // 0..100
  signalAt?: string | Date | null
  hasContact: boolean
}

/**
 * Frische zerfaellt, sie faellt nicht ab. Ein Signal von gestern ist fast so gut
 * wie eines von heute; eines von vor drei Monaten ist Geschichte. Eine harte
 * Grenze bei 24 Stunden waere bequemer und falsch — der Radar blinkt nach
 * Fundzeit, bewertet aber nach Zerfall.
 */
export function freshness(signalAt: string | Date | null | undefined, halflifeDays: number): number {
  if (!signalAt) return 0.3
  const days = (Date.now() - new Date(signalAt).getTime()) / 86_400_000
  if (days < 0) return 1
  return Math.pow(0.5, days / halflifeDays)
}

export function scoreOf(input: ScoreInput, s: RadarSettings): { score: number; rating: 'A' | 'B' | 'C' | 'D' } {
  const score =
    s.weight_icp * (input.icpMatch / 100) +
    s.weight_signal * (input.signalStrength / 100) +
    s.weight_freshness * freshness(input.signalAt, s.halflife_days) +
    s.weight_contact * (input.hasContact ? 1 : 0)
  const rating = score >= s.cut_a ? 'A' : score >= s.cut_b ? 'B' : score >= s.cut_c ? 'C' : 'D'
  return { score: Math.round(score * 1000) / 1000, rating }
}

/** Alle Leads eines Kunden neu bewerten — taeglich, und nach jeder Gewichtsaenderung. */
export async function rescoreAll(companyId: string): Promise<number> {
  await ensureLeadRadarSchema()
  const s = await radarSettings(companyId)
  const rows = await db.execute(sql`
    SELECT id, icp_match, signal_strength, signal_at, contact_name FROM lead_radar WHERE company_id = ${companyId}`)
  let n = 0
  for (const r of rows as unknown as Array<{
    id: string; icp_match: number; signal_strength: number; signal_at: string | null; contact_name: string | null
  }>) {
    const { score, rating } = scoreOf({
      icpMatch: Number(r.icp_match), signalStrength: Number(r.signal_strength),
      signalAt: r.signal_at, hasContact: Boolean(r.contact_name),
    }, s)
    await db.execute(sql`UPDATE lead_radar SET score = ${score}, rating = ${rating}, updated_at = now() WHERE id = ${r.id}`)
    n++
  }
  return n
}
