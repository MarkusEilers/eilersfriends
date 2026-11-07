import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

/**
 * Änderungsprotokoll für Seiten aus dem Backend (Landingpages, Blog).
 * Jede Bearbeitungssitzung ist eine Version: Änderungen derselben Person innerhalb
 * von 20 Minuten werden zu einer Version zusammengefasst, sonst zählt die Version hoch.
 * Code-Seiten bekommen Version und Datum aus der Git-Historie (lib/pagetree/code-pages.json).
 */
let ready = false
async function ensure() {
  if (ready) return
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS page_change_log (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      page_key    TEXT NOT NULL,
      kind        TEXT NOT NULL,
      version     INT NOT NULL,
      changed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      actor       TEXT,
      notes       TEXT[] NOT NULL DEFAULT '{}'
    )`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS page_change_log_key ON page_change_log (page_key, version DESC)`)
  ready = true
}

type Row = Record<string, unknown>
const rows = (r: unknown) => (Array.isArray(r) ? r : ((r as { rows?: Row[] })?.rows ?? [])) as Row[]

export async function logPageChange(kind: 'lp' | 'blog', id: string, note: string) {
  try {
    await ensure()
    const s = await auth().catch(() => null)
    const actor = s?.user?.name || s?.user?.email || 'System'
    const key = `${kind}:${id}`
    const last = rows(await db.execute(sql`SELECT id, version, actor, changed_at FROM page_change_log WHERE page_key = ${key} ORDER BY version DESC LIMIT 1`))[0]
    if (last && last.actor === actor && Date.now() - new Date(String(last.changed_at)).getTime() < 20 * 60 * 1000) {
      await db.execute(sql`UPDATE page_change_log SET changed_at = now(), notes = CASE WHEN ${note} = ANY(notes) THEN notes ELSE array_append(notes, ${note}) END WHERE id = ${String(last.id)}`)
      return
    }
    const v = last ? Number(last.version) + 1 : 1
    await db.execute(sql`INSERT INTO page_change_log (page_key, kind, version, actor, notes) VALUES (${key}, ${kind}, ${v}, ${actor}, ARRAY[${note}]::text[])`)
  } catch (e) {
    console.error('[pagetree] log', e)
  }
}

/** Seite einer Sektion ermitteln und protokollieren. */
export async function logLpSection(sectionId: string, note: string) {
  const r = rows(await db.execute(sql`SELECT landing_page_id FROM landing_page_sections WHERE id = ${sectionId}`).catch(() => []))[0]
  if (r?.landing_page_id) await logPageChange('lp', String(r.landing_page_id), note)
}

export interface LogEntry { version: number; changedAt: string; actor: string | null; notes: string[] }
export async function pageLogs(): Promise<Map<string, LogEntry[]>> {
  await ensure()
  const r = rows(await db.execute(sql`
    SELECT page_key, version, changed_at, actor, notes FROM (
      SELECT *, row_number() OVER (PARTITION BY page_key ORDER BY version DESC) rn FROM page_change_log) x
    WHERE rn <= 6 ORDER BY page_key, version DESC`))
  const m = new Map<string, LogEntry[]>()
  for (const x of r) {
    const k = String(x.page_key)
    if (!m.has(k)) m.set(k, [])
    m.get(k)!.push({ version: Number(x.version), changedAt: String(x.changed_at), actor: (x.actor as string) ?? null, notes: (x.notes as string[]) ?? [] })
  }
  return m
}
