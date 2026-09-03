import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { ensureLeadRadarSchema } from './schema'
import { radarSettings, scoreOf } from './scoring'

export interface RadarLead {
  id: string; org_name: string; org_domain: string | null; branch: string | null; size_band: string | null
  city: string; postal_code: string | null; country: string; lat: number; lon: number
  source: string; source_url: string | null
  signal: string; signal_kind: string; signal_quote: string | null; signal_at: string | null
  contact_name: string | null; contact_role: string | null; contact_url: string | null
  icp_match: number; icp_reasons: string[]; signal_strength: number
  score: number; rating: 'A' | 'B' | 'C' | 'D'
  status: string; found_at: string
}

export interface LeadInput {
  companyId: string; productId?: string | null
  orgName: string; orgDomain?: string | null; branch?: string | null; sizeBand?: string | null
  city: string; postalCode?: string | null; country?: string; lat: number; lon: number
  source: string; sourceUrl?: string | null
  signal: string; signalKind?: string; signalQuote?: string | null; signalAt?: string | null
  contactName?: string | null; contactRole?: string | null; contactUrl?: string | null
  icpMatch: number; icpReasons?: string[]; signalStrength: number
  foundAt?: string | null
}

/** Aufnehmen und sofort bewerten. Doppelte Signale derselben Firma fallen weg. */
export async function addLead(input: LeadInput): Promise<string | null> {
  await ensureLeadRadarSchema()
  const s = await radarSettings(input.companyId)
  const { score, rating } = scoreOf({
    icpMatch: input.icpMatch, signalStrength: input.signalStrength,
    signalAt: input.signalAt, hasContact: Boolean(input.contactName),
  }, s)
  const res = await db.execute(sql`
    INSERT INTO lead_radar (company_id, product_id, org_name, org_domain, branch, size_band,
      city, postal_code, country, lat, lon, source, source_url, signal, signal_kind, signal_quote, signal_at,
      contact_name, contact_role, contact_url, icp_match, icp_reasons, signal_strength, score, rating, found_at)
    VALUES (${input.companyId}, ${input.productId ?? null}, ${input.orgName}, ${input.orgDomain ?? null},
            ${input.branch ?? null}, ${input.sizeBand ?? null}, ${input.city}, ${input.postalCode ?? null},
            ${input.country ?? 'DE'}, ${input.lat}, ${input.lon}, ${input.source}, ${input.sourceUrl ?? null},
            ${input.signal}, ${input.signalKind ?? 'sonstiges'}, ${input.signalQuote ?? null},
            ${input.signalAt ?? null}, ${input.contactName ?? null}, ${input.contactRole ?? null},
            ${input.contactUrl ?? null}, ${input.icpMatch}, ${JSON.stringify(input.icpReasons ?? [])}::jsonb,
            ${input.signalStrength}, ${score}, ${rating}, ${input.foundAt ?? new Date().toISOString()})
    ON CONFLICT DO NOTHING
    RETURNING id`)
  return (res as unknown as { id: string }[])[0]?.id ?? null
}

export async function leadsFor(companyId: string, opts?: { hours?: number; rating?: string | null }) {
  await ensureLeadRadarSchema()
  const hours = opts?.hours ?? 24 * 30
  const rows = await db.execute(sql`
    SELECT * FROM lead_radar
    WHERE company_id = ${companyId}
      AND found_at > now() - (${hours} || ' hours')::interval
      ${opts?.rating ? sql`AND rating = ${opts.rating}` : sql``}
    ORDER BY score DESC, found_at DESC
    LIMIT 500`)
  return rows as unknown as RadarLead[]
}

export interface RadarSummary {
  total: number
  last24h: number
  byRating: Array<{ rating: string; count: number; last24h: number }>
  bySource: Array<{ source: string; count: number }>
  byCountry: Array<{ country: string; count: number }>
  topSignals: Array<{ signal_kind: string; count: number }>
  newestAt: string | null
}

/** Die Zusammenfassung fuer die linke Spalte. */
export async function summaryFor(companyId: string): Promise<RadarSummary> {
  await ensureLeadRadarSchema()
  const q = async (s: ReturnType<typeof sql>) => (await db.execute(s)) as unknown as Array<Record<string, unknown>>

  const [totals] = await q(sql`
    SELECT COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE found_at > now() - interval '24 hours')::int AS last24h,
           MAX(found_at) AS newest
    FROM lead_radar WHERE company_id = ${companyId}`)

  const byRating = await q(sql`
    SELECT rating, COUNT(*)::int AS count,
           COUNT(*) FILTER (WHERE found_at > now() - interval '24 hours')::int AS last24h
    FROM lead_radar WHERE company_id = ${companyId}
    GROUP BY rating ORDER BY rating`)

  const bySource = await q(sql`
    SELECT source, COUNT(*)::int AS count FROM lead_radar
    WHERE company_id = ${companyId} GROUP BY source ORDER BY count DESC LIMIT 8`)

  const byCountry = await q(sql`
    SELECT country, COUNT(*)::int AS count FROM lead_radar
    WHERE company_id = ${companyId} GROUP BY country ORDER BY count DESC`)

  const topSignals = await q(sql`
    SELECT signal_kind, COUNT(*)::int AS count FROM lead_radar
    WHERE company_id = ${companyId} AND found_at > now() - interval '24 hours'
    GROUP BY signal_kind ORDER BY count DESC LIMIT 6`)

  return {
    total: Number(totals?.total ?? 0),
    last24h: Number(totals?.last24h ?? 0),
    byRating: byRating as RadarSummary['byRating'],
    bySource: bySource as RadarSummary['bySource'],
    byCountry: byCountry as RadarSummary['byCountry'],
    topSignals: topSignals as RadarSummary['topSignals'],
    newestAt: (totals?.newest as string) ?? null,
  }
}
