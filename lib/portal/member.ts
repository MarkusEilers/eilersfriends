import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { getViewAs } from '@/lib/view-as'
import { loadGuide } from '@/lib/rollouts/guide'

/**
 * Daten für die Member-Section (Stufe 1: Rahmen, Start, Profil, Score).
 * Alles kommt aus dem, was es schon gibt: Nutzer, Firma und Team, Rollouts,
 * Gesprächs-Checks, Abos. Was es noch nicht gibt, wird nicht vorgetäuscht.
 */

type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? r : ((r as { rows?: Row[] })?.rows ?? [])) as Row[]

let ready = false
export async function ensureMemberSchema() {
  if (ready) return
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS member_profiles (
      user_id     UUID PRIMARY KEY,
      headline    TEXT,
      linkedin    TEXT,
      bio         TEXT,
      phone       TEXT,
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
  ready = true
}

export interface Viewer { userId: string; sessionUserId: string; role: string; preview: boolean }

/** Wer wird angezeigt? Eilers+Friends sieht mit „Ansehen als" eine bestimmte Person, sonst sich selbst. */
export async function viewer(): Promise<Viewer | null> {
  const s = await auth()
  if (!s?.user?.id) return null
  const va = await getViewAs().catch(() => null)
  const target = va?.userId ?? s.user.id
  return { userId: target, sessionUserId: s.user.id, role: s.user.role ?? 'client', preview: !!va?.userId && va.userId !== s.user.id }
}

export interface Plan { label: string; kind: 'corporate' | 'program' | 'personal' }
export interface Member {
  id: string; name: string; firstName: string; initials: string; email: string; avatarUrl: string | null
  companyId: string | null; companyName: string | null; teamName: string | null; teamKey: string | null
  orgRole: string | null; title: string | null; headline: string | null; linkedin: string | null; bio: string | null; phone: string | null
  plans: Plan[]
}

export async function getMember(userId: string): Promise<Member | null> {
  await ensureMemberSchema()
  const [u] = rows(await db.execute(sql`
    SELECT u.id, u.email, u.name, u.avatar_url, u.company_id,
           m.company_id AS m_company, m.org_role, m.title, t.name AS team_name, t.program_role_key AS team_key,
           c.name AS company_name, p.headline, p.linkedin, p.bio, p.phone
    FROM users u
    LEFT JOIN LATERAL (SELECT * FROM org_memberships WHERE user_id = u.id ORDER BY is_primary DESC NULLS LAST, created_at LIMIT 1) m ON true
    LEFT JOIN org_teams t ON t.id = m.team_id
    LEFT JOIN companies c ON c.id = COALESCE(m.company_id, u.company_id)
    LEFT JOIN member_profiles p ON p.user_id = u.id
    WHERE u.id = ${userId}`))
  if (!u) return null
  const name = String(u.name || String(u.email).split('@')[0])
  const parts = name.trim().split(/\s+/)
  const companyId = (u.m_company as string) ?? (u.company_id as string) ?? null
  const plans: Plan[] = []
  if (companyId) {
    const ro = rows(await db.execute(sql`SELECT title FROM rollouts WHERE company_id = ${companyId} AND status IN ('active','planned') ORDER BY start_date`)).map((r) => String(r.title))
    if (ro.length && u.company_name) plans.push({ label: `${u.company_name} Corporate`, kind: 'corporate' })
    for (const t of ro) plans.push({ label: shortProgram(t), kind: 'program' })
  }
  try {
    const subs = rows(await db.execute(sql`
      SELECT p.name FROM billing_subscriptions s LEFT JOIN programs p ON p.id = s.program_id
      WHERE (s.user_id = ${userId} OR lower(s.customer_email) = lower(${String(u.email)})) AND s.status IN ('active','trialing')`))
    for (const s of subs) plans.push({ label: String(s.name ?? 'Abo'), kind: 'personal' })
  } catch { /* Abrechnung noch nicht da */ }
  return {
    id: String(u.id), name, firstName: parts[0], initials: (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase(),
    email: String(u.email), avatarUrl: (u.avatar_url as string) ?? null,
    companyId, companyName: (u.company_name as string) ?? null, teamName: (u.team_name as string) ?? null, teamKey: (u.team_key as string) ?? null,
    orgRole: (u.org_role as string) ?? null, title: (u.title as string) ?? null,
    headline: (u.headline as string) ?? null, linkedin: (u.linkedin as string) ?? null, bio: (u.bio as string) ?? null, phone: (u.phone as string) ?? null,
    plans: dedupe(plans),
  }
}

function shortProgram(t: string) {
  if (/academy/i.test(t)) return 'Academy'
  if (/13 step|gtm/i.test(t)) return 'GTM 13 Steps'
  if (/rockstar/i.test(t)) return 'Social Media Rockstar'
  return t.length > 24 ? t.slice(0, 22) + '…' : t
}
function dedupe(p: Plan[]) { return p.filter((x, i) => p.findIndex((y) => y.label === x.label) === i) }

/* ── Gesprächs-Score ─────────────────────────────────────────────── */

export const CRITERIA: Record<string, string> = {
  smart_questions: 'Smarte Fragen', assumptions: 'Keine Annahmen', serial_questions: 'Eine Frage nach der anderen', offer: 'Angebot und nächster Schritt', empathy: 'Taktische Empathie',
}
export interface ScorePoint { id: string; publicId: string; date: string; overall: number; criteria: Record<string, number | null>; seller: string | null }

/** Ein Punkt je ausgewertetem Gespräch: Gesamt = Mittel der bewerteten Kriterien (0–100). */
export async function scoreSeries(email: string): Promise<ScorePoint[]> {
  try {
    const r = rows(await db.execute(sql`
      SELECT id, public_id, created_at, result, seller_label FROM call_checks
      WHERE lower(email) = lower(${email}) AND status = 'done' AND result IS NOT NULL ORDER BY created_at`))
    return r.map((x) => {
      const res = (typeof x.result === 'string' ? JSON.parse(x.result as string) : x.result) as { criteria?: { key: string; score: number | null }[] }
      const crit: Record<string, number | null> = {}
      for (const c of res.criteria ?? []) crit[c.key] = typeof c.score === 'number' ? c.score : null
      const vals = Object.values(crit).filter((v): v is number => typeof v === 'number')
      return { id: String(x.id), publicId: String(x.public_id), date: new Date(String(x.created_at)).toISOString(), overall: vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0, criteria: crit, seller: (x.seller_label as string) ?? null }
    }).filter((p) => p.overall > 0)
  } catch { return [] }
}

/* ── Start: was als Nächstes dran ist ────────────────────────────── */

export interface Todo { id: string; kind: 'input' | 'output' | 'transcript' | 'profile'; title: string; sub: string; href: string; cta: string; due: string | null }
export interface TimelineEntry { id: string; code: string; color: string; program: string; title: string; start: string | null; end: string | null; status: string; open: number; total: number; href: string; now: boolean }
export interface StartData {
  next: { eyebrow: string; title: string; sub: string; progress: number | null; href: string } | null
  todos: Todo[]
  timeline: TimelineEntry[]
}

export async function startData(m: Member, platformRole: string): Promise<StartData> {
  const today = new Date().toISOString().slice(0, 10)
  const todos: Todo[] = []
  let timeline: TimelineEntry[] = []
  let next: StartData['next'] = null

  if (m.companyId) {
    const g = await loadGuide(m.companyId, m.id, platformRole).catch(() => null)
    if (g) {
      const mine = g.steps.filter((s) => !m.teamKey || s.teams.length === 0 || s.teams.some((t) => t.key === m.teamKey) || g.viewer.role === 'ef' || g.viewer.role === 'owner')
      const prog = (rid: string) => g.programs.find((p) => p.rolloutId === rid)
      timeline = mine
        .filter((s) => s.status !== 'done' || (s.end ?? '') >= today)
        .sort((a, b) => (a.start ?? '9999').localeCompare(b.start ?? '9999'))
        .slice(0, 8)
        .map((s) => ({
          id: s.id, code: s.code, color: s.color, program: prog(s.rolloutId)?.title ?? '', title: s.title, start: s.start, end: s.end, status: s.status,
          open: s.items.filter((i) => !i.done).length, total: s.items.length, href: `/dashboard/guide#${s.code}`,
          now: !!s.start && !!s.end && s.start <= today && today <= s.end,
        }))
      const cur = timeline.find((t) => t.now) ?? timeline[0]
      if (cur) {
        const st = mine.find((s) => s.id === cur.id)!
        next = {
          eyebrow: 'Weiter mit', title: `${cur.code} · ${cur.title}`, sub: prog(st.rolloutId)?.title ?? '',
          progress: cur.total ? Math.round(((cur.total - cur.open) / cur.total) * 100) : null, href: cur.href,
        }
        for (const it of st.items.filter((i) => !i.done && st.canTick).slice(0, 3)) {
          todos.push({ id: it.id, kind: it.kind, title: it.label, sub: `${cur.code} · ${it.kind === 'input' ? 'mitbringen' : 'Ergebnis'}${st.end ? ` · bis ${fmt(st.end)}` : ''}`, href: cur.href, cta: 'Öffnen', due: st.end })
        }
      }
    }
  }

  // Transkript-Rhythmus: alle 4 Wochen ein neues Gespräch auswerten
  const s = await scoreSeries(m.email)
  const last = s.at(-1)
  const age = last ? Math.floor((Date.now() - Date.parse(last.date)) / 864e5) : null
  if (age === null || age >= 28) {
    todos.push({ id: 'transcript', kind: 'transcript', title: 'Neues Transkript hochladen', sub: age === null ? 'Dein erster Gesprächs-Score' : `letztes vor ${Math.round(age / 7)} Wochen · hält Deinen Score aktuell`, href: '/gespraechs-check', cta: 'Hochladen', due: null })
  }
  if (!m.avatarUrl) todos.push({ id: 'profile', kind: 'profile', title: 'Profilfoto hochladen', sub: 'damit Dein Team Dich in der Community erkennt', href: '/dashboard/profile', cta: 'Zum Profil', due: null })

  return { next, todos: todos.slice(0, 4), timeline }
}

export function fmt(d: string) {
  const x = new Date(d)
  return x.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
}

/** Skill-Level der Academy (Karategürtel von der Academy-Seite). */
export const BELTS = [
  { key: 'apprentice', name: 'Apprentice', belt: 'white', months: '0–3 Monate' },
  { key: 'junior', name: 'Junior', belt: 'yellow', months: '3–6 Monate' },
  { key: 'professional', name: 'Professional', belt: 'orange', months: '6–12 Monate' },
  { key: 'senior', name: 'Senior', belt: 'green', months: '12–18 Monate' },
  { key: 'master', name: 'Master', belt: 'blue', months: '18+ Monate' },
  { key: 'exponential', name: 'Exponential Seller', belt: 'black', months: 'von Peers gewählt' },
] as const
