import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

function rowsOf<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[]
  if (r && typeof r === 'object' && 'rows' in r) { const x = (r as { rows: unknown }).rows; if (Array.isArray(x)) return x as T[] }
  return []
}

let ensured = false
export async function ensureVoiceTables() {
  if (ensured) return
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS voice_team_status (
      person_slug text PRIMARY KEY, status text NOT NULL, note text, until timestamptz, updated_at timestamptz NOT NULL DEFAULT now()
    )`)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS voice_activities (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      type text NOT NULL DEFAULT 'call', dw int, person_slug text,
      name text, phone text, email text, topic text, summary text, transcript text,
      meta jsonb, created_at timestamptz NOT NULL DEFAULT now()
    )`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_voice_act_created ON voice_activities(created_at DESC)`)
  ensured = true
}

export async function setTeamStatus(slug: string, status: string, until: string | null, note: string | null) {
  await ensureVoiceTables()
  await db.execute(sql`
    INSERT INTO voice_team_status (person_slug, status, note, until, updated_at) VALUES (${slug}, ${status}, ${note}, ${until}, now())
    ON CONFLICT (person_slug) DO UPDATE SET status=EXCLUDED.status, note=EXCLUDED.note, until=EXCLUDED.until, updated_at=now()`)
}

export type Override = { status: string; until: string | null; note: string | null }
export async function getStatusOverrides(): Promise<Record<string, Override>> {
  await ensureVoiceTables()
  const r = rowsOf<Record<string, unknown>>(await db.execute(sql`SELECT person_slug, status, until, note FROM voice_team_status`))
  const out: Record<string, Override> = {}
  const now = Date.now()
  for (const x of r) {
    const until = x.until ? new Date(x.until as string).toISOString() : null
    if (until && new Date(until).getTime() < now) continue // abgelaufen
    out[String(x.person_slug)] = { status: String(x.status), until, note: (x.note as string) ?? null }
  }
  return out
}

export async function logActivity(a: { type?: string; dw?: number | null; personSlug?: string | null; name?: string | null; phone?: string | null; email?: string | null; topic?: string | null; summary?: string | null; transcript?: string | null; meta?: unknown }) {
  await ensureVoiceTables()
  await db.execute(sql`
    INSERT INTO voice_activities (type, dw, person_slug, name, phone, email, topic, summary, transcript, meta)
    VALUES (${a.type || 'call'}, ${a.dw ?? null}, ${a.personSlug ?? null}, ${a.name ?? null}, ${a.phone ?? null}, ${a.email ?? null}, ${a.topic ?? null}, ${a.summary ?? null}, ${a.transcript ?? null}, ${a.meta ? JSON.stringify(a.meta) : null}::jsonb)`)
}

export type Activity = { id: string; type: string; dw: number | null; personSlug: string | null; name: string | null; phone: string | null; email: string | null; topic: string | null; summary: string | null; createdAt: string }
export async function listActivities(limit = 100): Promise<Activity[]> {
  await ensureVoiceTables()
  const r = rowsOf<Record<string, unknown>>(await db.execute(sql`SELECT id, type, dw, person_slug, name, phone, email, topic, summary, created_at FROM voice_activities ORDER BY created_at DESC LIMIT ${limit}`))
  return r.map(x => ({ id: String(x.id), type: String(x.type), dw: x.dw == null ? null : Number(x.dw), personSlug: (x.person_slug as string) ?? null, name: (x.name as string) ?? null, phone: (x.phone as string) ?? null, email: (x.email as string) ?? null, topic: (x.topic as string) ?? null, summary: (x.summary as string) ?? null, createdAt: String(x.created_at) }))
}

export async function removeTeamStatus(slug: string) {
  await ensureVoiceTables()
  await db.execute(sql`DELETE FROM voice_team_status WHERE person_slug = ${slug}`)
}
