import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { freeSlots } from './graph'
import { getEventType, listEventTypes, type EventType } from './types-store'
import { bookingCountsByDay } from './bookings-store'

function rowsOf<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[]
  if (r && typeof r === 'object' && 'rows' in r) { const x = (r as { rows: unknown }).rows; if (Array.isArray(x)) return x as T[] }
  return []
}

export const CACHE_STALE_MS = 8 * 3600 * 1000 // nach 8h lazy neu rechnen

let ensured = false
export async function ensureCacheTable() {
  if (ensured) return
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS schedule_availability_cache (
      owner_slug text NOT NULL, type_slug text NOT NULL,
      slots jsonb NOT NULL DEFAULT '[]', connected boolean NOT NULL DEFAULT true,
      refreshed_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (owner_slug, type_slug)
    )`)
  ensured = true
}

export type Cached = { slots: string[]; connected: boolean; refreshedAt: number } | null

export async function getCached(owner: string, type: string): Promise<Cached> {
  await ensureCacheTable()
  const r = rowsOf<Record<string, unknown>>(await db.execute(sql`SELECT slots, connected, refreshed_at FROM schedule_availability_cache WHERE owner_slug=${owner} AND type_slug=${type} LIMIT 1`))
  if (!r[0]) return null
  const raw = r[0].slots
  const slots = Array.isArray(raw) ? raw as string[] : (typeof raw === 'string' ? JSON.parse(raw) : [])
  return { slots, connected: Boolean(r[0].connected), refreshedAt: new Date(r[0].refreshed_at as string).getTime() }
}

export async function setCached(owner: string, type: string, slots: string[], connected: boolean) {
  await ensureCacheTable()
  await db.execute(sql`
    INSERT INTO schedule_availability_cache (owner_slug, type_slug, slots, connected, refreshed_at)
    VALUES (${owner}, ${type}, ${JSON.stringify(slots)}::jsonb, ${connected}, now())
    ON CONFLICT (owner_slug, type_slug) DO UPDATE SET slots=EXCLUDED.slots, connected=EXCLUDED.connected, refreshed_at=now()`)
}

// Frisch gebuchten Slot sofort aus dem Cache ziehen
export async function removeSlotFromCache(owner: string, type: string, slot: string) {
  await ensureCacheTable()
  await db.execute(sql`UPDATE schedule_availability_cache SET slots = slots - ${slot} WHERE owner_slug=${owner} AND type_slug=${type}`).catch(() => {})
}

// Live berechnen (inkl. Tageslimit) und cachen
export async function computeAndCache(owner: string, type: string, et?: EventType): Promise<{ slots: string[]; connected: boolean }> {
  const t = et || await getEventType(owner, type)
  if (!t) return { slots: [], connected: false }
  const blocked = new Set<string>()
  if (t.maxPerDay != null) { const counts = await bookingCountsByDay(owner, type); for (const [d, n] of Object.entries(counts)) if (n >= t.maxPerDay) blocked.add(d) }
  const { slots, connected } = await freeSlots(owner, { durationMin: t.durationMin, bufferBeforeMin: t.bufferBeforeMin, bufferAfterMin: t.bufferAfterMin, blockedDayKeys: blocked })
  if (connected) await setCached(owner, type, slots, true).catch(() => {})
  return { slots, connected }
}

// Cron: alle buchbaren Typen neu berechnen
export async function refreshAllCaches(): Promise<{ refreshed: number; skipped: number }> {
  const all = await listEventTypes()
  let refreshed = 0, skipped = 0
  for (const t of all) {
    if (t.visibility === 'offline') { skipped++; continue }
    const { connected } = await computeAndCache(t.ownerSlug, t.slug, t)
    if (connected) refreshed++; else skipped++
  }
  return { refreshed, skipped }
}

export async function invalidatePerson(slug: string) {
  await ensureCacheTable()
  await db.execute(sql`DELETE FROM schedule_availability_cache WHERE owner_slug = ${slug} OR owner_slug = 'team'`).catch(() => {})
}
export async function clearAllCache() {
  await ensureCacheTable()
  await db.execute(sql`DELETE FROM schedule_availability_cache`).catch(() => {})
}
