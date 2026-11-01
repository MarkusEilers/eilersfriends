import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

/**
 * Zielsetzung je Kunde — die KPIs, an denen Marketing, Sales und GTM gemessen
 * werden. Im Backend pflegbar, im Kundenbereich und im Admin-Dashboard sichtbar.
 *
 * kind:
 *   rate        — Takt je Zeitraum (z. B. 1 Sales Accepted Lead pro Woche)
 *   cumulative  — Summe bis zu einem Datum (z. B. 7 neue Terminals bis 31.08.2027)
 *   ratio       — Quote/Kennzahl (z. B. 300 % Pipeline-Abdeckung, 25 % Win-Rate)
 */

export type GoalTeam = 'marketing' | 'sales' | 'gtm' | 'company'
export type GoalKind = 'rate' | 'cumulative' | 'ratio'
export type GoalUnit = 'count' | 'eur' | 'percent' | 'days'
export type GoalPeriod = 'week' | 'month' | 'quarter' | 'year'

export interface Goal {
  id: string; company_id: string; team: GoalTeam; title: string; metric_key: string | null
  kind: GoalKind; unit: GoalUnit; period: GoalPeriod | null; direction: 'up' | 'down'
  target: number; current: number | null; start_date: string | null; deadline: string | null
  note: string | null; sort: number; status: 'active' | 'archived'; updated_at: string
  last_measured_on: string | null
}

export const TEAM_LABEL: Record<GoalTeam, string> = { marketing: 'Marketing', sales: 'Sales', gtm: 'Go-to-Market', company: 'Unternehmen' }
export const PERIOD_LABEL: Record<GoalPeriod, string> = { week: 'pro Woche', month: 'pro Monat', quarter: 'pro Quartal', year: 'pro Jahr' }

/** Die typischen KPIs — als Vorlage zum schnellen Anlegen. */
export const GOAL_TEMPLATES: Array<{ key: string; team: GoalTeam; title: string; kind: GoalKind; unit: GoalUnit; period?: GoalPeriod; direction?: 'up' | 'down'; target: number }> = [
  // Marketing
  { key: 'sal', team: 'marketing', title: 'Sales Accepted Leads (SAL)', kind: 'rate', unit: 'count', period: 'week', target: 1 },
  { key: 'mql', team: 'marketing', title: 'Marketing Qualified Leads (MQL)', kind: 'rate', unit: 'count', period: 'month', target: 10 },
  { key: 'mkt-pipeline', team: 'marketing', title: 'Pipeline aus Marketing', kind: 'rate', unit: 'eur', period: 'quarter', target: 250000 },
  { key: 'cost-per-sal', team: 'marketing', title: 'Kosten je SAL', kind: 'ratio', unit: 'eur', direction: 'down', target: 1500 },
  { key: 'lp-conversion', team: 'marketing', title: 'Conversion Landingpage → Lead', kind: 'ratio', unit: 'percent', target: 5 },
  // Sales
  { key: 'discovery', team: 'sales', title: 'Discovery-Calls Net New', kind: 'rate', unit: 'count', period: 'week', target: 1 },
  { key: 'first-meetings', team: 'sales', title: 'Qualifizierte Erstgespräche', kind: 'rate', unit: 'count', period: 'year', target: 30 },
  { key: 'proposals', team: 'sales', title: 'Angebote nach Qualifizierung', kind: 'rate', unit: 'count', period: 'month', target: 2 },
  { key: 'pipeline-coverage', team: 'sales', title: 'Pipeline-Abdeckung', kind: 'ratio', unit: 'percent', target: 300 },
  { key: 'win-rate', team: 'sales', title: 'Win-Rate', kind: 'ratio', unit: 'percent', target: 25 },
  { key: 'new-customers', team: 'sales', title: 'Neue Kunden (Abschlüsse)', kind: 'cumulative', unit: 'count', target: 5 },
  { key: 'new-arr', team: 'sales', title: 'Neuer wiederkehrender Umsatz (ARR)', kind: 'cumulative', unit: 'eur', target: 1000000 },
  { key: 'sales-cycle', team: 'sales', title: 'Ø Sales Cycle', kind: 'ratio', unit: 'days', direction: 'down', target: 120 },
  // GTM / Unternehmen
  { key: 'cac-payback', team: 'gtm', title: 'CAC-Payback', kind: 'ratio', unit: 'days', direction: 'down', target: 90 },
  { key: 'revenue', team: 'company', title: 'Neuumsatz', kind: 'cumulative', unit: 'eur', target: 1000000 },
]

let ready = false
export async function ensureGoalsSchema() {
  if (ready) return
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS company_goals (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id  UUID NOT NULL,
      team        TEXT NOT NULL DEFAULT 'company',
      title       TEXT NOT NULL,
      metric_key  TEXT,
      kind        TEXT NOT NULL DEFAULT 'rate',
      unit        TEXT NOT NULL DEFAULT 'count',
      period      TEXT,
      direction   TEXT NOT NULL DEFAULT 'up',
      target      NUMERIC NOT NULL DEFAULT 0,
      current     NUMERIC,
      start_date  DATE,
      deadline    DATE,
      note        TEXT,
      sort        INT NOT NULL DEFAULT 0,
      status      TEXT NOT NULL DEFAULT 'active',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_by  UUID
    )`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS company_goals_company ON company_goals (company_id, status, team, sort)`)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS company_goal_values (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      goal_id     UUID NOT NULL REFERENCES company_goals(id) ON DELETE CASCADE,
      measured_on DATE NOT NULL DEFAULT CURRENT_DATE,
      value       NUMERIC NOT NULL,
      note        TEXT,
      created_by  UUID,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS company_goal_values_goal ON company_goal_values (goal_id, measured_on DESC)`)
  ready = true
}

const num = (v: unknown) => (v === null || v === undefined || v === '' ? null : Number(v))

function row(r: Record<string, unknown>): Goal {
  return {
    ...(r as unknown as Goal),
    target: Number(r.target ?? 0), current: num(r.current), sort: Number(r.sort ?? 0),
  }
}

export async function listGoals(companyId: string, includeArchived = false): Promise<Goal[]> {
  await ensureGoalsSchema()
  const rows = (await db.execute(sql`
    SELECT g.*, g.start_date::text AS start_date, g.deadline::text AS deadline, g.updated_at::text AS updated_at,
      (SELECT max(measured_on)::text FROM company_goal_values v WHERE v.goal_id = g.id) AS last_measured_on
    FROM company_goals g
    WHERE g.company_id = ${companyId} ${includeArchived ? sql`` : sql`AND g.status = 'active'`}
    ORDER BY CASE g.team WHEN 'company' THEN 0 WHEN 'gtm' THEN 1 WHEN 'marketing' THEN 2 ELSE 3 END, g.sort, g.created_at`)) as unknown as Record<string, unknown>[]
  return rows.map(row)
}

/** Alle Kunden mit aktiven Zielen — fuer das Admin-Dashboard. */
export async function listAllGoals(): Promise<Array<Goal & { company_name: string }>> {
  await ensureGoalsSchema()
  const rows = (await db.execute(sql`
    SELECT g.*, g.start_date::text AS start_date, g.deadline::text AS deadline, g.updated_at::text AS updated_at, c.name AS company_name,
      (SELECT max(measured_on)::text FROM company_goal_values v WHERE v.goal_id = g.id) AS last_measured_on
    FROM company_goals g JOIN companies c ON c.id = g.company_id
    WHERE g.status = 'active'
    ORDER BY c.name, CASE g.team WHEN 'company' THEN 0 WHEN 'gtm' THEN 1 WHEN 'marketing' THEN 2 ELSE 3 END, g.sort`)) as unknown as Record<string, unknown>[]
  return rows.map((r) => ({ ...row(r), company_name: String(r.company_name) }))
}

export interface GoalInput {
  id?: string | null; companyId: string; team: GoalTeam; title: string; metricKey?: string | null
  kind: GoalKind; unit: GoalUnit; period?: GoalPeriod | null; direction?: 'up' | 'down'
  target: number; current?: number | null; startDate?: string | null; deadline?: string | null; note?: string | null; sort?: number
}

export async function saveGoal(g: GoalInput, userId: string | null) {
  await ensureGoalsSchema()
  if (g.id) {
    await db.execute(sql`
      UPDATE company_goals SET team=${g.team}, title=${g.title}, metric_key=${g.metricKey ?? null}, kind=${g.kind}, unit=${g.unit},
        period=${g.period ?? null}, direction=${g.direction ?? 'up'}, target=${g.target}, current=${g.current ?? null},
        start_date=${g.startDate || null}, deadline=${g.deadline || null}, note=${g.note ?? null}, sort=${g.sort ?? 0},
        updated_at=now(), updated_by=${userId}
      WHERE id=${g.id} AND company_id=${g.companyId}`)
    return g.id
  }
  const rows = (await db.execute(sql`
    INSERT INTO company_goals (company_id, team, title, metric_key, kind, unit, period, direction, target, current, start_date, deadline, note, sort, updated_by)
    VALUES (${g.companyId}, ${g.team}, ${g.title}, ${g.metricKey ?? null}, ${g.kind}, ${g.unit}, ${g.period ?? null}, ${g.direction ?? 'up'},
            ${g.target}, ${g.current ?? null}, ${g.startDate || null}, ${g.deadline || null}, ${g.note ?? null}, ${g.sort ?? 0}, ${userId})
    RETURNING id`)) as unknown as { id: string }[]
  return rows[0]?.id
}

export async function archiveGoal(id: string, companyId: string, archived = true) {
  await ensureGoalsSchema()
  await db.execute(sql`UPDATE company_goals SET status=${archived ? 'archived' : 'active'}, updated_at=now() WHERE id=${id} AND company_id=${companyId}`)
}

/** Neuen Messwert erfassen — setzt zugleich den aktuellen Stand. */
export async function addGoalValue(goalId: string, value: number, measuredOn: string | null, note: string | null, userId: string | null) {
  await ensureGoalsSchema()
  await db.execute(sql`INSERT INTO company_goal_values (goal_id, measured_on, value, note, created_by) VALUES (${goalId}, COALESCE(${measuredOn}::date, CURRENT_DATE), ${value}, ${note}, ${userId})`)
  await db.execute(sql`UPDATE company_goals SET current=${value}, updated_at=now(), updated_by=${userId} WHERE id=${goalId}`)
}

export async function goalHistory(goalIds: string[]): Promise<Record<string, Array<{ measured_on: string; value: number }>>> {
  await ensureGoalsSchema()
  if (!goalIds.length) return {}
  const rows = (await db.execute(sql`
    SELECT goal_id, measured_on::text AS measured_on, value FROM company_goal_values
    WHERE goal_id IN (${sql.join(goalIds.map((i) => sql`${i}::uuid`), sql`, `)}) ORDER BY measured_on`)) as unknown as Array<{ goal_id: string; measured_on: string; value: string }>
  const out: Record<string, Array<{ measured_on: string; value: number }>> = {}
  for (const r of rows) {
    if (!out[r.goal_id]) out[r.goal_id] = []
    out[r.goal_id].push({ measured_on: r.measured_on, value: Number(r.value) })
  }
  return out
}

/** Wie gut liegt das Ziel im Plan? */
export function goalStatus(g: Goal, today = new Date()): { pct: number | null; expectedPct: number | null; state: 'on' | 'watch' | 'off' | 'open' } {
  if (g.current === null || !g.target) return { pct: null, expectedPct: null, state: 'open' }
  const pct = g.direction === 'down' ? (g.target / Math.max(g.current, 0.0001)) * 100 : (g.current / g.target) * 100
  let expected: number | null = 100
  if (g.kind === 'cumulative' && g.deadline) {
    const end = new Date(g.deadline + 'T12:00:00Z').getTime()
    const start = g.start_date ? new Date(g.start_date + 'T12:00:00Z').getTime() : new Date(g.updated_at).getTime()
    const f = end > start ? Math.min(1, Math.max(0, (today.getTime() - start) / (end - start))) : 1
    expected = f * 100
  }
  const ratio = expected ? pct / expected : pct / 100
  const state = expected === 0 ? 'on' : ratio >= 0.95 ? 'on' : ratio >= 0.7 ? 'watch' : 'off'
  return { pct, expectedPct: expected, state }
}

export function fmtGoalValue(v: number | null, unit: GoalUnit): string {
  if (v === null || !Number.isFinite(v)) return '—'
  if (unit === 'eur') return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, notation: v >= 1e6 ? 'compact' : 'standard' }).format(v)
  if (unit === 'percent') return `${new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(v)} %`
  if (unit === 'days') return `${new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(v)} Tage`
  return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(v)
}
