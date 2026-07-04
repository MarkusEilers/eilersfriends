import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { membersFor, personBySlug } from './config'

function rowsOf<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[]
  if (r && typeof r === 'object' && 'rows' in r) { const x = (r as { rows: unknown }).rows; if (Array.isArray(x)) return x as T[] }
  return []
}

// Woche: Wochentag Mo=0..So=6 -> Liste verfügbarer Intervalle [startMin, endMin] (Minuten ab Mitternacht, lokale Zeit)
export type Week = Record<number, Array<[number, number]>>

// Default: Mo–Fr 08:30–12:30 und 13:30–17:30, Wochenende gesperrt
export const DEFAULT_WEEK: Week = {
  0: [[510, 750], [810, 1050]], 1: [[510, 750], [810, 1050]], 2: [[510, 750], [810, 1050]],
  3: [[510, 750], [810, 1050]], 4: [[510, 750], [810, 1050]], 5: [], 6: [],
}
export const GRID_START = 480  // 08:00
export const GRID_END = 1200   // 20:00
export const GRID_STEP = 30

let ensured = false
export async function ensureAvailabilityTable() {
  if (ensured) return
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS schedule_availability (
      person_slug text PRIMARY KEY, week jsonb NOT NULL DEFAULT '{}', updated_at timestamptz NOT NULL DEFAULT now()
    )`)
  ensured = true
}

function normalize(raw: unknown): Week | null {
  if (!raw) return null
  const obj = typeof raw === 'string' ? JSON.parse(raw) : raw
  if (!obj || typeof obj !== 'object') return null
  const w: Week = {}
  let any = false
  for (let d = 0; d < 7; d++) {
    const arr = (obj as Record<string, unknown>)[String(d)] ?? (obj as Record<string, unknown>)[d]
    w[d] = Array.isArray(arr) ? (arr as unknown[]).map(iv => Array.isArray(iv) ? [Number((iv as number[])[0]), Number((iv as number[])[1])] as [number, number] : null).filter(Boolean) as [number, number][] : []
    if (w[d].length) any = true
  }
  return any || (obj && Object.keys(obj).length) ? w : null
}

export async function getWeek(slug: string): Promise<Week> {
  await ensureAvailabilityTable()
  const r = rowsOf<Record<string, unknown>>(await db.execute(sql`SELECT week FROM schedule_availability WHERE person_slug = ${slug} LIMIT 1`))
  const w = r[0] ? normalize(r[0].week) : null
  return w || DEFAULT_WEEK
}

export async function saveWeek(slug: string, week: Week) {
  await ensureAvailabilityTable()
  const clean: Week = {}
  for (let d = 0; d < 7; d++) clean[d] = mergeIntervals((week[d] || []).filter(iv => Array.isArray(iv) && iv.length === 2 && iv[1] > iv[0]))
  await db.execute(sql`
    INSERT INTO schedule_availability (person_slug, week, updated_at) VALUES (${slug}, ${JSON.stringify(clean)}::jsonb, now())
    ON CONFLICT (person_slug) DO UPDATE SET week = EXCLUDED.week, updated_at = now()`)
}

function mergeIntervals(ivs: [number, number][]): [number, number][] {
  const s = [...ivs].sort((a, b) => a[0] - b[0])
  const out: [number, number][] = []
  for (const iv of s) {
    const last = out[out.length - 1]
    if (last && iv[0] <= last[1]) last[1] = Math.max(last[1], iv[1])
    else out.push([iv[0], iv[1]])
  }
  return out
}

function intersectDay(a: [number, number][], b: [number, number][]): [number, number][] {
  const out: [number, number][] = []
  for (const x of a) for (const y of b) {
    const s = Math.max(x[0], y[0]), e = Math.min(x[1], y[1])
    if (e > s) out.push([s, e])
  }
  return mergeIntervals(out)
}

// Verfügbare Intervalle je Wochentag für Person oder Team (Schnittmenge der Mitglieder)
export async function intervalsForOwner(slug: string): Promise<Week> {
  const members = personBySlug(slug) ? [slug] : membersFor(slug).map(p => p.slug)
  if (members.length === 0) return DEFAULT_WEEK
  const weeks = await Promise.all(members.map(m => getWeek(m)))
  const result: Week = {}
  for (let d = 0; d < 7; d++) {
    let acc = weeks[0][d] || []
    for (let i = 1; i < weeks.length; i++) acc = intersectDay(acc, weeks[i][d] || [])
    result[d] = acc
  }
  return result
}
