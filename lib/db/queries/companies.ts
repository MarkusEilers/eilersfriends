import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

let ensured = false
/** Org-Dedup-Spalten + company_profile.company_id (Self-Heal, idempotent). */
export async function ensureOrgColumns() {
  if (ensured) return
  try {
    await db.execute(sql`ALTER TABLE companies ADD COLUMN IF NOT EXISTS domain text`)
    await db.execute(sql`ALTER TABLE companies ADD COLUMN IF NOT EXISTS merged_into uuid`)
    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS companies_domain_uq ON companies(domain) WHERE domain IS NOT NULL`)
    await db.execute(sql`ALTER TABLE company_profile ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id)`)
    ensured = true
  } catch (e) { console.error('[ensureOrgColumns]', e) }
}

/** Org über Domain finden-oder-anlegen (kanonisch, keine Duplikate). */
export async function upsertCompanyByDomain(domain: string, name?: string, website?: string): Promise<string | null> {
  if (!domain) return null
  await ensureOrgColumns()
  const rows = await db.execute(sql`
    INSERT INTO companies (name, domain, website)
    VALUES (${name || domain}, ${domain}, ${website || null})
    ON CONFLICT (domain) DO UPDATE SET
      name = COALESCE(NULLIF(companies.name, ''), EXCLUDED.name),
      website = COALESCE(companies.website, EXCLUDED.website)
    RETURNING id`)
  const r = (rows as { rows?: { id: string }[] }).rows ?? (rows as unknown as { id: string }[])
  return Array.isArray(r) && r[0] ? String(r[0].id) : null
}
