'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { ensureOrgSchema, ORG_ROLES, PROGRAM_ROLE_KEYS } from '@/lib/org/schema'
import { DEFAULT_TEAMS, teamKey } from '@/lib/org/defaults'
import { createProduct } from '@/lib/db/queries/strategy'

/**
 * Kunden, Teams und Mitglieder im Backend anlegen.
 *
 * Der Datenbereich eines Kunden hängt an `companies.id`: Strategie, Fakten,
 * Ziele, Rollouts, Lead-Radar und Verbrauch tragen alle `company_id`.
 * Wer sich einloggt, landet über `users.company_id` in genau diesem Bereich —
 * deshalb setzt „Person hinzufügen" das Feld, wenn es noch leer ist.
 * Eilers+Friends-Konten (admin/coach) bleiben unzugeordnet und arbeiten über
 * „Ansehen als".
 */

async function requireEf() {
  const s = await auth()
  if (!s?.user?.role || (s.user.role !== 'admin' && s.user.role !== 'coach')) throw new Error('unauthorized')
  await ensureOrgSchema()
  return s.user
}
const str = (v: FormDataEntryValue | null) => (v?.toString() ?? '').trim()
const nn = (v: FormDataEntryValue | null) => str(v) || null

async function addTeam(companyId: string, name: string, programRole: string | null, sort?: number) {
  const base = teamKey(name)
  const taken = (await db.execute(sql`SELECT key FROM org_teams WHERE company_id=${companyId}`)) as unknown as { key: string }[]
  let key = base, i = 2
  while (taken.some((t) => t.key === key)) key = `${base}-${i++}`
  const [{ n }] = (await db.execute(sql`SELECT coalesce(max(sort_order)+1,0)::int AS n FROM org_teams WHERE company_id=${companyId}`)) as unknown as { n: number }[]
  await db.execute(sql`INSERT INTO org_teams (company_id, key, name, program_role_key, sort_order)
    VALUES (${companyId}, ${key}, ${name}, ${programRole}, ${sort ?? n})`)
}

/* ── Kunde ── */
export async function createCompanyAction(fd: FormData) {
  await requireEf()
  const name = str(fd.get('name'))
  if (!name) throw new Error('Name fehlt')
  const domain = nn(fd.get('domain'))?.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '').toLowerCase() ?? null
  // Gibt es die Firma schon (gleiche Domain oder gleicher Name)? Dann dort weiter, statt doppelt anzulegen
  const existing = (await db.execute(sql`
    SELECT id FROM companies WHERE merged_into IS NULL AND (lower(name)=lower(${name}) OR (${domain}::text IS NOT NULL AND lower(domain)=${domain}))
    ORDER BY created_at LIMIT 1`)) as unknown as { id: string }[]
  let id = existing[0]?.id
  if (!id) {
    const [row] = (await db.execute(sql`
      INSERT INTO companies (name, domain, industry, website, created_at, updated_at)
      VALUES (${name}, ${domain}, ${nn(fd.get('industry'))}, ${domain ? `https://${domain}` : null}, now(), now()) RETURNING id`)) as unknown as { id: string }[]
    id = row.id
  }
  const [{ n }] = (await db.execute(sql`SELECT count(*)::int AS n FROM org_teams WHERE company_id=${id}`)) as unknown as { n: number }[]
  if (fd.get('defaultTeams') && n === 0) {
    for (const [k, t] of DEFAULT_TEAMS.entries()) await addTeam(id, t.name, t.program_role_key, k)
  }
  const product = str(fd.get('product'))
  if (product) await createProduct({ companyId: id, name: product })
  revalidatePath('/admin/companies')
  redirect(`/admin/companies/${id}`)
}

export async function updateCompanyAction(fd: FormData) {
  await requireEf()
  const id = str(fd.get('companyId')); const name = str(fd.get('name'))
  if (!id || !name) return
  await db.execute(sql`UPDATE companies SET name=${name}, domain=${nn(fd.get('domain'))}, industry=${nn(fd.get('industry'))}, updated_at=now() WHERE id=${id}`)
  revalidatePath(`/admin/companies/${id}`)
}

/* ── Teams ── */
export async function createTeamAction(fd: FormData) {
  await requireEf()
  const companyId = str(fd.get('companyId')); const name = str(fd.get('name'))
  if (!companyId || !name) return
  const role = str(fd.get('programRole'))
  await addTeam(companyId, name, (PROGRAM_ROLE_KEYS as readonly string[]).includes(role) ? role : null)
  revalidatePath(`/admin/companies/${companyId}`)
}

export async function addDefaultTeamsAction(fd: FormData) {
  await requireEf()
  const companyId = str(fd.get('companyId')); if (!companyId) return
  const have = (await db.execute(sql`SELECT lower(name) AS name FROM org_teams WHERE company_id=${companyId}`)) as unknown as { name: string }[]
  for (const t of DEFAULT_TEAMS) if (!have.some((h) => h.name === t.name.toLowerCase())) await addTeam(companyId, t.name, t.program_role_key)
  revalidatePath(`/admin/companies/${companyId}`)
}

export async function updateTeamAction(fd: FormData) {
  await requireEf()
  const companyId = str(fd.get('companyId')); const id = str(fd.get('teamId')); const name = str(fd.get('name'))
  if (!companyId || !id || !name) return
  const role = str(fd.get('programRole'))
  await db.execute(sql`UPDATE org_teams SET name=${name}, program_role_key=${(PROGRAM_ROLE_KEYS as readonly string[]).includes(role) ? role : null}, updated_at=now()
    WHERE id=${id} AND company_id=${companyId}`)
  revalidatePath(`/admin/companies/${companyId}`)
}

/* ── Mitglieder ── */
export async function addMemberAction(fd: FormData) {
  await requireEf()
  const companyId = str(fd.get('companyId'))
  const email = str(fd.get('email')).toLowerCase()
  const name = str(fd.get('name'))
  if (!companyId || !email.includes('@') || !name) throw new Error('Name und E-Mail fehlen')
  const teamId = nn(fd.get('teamId'))
  const role = str(fd.get('orgRole')) || 'member'
  const orgRole = (ORG_ROLES as readonly string[]).includes(role) ? role : 'member'
  const locale = ['de', 'en', 'es', 'ru'].includes(str(fd.get('locale'))) ? str(fd.get('locale')) : 'de'

  const found = (await db.execute(sql`SELECT id, role::text AS role, company_id FROM users WHERE lower(email)=${email} LIMIT 1`)) as unknown as { id: string; role: string; company_id: string | null }[]
  let userId = found[0]?.id
  if (!userId) {
    const [u] = (await db.execute(sql`
      INSERT INTO users (email, name, role, company_id, locale) VALUES (${email}, ${name}, 'client', ${companyId}, ${locale}) RETURNING id`)) as unknown as { id: string }[]
    userId = u.id
  } else if (!found[0].company_id && found[0].role !== 'admin' && found[0].role !== 'coach') {
    // Ohne Zuordnung sähe die Person im Kundenbereich keine Daten
    await db.execute(sql`UPDATE users SET company_id=${companyId}, updated_at=now() WHERE id=${userId}`)
  }
  const dup = (await db.execute(sql`SELECT id FROM org_memberships WHERE company_id=${companyId} AND user_id=${userId} AND team_id IS NOT DISTINCT FROM ${teamId}::uuid`)) as unknown as { id: string }[]
  if (dup.length) {
    await db.execute(sql`UPDATE org_memberships SET org_role=${orgRole}, title=${nn(fd.get('title'))}, updated_at=now() WHERE id=${dup[0].id}`)
  } else {
    await db.execute(sql`INSERT INTO org_memberships (company_id, user_id, team_id, org_role, title, is_primary)
      VALUES (${companyId}, ${userId}, ${teamId}, ${orgRole}, ${nn(fd.get('title'))},
        NOT EXISTS (SELECT 1 FROM org_memberships WHERE user_id=${userId} AND is_primary))`)
  }
  revalidatePath(`/admin/companies/${companyId}`)
}

export async function updateMemberAction(fd: FormData) {
  await requireEf()
  const companyId = str(fd.get('companyId')); const id = str(fd.get('membershipId'))
  if (!companyId || !id) return
  const role = str(fd.get('orgRole'))
  const orgRole = (ORG_ROLES as readonly string[]).includes(role) ? role : 'member'
  await db.execute(sql`UPDATE org_memberships SET org_role=${orgRole}, team_id=${nn(fd.get('teamId'))}, updated_at=now()
    WHERE id=${id} AND company_id=${companyId}`)
  revalidatePath(`/admin/companies/${companyId}`)
}

/** Nimmt eine Person aus einem Team — das Konto selbst bleibt bestehen. */
export async function removeMemberAction(fd: FormData) {
  await requireEf()
  const companyId = str(fd.get('companyId')); const id = str(fd.get('membershipId'))
  if (!companyId || !id) return
  await db.execute(sql`DELETE FROM org_memberships WHERE id=${id} AND company_id=${companyId}`)
  revalidatePath(`/admin/companies/${companyId}`)
}

/** Konto dem Datenbereich dieses Kunden zuordnen (users.company_id). */
export async function assignUserCompanyAction(fd: FormData) {
  await requireEf()
  const companyId = str(fd.get('companyId')); const userId = str(fd.get('userId'))
  if (!companyId || !userId) return
  await db.execute(sql`UPDATE users SET company_id=${companyId}, updated_at=now() WHERE id=${userId} AND role NOT IN ('admin','coach')`)
  revalidatePath(`/admin/companies/${companyId}`)
}

/* ── Strategie: erstes Produkt ── */
export async function createProductAdminAction(fd: FormData) {
  await requireEf()
  const companyId = str(fd.get('companyId')); const name = str(fd.get('name'))
  if (!companyId || !name) return
  await createProduct({ companyId, name })
  revalidatePath(`/admin/companies/${companyId}`)
}
