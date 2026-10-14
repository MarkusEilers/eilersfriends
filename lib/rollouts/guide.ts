import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { ensureRolloutSchema } from './schema'
import { effective, type Override, type Snapshot } from './core'
import type { OrgRole } from '@/lib/org/schema'

/** Postgres-Array-Literal — sicherer als ein JS-Array im sql-Template. */
export const pgArr = (xs: string[]) => '{' + xs.map((x) => '"' + x.replace(/["\\]/g, '') + '"').join(',') + '}'

/**
 * Das Programmheft eines Kunden als ein Datensatz für die Oberfläche.
 * Alle Rollouts der Firma, je Schritt das, was gilt — Version, Übersetzung,
 * Abweichung — plus Häkchen, Material und die Teams in der Sprache des Kunden.
 */

export interface GuideItem { id: string; kind: 'input' | 'output'; label: string; done: boolean; doneBy: string | null; doneAt: string | null }
export interface GuideResource { id: string; kind: string; title: string; url: string | null; body: string | null }
export interface GuideStep {
  id: string; rolloutId: string; prefix: string; code: string; n: number; color: string
  title: string; subtitle: string | null; description: string; start: string | null; end: string | null
  status: string; teams: { key: string; name: string }[]; items: GuideItem[]; needs: string[]
  note: string | null; challenge: string | null; joint: string | null; draft: boolean
  headline: string | null; milestones: string[]; links: Record<string, string>; resources: GuideResource[]
  canTick: boolean; canComplete: boolean; readOnly: boolean
}
export interface GuideProgram {
  rolloutId: string; prefix: string; color: string; title: string; tagline: string | null
  start: string | null; end: string | null; cadence: string; version: string; phase: string
  teams: { key: string; name: string }[]; meta: Record<string, unknown>; stepCount: number
}
export interface Guide {
  company: { id: string; name: string }; locale: string
  programs: GuideProgram[]; steps: GuideStep[]
  teams: { key: string; name: string }[]
  viewer: { userId: string; role: OrgRole | 'ef'; teamKeys: string[] }
  pendingChanges: number
  /** Vorschau durch Eilers+Friends: Sicht des Kunden, aber nur lesen */
  readOnly: boolean
}

export async function viewerContext(userId: string, platformRole: string | undefined, companyId: string) {
  const ms = (await db.execute(sql`
    SELECT m.org_role, t.program_role_key, t.key FROM org_memberships m LEFT JOIN org_teams t ON t.id=m.team_id
    WHERE m.user_id=${userId} AND m.company_id=${companyId}`)) as unknown as { org_role: OrgRole; program_role_key: string | null; key: string | null }[]
  const isEf = platformRole === 'admin' || platformRole === 'coach'
  const order: OrgRole[] = ['owner', 'admin', 'lead', 'member', 'viewer']
  const best = ms.map((m) => m.org_role).sort((a, b) => order.indexOf(a) - order.indexOf(b))[0]
  return {
    role: (isEf ? 'ef' : best ?? null) as OrgRole | 'ef' | null,
    teamKeys: ms.map((m) => m.program_role_key).filter(Boolean) as string[],
  }
}

/** Darf abhaken: EF, Owner/Admin immer; Lead/Member nur Schritte seines Teams. */
export function mayTick(role: OrgRole | 'ef' | null, teamKeys: string[], stepTeams: string[]) {
  if (role === 'ef' || role === 'owner' || role === 'admin') return true
  if (role === 'lead' || role === 'member') return stepTeams.length === 0 || stepTeams.some((t) => teamKeys.includes(t))
  return false
}
export function mayComplete(role: OrgRole | 'ef' | null, teamKeys: string[], stepTeams: string[]) {
  if (role === 'ef' || role === 'owner' || role === 'admin') return true
  return role === 'lead' && stepTeams.some((t) => teamKeys.includes(t))
}

export async function companyForUser(userId: string): Promise<string | null> {
  const rows = (await db.execute(sql`
    SELECT company_id FROM org_memberships WHERE user_id=${userId}
    UNION ALL SELECT company_id FROM users WHERE id=${userId} AND company_id IS NOT NULL LIMIT 1`)) as unknown as { company_id: string }[]
  return rows[0]?.company_id ?? null
}

export async function loadGuide(companyId: string, userId: string, platformRole?: string, preview?: { userId?: string; teamKey?: string }): Promise<Guide | null> {
  await ensureRolloutSchema()
  const [co] = (await db.execute(sql`SELECT id, name FROM companies WHERE id=${companyId}`)) as unknown as { id: string; name: string }[]
  if (!co) return null
  let ctx = await viewerContext(userId, platformRole, companyId)
  if (!ctx.role) return null
  const isEf = ctx.role === 'ef'
  if (isEf && preview?.userId) {
    const as = await viewerContext(preview.userId, 'client', companyId)
    ctx = { role: as.role ?? 'viewer', teamKeys: as.teamKeys }
  } else if (isEf && preview?.teamKey) {
    const [t] = (await db.execute(sql`SELECT program_role_key FROM org_teams WHERE company_id=${companyId} AND key=${preview.teamKey}`)) as unknown as { program_role_key: string | null }[]
    ctx = { role: 'member', teamKeys: t?.program_role_key ? [t.program_role_key] : [] }
  }
  const readOnly = isEf && !!(preview?.userId || preview?.teamKey)

  const teams = (await db.execute(sql`SELECT key, name, program_role_key FROM org_teams WHERE company_id=${companyId} ORDER BY sort_order`)) as unknown as { key: string; name: string; program_role_key: string | null }[]
  const teamName = (k: string) => teams.find((t) => t.program_role_key === k)?.name ?? (k === 'programm' ? 'Programm' : k.charAt(0).toUpperCase() + k.slice(1))

  const rollouts = (await db.execute(sql`
    SELECT r.id, r.code_prefix, r.color, r.title, r.start_date::text AS start_date, r.end_date::text AS end_date, r.cadence, r.locale, r.phase, r.meta,
           v.version, v.snapshot
    FROM rollouts r JOIN program_versions v ON v.id=r.program_version_id
    WHERE r.company_id=${companyId} AND r.status <> 'archived'
    ORDER BY r.start_date NULLS LAST, r.created_at`)) as unknown as
    { id: string; code_prefix: string; color: string; title: string; start_date: string | null; end_date: string | null; cadence: string; locale: string; phase: string; meta: Record<string, unknown>; version: string; snapshot: Snapshot }[]
  if (!rollouts.length) return { company: co, locale: 'de', programs: [], steps: [], teams: [], viewer: { userId, role: ctx.role, teamKeys: ctx.teamKeys }, pendingChanges: 0, readOnly }

  const ids = rollouts.map((r) => r.id)
  const rsteps = (await db.execute(sql`
    SELECT id, rollout_id, step_key, code, sort_order, planned_start::text AS planned_start, planned_end::text AS planned_end,
           status, joint_code, override, note, challenge
    FROM rollout_steps WHERE rollout_id = ANY(${pgArr(ids)}::uuid[]) ORDER BY sort_order`)) as unknown as
    { id: string; rollout_id: string; step_key: string; code: string; sort_order: number; planned_start: string | null; planned_end: string | null; status: string; joint_code: string | null; override: Override; note: string | null; challenge: string | null }[]
  const stepIds = rsteps.map((s) => s.id)
  const items = stepIds.length ? ((await db.execute(sql`
    SELECT id, rollout_step_id, kind, label, done_at::text AS done_at, done_by_name FROM rollout_items
    WHERE rollout_step_id = ANY(${pgArr(stepIds)}::uuid[]) ORDER BY sort_order`)) as unknown as
    { id: string; rollout_step_id: string; kind: 'input' | 'output'; label: string; done_at: string | null; done_by_name: string | null }[]) : []
  const keys = rsteps.map((s) => s.step_key)
  const res = keys.length ? ((await db.execute(sql`
    SELECT id, program_step_id::text AS program_step_id, kind, title, url, body, audience FROM step_resources
    WHERE program_step_id::text = ANY(${pgArr(keys)}::text[]) AND is_internal = false AND kind <> 'signal_mail' ORDER BY sort_order, created_at`)) as unknown as
    { id: string; program_step_id: string; kind: string; title: string; url: string | null; body: string | null; audience: string[] }[]) : []
  const [{ n: pending }] = (await db.execute(sql`SELECT count(*)::int AS n FROM rollout_changes WHERE rollout_id = ANY(${pgArr(ids)}::uuid[]) AND status='proposed'`)) as unknown as { n: number }[]

  const locale = rollouts[0].locale
  const programs: GuideProgram[] = []
  const steps: GuideStep[] = []
  const usedTeams = new Set<string>()
  for (const r of rollouts) {
    const snap = r.snapshot
    const codeOf = new Map(rsteps.filter((s) => s.rollout_id === r.id).map((s) => [s.step_key, s.code]))
    const progTeams = new Set<string>()
    for (const rs of rsteps.filter((s) => s.rollout_id === r.id)) {
      const st = snap.steps.find((x) => x.id === rs.step_key)
      if (!st) continue
      const eff = effective(st, r.locale, rs.override ?? {})
      st.teams.forEach((t) => { progTeams.add(t); usedTeams.add(t) })
      const ov = rs.override ?? {}
      const needs = ((ov as { needs?: string[] }).needs) ?? (st.requires_step_id && codeOf.get(st.requires_step_id) ? [codeOf.get(st.requires_step_id)!] : [])
      steps.push({
        id: rs.id, rolloutId: r.id, prefix: r.code_prefix, code: rs.code, n: st.n, color: r.color,
        title: eff.title, subtitle: eff.subtitle, description: eff.description,
        start: rs.planned_start, end: rs.planned_end, status: rs.status,
        teams: st.teams.map((k) => ({ key: k, name: teamName(k) })),
        items: items.filter((i) => i.rollout_step_id === rs.id).map((i) => ({ id: i.id, kind: i.kind, label: i.label, done: !!i.done_at, doneBy: i.done_by_name, doneAt: i.done_at })),
        needs, note: rs.note, challenge: rs.challenge, joint: rs.joint_code, draft: eff.draft,
        headline: st.headline, milestones: st.milestones, links: st.links ?? {},
        resources: res.filter((x) => x.program_step_id === st.id && (!x.audience?.length || x.audience.some((a) => st.teams.includes(a)))).map((x) => ({ id: x.id, kind: x.kind, title: x.title, url: x.url, body: x.body })),
        canTick: mayTick(ctx.role, ctx.teamKeys, st.teams),
        canComplete: mayComplete(ctx.role, ctx.teamKeys, st.teams),
        readOnly,
      })
    }
    const tagline = (r.locale !== 'de' && snap.program.i18n?.[r.locale]?.tagline) || snap.program.tagline
    programs.push({
      rolloutId: r.id, prefix: r.code_prefix, color: r.color, title: r.title, tagline,
      start: r.start_date, end: r.end_date, cadence: r.cadence, version: r.version, phase: r.phase,
      teams: [...progTeams].map((k) => ({ key: k, name: teamName(k) })), meta: r.meta ?? {},
      stepCount: rsteps.filter((s) => s.rollout_id === r.id).length,
    })
  }
  return {
    company: co, locale, programs, steps,
    teams: [...usedTeams].map((k) => ({ key: k, name: teamName(k) })),
    viewer: { userId, role: ctx.role, teamKeys: ctx.teamKeys },
    pendingChanges: pending,
    readOnly,
  }
}
