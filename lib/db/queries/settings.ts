import { db } from '@/lib/db'
import { siteSettings } from '@/lib/db/schema'
import { eq, sql, asc } from 'drizzle-orm'

/**
 * Site-wide key-value settings, admin-editable.
 * Self-healing: ensures the table exists on every read/write.
 */

const DEFAULTS: Record<string, string> = {
  // Calendly wurde durch das eigene /schedule-System ersetzt
  'calendly.markus': '/schedule/markus/kennenlernen-45',
  'calendly.aljona': '/schedule/aljona/kennenlernen-45',
}

let tableEnsured = false
async function ensureTable() {
  if (tableEnsured) return
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS site_settings (
      key text PRIMARY KEY,
      value text NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    )
  `)
  tableEnsured = true
}

export async function getSetting(key: string, fallback?: string): Promise<string> {
  let value = ''
  try {
    await ensureTable()
    const [row] = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1)
    if (row?.value) value = row.value
  } catch (err) {
    console.error('[settings] getSetting failed for', key, err)
  }
  if (!value) value = fallback ?? DEFAULTS[key] ?? ''
  // Alte Calendly-Links automatisch aufs neue /schedule-System mappen
  if (/calendly\.com/i.test(value) && DEFAULTS[key] && !/calendly\.com/i.test(DEFAULTS[key])) {
    value = DEFAULTS[key]
  }
  return value
}

export async function setSetting(key: string, value: string): Promise<void> {
  await ensureTable()
  await db.insert(siteSettings)
    .values({ key, value })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: { value, updatedAt: new Date() },
    })
}

export async function getAllSettings(): Promise<Array<{ key: string; value: string }>> {
  try {
    await ensureTable()
    const rows = await db.select().from(siteSettings).orderBy(asc(siteSettings.key))
    // Merge with defaults: ensure keys that don't exist yet show their default value
    const map = new Map(rows.map((r) => [r.key, r.value]))
    for (const [k, v] of Object.entries(DEFAULTS)) {
      if (!map.has(k)) map.set(k, v)
    }
    return Array.from(map.entries()).map(([key, value]) => ({ key, value }))
  } catch (err) {
    console.error('[settings] getAllSettings failed', err)
    return Object.entries(DEFAULTS).map(([key, value]) => ({ key, value }))
  }
}

export const SETTING_DEFAULTS = DEFAULTS
