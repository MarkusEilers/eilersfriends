import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

/**
 * Teams und Rollen beim Kunden.
 *
 * `users.role` ist die Rolle auf der Plattform (admin, coach, participant,
 * client). Was jemand *bei seinem Kunden* darf, ist eine eigene Ebene: Marvin
 * ist bei OpenTAS PowerUser, auf der Plattform aber ein ganz normaler Kunde.
 *
 * `program_role_key` übersetzt die Teams der Programme (marketing, sales,
 * programm) auf die Teams des Kunden. OpenTAS nennt „programm" eben
 * „Product & GTM" — die Programme bleiben dafür unverändert.
 */

export const ORG_ROLES = ['owner', 'admin', 'lead', 'member', 'viewer'] as const
export type OrgRole = (typeof ORG_ROLES)[number]
export const PROGRAM_ROLE_KEYS = ['marketing', 'sales', 'programm'] as const

let ready = false
export async function ensureOrgSchema() {
  if (ready) return
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS org_teams (
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id       UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      key              TEXT NOT NULL,
      name             TEXT NOT NULL,
      program_role_key TEXT,
      sort_order       INT NOT NULL DEFAULT 0,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (company_id, key)
    )`)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS org_memberships (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      team_id     UUID REFERENCES org_teams(id) ON DELETE SET NULL,
      org_role    TEXT NOT NULL DEFAULT 'member',
      title       TEXT,
      is_primary  BOOLEAN NOT NULL DEFAULT true,
      invited_at  TIMESTAMPTZ,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (company_id, user_id, team_id)
    )`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS org_memberships_user ON org_memberships (user_id)`)
  ready = true
}

export interface OrgTeam { id: string; key: string; name: string; program_role_key: string | null; sort_order: number }
export interface OrgMember {
  id: string; user_id: string; name: string; email: string; team_id: string | null
  team_name: string | null; org_role: OrgRole; title: string | null; invited_at: string | null; has_login: boolean
}

export async function listTeams(companyId: string): Promise<OrgTeam[]> {
  await ensureOrgSchema()
  return (await db.execute(sql`
    SELECT id, key, name, program_role_key, sort_order FROM org_teams
    WHERE company_id=${companyId} ORDER BY sort_order, name`)) as unknown as OrgTeam[]
}

export async function listMembers(companyId: string): Promise<OrgMember[]> {
  await ensureOrgSchema()
  return (await db.execute(sql`
    SELECT m.id, m.user_id, u.name, u.email, m.team_id, t.name AS team_name, m.org_role, m.title,
           m.invited_at, (u.password_hash IS NOT NULL) AS has_login
    FROM org_memberships m JOIN users u ON u.id=m.user_id LEFT JOIN org_teams t ON t.id=m.team_id
    WHERE m.company_id=${companyId}
    ORDER BY t.sort_order NULLS LAST, CASE m.org_role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 WHEN 'lead' THEN 2 ELSE 3 END, u.name`)) as unknown as OrgMember[]
}

/** Höchste Rolle eines Users bei einer Firma — für Rechte im Kundenbereich. */
export async function orgRoleOf(userId: string, companyId: string): Promise<OrgRole | null> {
  await ensureOrgSchema()
  const rows = (await db.execute(sql`
    SELECT org_role FROM org_memberships WHERE user_id=${userId} AND company_id=${companyId}
    ORDER BY CASE org_role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 WHEN 'lead' THEN 2 WHEN 'member' THEN 3 ELSE 4 END
    LIMIT 1`)) as unknown as { org_role: OrgRole }[]
  return rows[0]?.org_role ?? null
}
