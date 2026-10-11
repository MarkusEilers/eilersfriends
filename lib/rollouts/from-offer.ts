import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { ensureRolloutSchema } from './schema'
import { createRollout, type Break, type Cadence } from './core'

/**
 * Unterschriebenes Angebot → Programmheft.
 *
 * Für jedes Programm im Angebot entsteht ein Rollout auf der aktuell
 * freigegebenen Version. Start, Kadenz und Pausen kommen aus der
 * Angebots-Timeline. Läuft mehrfach ohne Doppelung (offer_id + program_id).
 * Fehlen Firma oder Teams, werden sie angelegt; die unterschreibende
 * Person wird PowerUser.
 */

const FREEMAIL = new Set(['gmail.com', 'googlemail.com', 'gmx.de', 'gmx.net', 'web.de', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com', 't-online.de', 'aol.com', 'proton.me', 'protonmail.com'])
const DEFAULT_TEAMS: [string, string, string][] = [['marketing', 'Marketing', 'marketing'], ['sales', 'Sales', 'sales'], ['programm', 'Programm', 'programm']]

export async function rolloutsFromOffer(offerId: string): Promise<{ created: number; companyId: string | null }> {
  await ensureRolloutSchema()
  const [o] = (await db.execute(sql`
    SELECT id, program_id, programs, customer_user_id, customer_email, customer_company, customer_name,
           timeline_start_date::text AS start, timeline_rhythm_weeks AS rhythm, timeline_breaks AS breaks
    FROM offers WHERE id=${offerId}`)) as unknown as
    { id: string; program_id: string | null; programs: { program_id?: string }[] | null; customer_user_id: string | null; customer_email: string | null; customer_company: string | null; customer_name: string | null; start: string | null; rhythm: number | null; breaks: unknown }[]
  if (!o) return { created: 0, companyId: null }
  const programIds = [...new Set([o.program_id, ...(o.programs ?? []).map((p) => p?.program_id)].filter((x): x is string => !!x))]
  if (!programIds.length) return { created: 0, companyId: null }

  // Firma finden oder anlegen
  let companyId: string | null = null
  if (o.customer_user_id) {
    const [u] = (await db.execute(sql`SELECT company_id FROM users WHERE id=${o.customer_user_id}`)) as unknown as { company_id: string | null }[]
    companyId = u?.company_id ?? null
  }
  const domain = o.customer_email?.split('@')[1]?.toLowerCase() ?? null
  if (!companyId && domain && !FREEMAIL.has(domain)) {
    const [c] = (await db.execute(sql`SELECT id FROM companies WHERE lower(domain)=${domain} AND merged_into IS NULL LIMIT 1`)) as unknown as { id: string }[]
    companyId = c?.id ?? null
  }
  if (!companyId) {
    const name = o.customer_company || o.customer_name || 'Neuer Kunde'
    const [c] = (await db.execute(sql`
      INSERT INTO companies (name, domain) VALUES (${name}, ${domain && !FREEMAIL.has(domain) ? domain : null}) RETURNING id`)) as unknown as { id: string }[]
    companyId = c.id
  }

  // Standard-Teams, falls der Kunde noch keine hat
  const [{ n }] = (await db.execute(sql`SELECT count(*)::int AS n FROM org_teams WHERE company_id=${companyId}`)) as unknown as { n: number }[]
  if (!n) for (const [i, [key, name, role]] of DEFAULT_TEAMS.entries()) {
    await db.execute(sql`INSERT INTO org_teams (company_id, key, name, program_role_key, sort_order) VALUES (${companyId}, ${key}, ${name}, ${role}, ${i}) ON CONFLICT DO NOTHING`)
  }

  // Unterzeichner als PowerUser
  if (o.customer_user_id) {
    await db.execute(sql`UPDATE users SET company_id=COALESCE(company_id, ${companyId}) WHERE id=${o.customer_user_id}`)
    await db.execute(sql`
      INSERT INTO org_memberships (company_id, user_id, org_role)
      SELECT ${companyId}, ${o.customer_user_id}, 'admin'
      WHERE NOT EXISTS (SELECT 1 FROM org_memberships WHERE company_id=${companyId} AND user_id=${o.customer_user_id})`)
  }

  const start = o.start ?? new Date().toISOString().slice(0, 10)
  const cadence: Cadence = o.rhythm === 1 ? 'weekly' : 'biweekly'
  const breaks: Break[] = Array.isArray(o.breaks)
    ? (o.breaks as Record<string, string>[]).map((b) => ({ from: b.from ?? b.start ?? b.startDate, to: b.to ?? b.end ?? b.endDate, label: b.label })).filter((b) => b.from && b.to)
    : []
  let created = 0
  for (const programId of programIds) {
    const [exists] = (await db.execute(sql`SELECT id FROM rollouts WHERE offer_id=${offerId} AND program_id=${programId}`)) as unknown as { id: string }[]
    if (exists) continue
    await createRollout({ companyId, programId, offerId, startDate: start, cadence, breaks, createdFrom: 'offer' })
    created++
  }
  return { created, companyId }
}
