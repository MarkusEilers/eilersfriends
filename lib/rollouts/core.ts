import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { ensureRolloutSchema } from './schema'

/* ── Typen ──────────────────────────────────────────────────────────────── */

export interface StepI18n { title?: string; subtitle?: string; description?: string; inputs?: string[]; outputs?: string[] }
export interface SnapStep {
  id: string; phase_id: string; n: number; title: string; subtitle: string | null; description: string | null
  teams: string[]; inputs: string[]; outputs: string[]; milestones: string[]
  headline: string | null; io_status: string | null; duration_h: number | null
  requires_step_id: string | null; links: Record<string, string>; i18n: Record<string, StepI18n>
}
export interface SnapPhase { id: string; name: string; goal: string | null; i18n: Record<string, { name?: string; goal?: string }> }
export interface Snapshot {
  program: { id: string; slug: string; name: string; tagline: string | null; i18n: Record<string, { name?: string; tagline?: string }> }
  phases: SnapPhase[]; steps: SnapStep[]
}
export interface Override extends StepI18n { note?: string; challenge?: string; draft?: boolean }

export type Cadence = 'weekly' | 'biweekly'
export interface Break { from: string; to: string; label?: string }

/** Rollen-Keys der Programme: Teamnamen aus dem Editor → stabile Schlüssel. */
export function roleKey(team: string): string {
  const t = team.trim().toLowerCase()
  if (t.startsWith('market')) return 'marketing'
  if (t.startsWith('sales') || t.startsWith('vertrieb')) return 'sales'
  if (t.startsWith('program') || t.startsWith('produkt') || t.startsWith('product') || t.includes('gtm')) return 'programm'
  return t
}

const stripNum = (s: string) => s.replace(/^\s*\d+\s*·\s*/, '').trim()

/* ── Versionen ──────────────────────────────────────────────────────────── */

/** Liest den aktuellen Stand eines Programms als Schnappschuss. */
export async function snapshotProgram(programId: string): Promise<Snapshot> {
  const [p] = (await db.execute(sql`SELECT id, slug, name, tagline, checkout_content FROM programs WHERE id=${programId}`)) as unknown as
    { id: string; slug: string; name: string; tagline: string | null; checkout_content: Record<string, unknown> | null }[]
  if (!p) throw new Error('Programm nicht gefunden')
  const phases = (await db.execute(sql`SELECT id, name, goal FROM program_phases WHERE program_id=${programId} ORDER BY sort_order`)) as unknown as { id: string; name: string; goal: string | null }[]
  const steps = (await db.execute(sql`
    SELECT s.id, s.phase_id, s.title, s.description, s.duration_h, s.requires_step_id, s.meta
    FROM program_steps s JOIN program_phases ph ON ph.id=s.phase_id
    WHERE s.program_id=${programId} ORDER BY ph.sort_order, s.sort_order`)) as unknown as
    { id: string; phase_id: string; title: string; description: string | null; duration_h: string | null; requires_step_id: string | null; meta: Record<string, unknown> | null }[]
  const progI18n = ((p.checkout_content ?? {}) as { i18n?: Snapshot['program']['i18n'] }).i18n ?? {}
  return {
    program: { id: p.id, slug: p.slug, name: p.name, tagline: p.tagline, i18n: progI18n },
    phases: phases.map((ph) => ({ id: ph.id, name: ph.name, goal: ph.goal, i18n: {} })),
    steps: steps.map((s, i) => {
      const m = (s.meta ?? {}) as Record<string, unknown>
      const arr = (v: unknown) => (Array.isArray(v) ? (v as unknown[]).map(String) : [])
      return {
        id: s.id, phase_id: s.phase_id,
        n: typeof m.code_n === 'number' ? (m.code_n as number) : i + 1,
        title: stripNum(s.title), subtitle: (m.headline as string) || null, description: s.description,
        teams: arr(m.teams).map(roleKey), inputs: arr(m.inputs), outputs: arr(m.outputs), milestones: arr(m.milestones),
        headline: (m.headline as string) || null, io_status: (m.io_status as string) || null,
        duration_h: s.duration_h === null ? null : Number(s.duration_h),
        requires_step_id: s.requires_step_id,
        links: (m.links as Record<string, string>) ?? {},
        i18n: (m.i18n as Record<string, StepI18n>) ?? {},
      }
    }),
  }
}

/** Friert den aktuellen Stand als neue Version ein. */
export async function releaseVersion(programId: string, opts: { version?: string; changelog?: string; by?: string | null } = {}) {
  await ensureRolloutSchema()
  const snap = await snapshotProgram(programId)
  const d = new Date()
  const base = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`
  const [{ n }] = (await db.execute(sql`SELECT count(*)::int AS n FROM program_versions WHERE program_id=${programId} AND version LIKE ${base + '-%'}`)) as unknown as { n: number }[]
  const version = opts.version ?? `${base}-${n + 1}`
  const [row] = (await db.execute(sql`
    INSERT INTO program_versions (program_id, version, snapshot, changelog, released_by)
    VALUES (${programId}, ${version}, ${JSON.stringify(snap)}::jsonb, ${opts.changelog ?? null}, ${opts.by ?? null})
    RETURNING id, version`)) as unknown as { id: string; version: string }[]
  return row
}

export async function latestVersion(programId: string): Promise<{ id: string; version: string } | null> {
  await ensureRolloutSchema()
  const rows = (await db.execute(sql`SELECT id, version FROM program_versions WHERE program_id=${programId} AND status='released' ORDER BY released_at DESC LIMIT 1`)) as unknown as { id: string; version: string }[]
  return rows[0] ?? null
}

export async function getSnapshot(versionId: string): Promise<Snapshot> {
  const [r] = (await db.execute(sql`SELECT snapshot FROM program_versions WHERE id=${versionId}`)) as unknown as { snapshot: Snapshot }[]
  return r.snapshot
}

/* ── Termine ────────────────────────────────────────────────────────────── */

const iso = (d: Date) => d.toISOString().slice(0, 10)
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setUTCDate(x.getUTCDate() + n); return x }

/** Nächster Montag ab (inkl.) Datum. */
export function mondayOnOrAfter(dateIso: string): string {
  const d = new Date(dateIso + 'T00:00:00Z')
  const wd = d.getUTCDay() // 0 So … 1 Mo
  return iso(addDays(d, (8 - wd) % 7))
}

/**
 * Ein Schritt je Kadenz-Fenster: weekly = 1 Woche, biweekly = 2 Wochen.
 * Ein Fenster, das in eine Pause fällt, rutscht hinter die Pause.
 */
export function schedule(count: number, startIso: string, cadence: Cadence, breaks: Break[] = []): { start: string; end: string }[] {
  const len = cadence === 'weekly' ? 7 : 14
  let cur = new Date(mondayOnOrAfter(startIso) + 'T00:00:00Z')
  const out: { start: string; end: string }[] = []
  for (let i = 0; i < count; i++) {
    for (let guard = 0; guard < 60; guard++) {
      const end = addDays(cur, len - 3) // bis Freitag
      const hit = breaks.find((b) => !(iso(end) < b.from || iso(cur) > b.to))
      if (!hit) break
      cur = new Date(mondayOnOrAfter(iso(addDays(new Date(hit.to + 'T00:00:00Z'), 1))) + 'T00:00:00Z')
    }
    out.push({ start: iso(cur), end: iso(addDays(cur, len - 3)) })
    cur = addDays(cur, len)
  }
  return out
}

/* ── Rollouts ───────────────────────────────────────────────────────────── */

/** Was am Schritt gilt: Version, Übersetzung, kundenspezifische Abweichung. */
export function effective(step: SnapStep, locale: string, ov: Override = {}) {
  const tr = (locale !== 'de' && step.i18n?.[locale]) || {}
  return {
    title: ov.title ?? tr.title ?? step.title,
    subtitle: ov.subtitle ?? tr.subtitle ?? step.subtitle ?? null,
    description: ov.description ?? tr.description ?? step.description ?? '',
    inputs: ov.inputs ?? tr.inputs ?? step.inputs,
    outputs: ov.outputs ?? tr.outputs ?? step.outputs,
    draft: ov.draft ?? (step.io_status === 'vorschlag' || step.io_status === 'teilweise_quelle'),
  }
}

/** Häkchen aus Input/Output neu anlegen — erledigte Punkte gleichen Wortlauts bleiben erhalten. */
export async function rebuildItems(rolloutStepId: string, inputs: string[], outputs: string[]) {
  const old = (await db.execute(sql`SELECT kind, label, done_at, done_by, done_by_name FROM rollout_items WHERE rollout_step_id=${rolloutStepId}`)) as unknown as
    { kind: string; label: string; done_at: string | null; done_by: string | null; done_by_name: string | null }[]
  await db.execute(sql`DELETE FROM rollout_items WHERE rollout_step_id=${rolloutStepId}`)
  const rows = [...inputs.map((l) => ['input', l] as const), ...outputs.map((l) => ['output', l] as const)]
  for (const [i, [kind, label]] of rows.entries()) {
    const prev = old.find((o) => o.kind === kind && o.label === label)
    await db.execute(sql`
      INSERT INTO rollout_items (rollout_step_id, kind, label, sort_order, done_at, done_by, done_by_name)
      VALUES (${rolloutStepId}, ${kind}, ${label}, ${i}, ${prev?.done_at ?? null}, ${prev?.done_by ?? null}, ${prev?.done_by_name ?? null})`)
  }
}

export interface CreateRolloutInput {
  companyId: string; programId: string; versionId?: string; offerId?: string | null
  title?: string; codePrefix?: string; color?: string; startDate: string; cadence?: Cadence
  breaks?: Break[]; locale?: string; createdFrom?: 'offer' | 'manual' | 'import'; meta?: Record<string, unknown>
  /** Feste Termine je Code (z. B. aus einem bestehenden Plan) statt berechneter. */
  dates?: Record<string, { start: string; end: string }>
  overrides?: Record<string, Override & { joint_code?: string }>
}

const PREFIX: Record<string, string> = { 'salesmade-13-step-gtm': 'G', 'salesmade-academy-premium': 'A', 'social-media-rockstar': 'R' }
const COLOR: Record<string, string> = { G: '#1A5FD4', A: '#0E9DDD', R: '#F5C518' }

export async function createRollout(input: CreateRolloutInput) {
  await ensureRolloutSchema()
  const version = input.versionId ? { id: input.versionId } : (await latestVersion(input.programId)) ?? (await releaseVersion(input.programId, { changelog: 'Erste Version (automatisch beim ersten Rollout)' }))
  const snap = await getSnapshot(version.id)
  const prefix = input.codePrefix ?? PREFIX[snap.program.slug] ?? snap.program.name.charAt(0).toUpperCase()
  const cadence = input.cadence ?? 'biweekly'
  const locale = input.locale ?? 'de'
  const slots = schedule(snap.steps.length, input.startDate, cadence, input.breaks ?? [])
  const name = (locale !== 'de' && snap.program.i18n?.[locale]?.name) || snap.program.name

  const [r] = (await db.execute(sql`
    INSERT INTO rollouts (company_id, program_id, program_version_id, offer_id, code_prefix, color, title, status,
                          start_date, cadence, breaks, locale, created_from, meta)
    VALUES (${input.companyId}, ${input.programId}, ${version.id}, ${input.offerId ?? null}, ${prefix}, ${input.color ?? COLOR[prefix] ?? '#1A5FD4'},
            ${input.title ?? name}, 'active', ${input.startDate}, ${cadence}, ${JSON.stringify(input.breaks ?? [])}::jsonb, ${locale},
            ${input.createdFrom ?? 'manual'}, ${JSON.stringify(input.meta ?? {})}::jsonb)
    RETURNING id`)) as unknown as { id: string }[]

  let last = input.startDate
  for (const [i, st] of snap.steps.entries()) {
    const code = `${prefix}${st.n}`
    const when = input.dates?.[code] ?? slots[i]
    const ov = input.overrides?.[code] ?? {}
    const { joint_code, note, challenge, ...rest } = ov
    const [rs] = (await db.execute(sql`
      INSERT INTO rollout_steps (rollout_id, step_key, code, sort_order, planned_start, planned_end, joint_code, override, note, challenge)
      VALUES (${r.id}, ${st.id}, ${code}, ${i}, ${when.start}, ${when.end}, ${joint_code ?? null}, ${JSON.stringify(rest)}::jsonb, ${note ?? null}, ${challenge ?? null})
      RETURNING id`)) as unknown as { id: string }[]
    const eff = effective(st, locale, rest)
    await rebuildItems(rs.id, eff.inputs, eff.outputs)
    if (when.end > last) last = when.end
  }
  await db.execute(sql`UPDATE rollouts SET end_date=${last} WHERE id=${r.id}`)
  return { id: r.id, versionId: version.id }
}

/** Termine neu berechnen (nach angenommener Kadenz-/Startänderung). Erledigte Schritte bleiben stehen. */
export async function reschedule(rolloutId: string) {
  const [r] = (await db.execute(sql`SELECT start_date::text AS start_date, cadence, breaks FROM rollouts WHERE id=${rolloutId}`)) as unknown as { start_date: string; cadence: Cadence; breaks: Break[] }[]
  const steps = (await db.execute(sql`SELECT id, status, planned_start::text AS planned_start FROM rollout_steps WHERE rollout_id=${rolloutId} ORDER BY sort_order`)) as unknown as { id: string; status: string; planned_start: string }[]
  const open = steps.filter((s) => s.status !== 'done')
  const lastDone = steps.filter((s) => s.status === 'done').map((s) => s.planned_start).sort().pop()
  const from = lastDone && lastDone >= r.start_date ? iso(addDays(new Date(lastDone + 'T00:00:00Z'), 7)) : r.start_date
  const slots = schedule(open.length, from, r.cadence, r.breaks ?? [])
  for (const [i, s] of open.entries()) {
    await db.execute(sql`UPDATE rollout_steps SET planned_start=${slots[i].start}, planned_end=${slots[i].end}, updated_at=now() WHERE id=${s.id}`)
  }
  await db.execute(sql`UPDATE rollouts SET end_date=(SELECT max(planned_end) FROM rollout_steps WHERE rollout_id=${rolloutId}), updated_at=now() WHERE id=${rolloutId}`)
}
