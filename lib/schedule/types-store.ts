import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

function rowsOf<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[]
  if (r && typeof r === 'object' && 'rows' in r) { const x = (r as { rows: unknown }).rows; if (Array.isArray(x)) return x as T[] }
  return []
}

export type Question = { id: string; label: string; type: 'text' | 'textarea' | 'select'; options?: string[]; required: boolean }
export type Reminder = { hoursBefore: number }
export type Visibility = 'live' | 'internal' | 'offline'

export type EventType = {
  id: string
  ownerSlug: string
  slug: string
  name: string
  description: string
  durationMin: number
  bufferBeforeMin: number
  bufferAfterMin: number
  maxPerDay: number | null
  visibility: Visibility
  infoText: string
  questions: Question[]
  reminders: Reminder[]
  sort: number
}

export type HostProfile = { personSlug: string; avatarUrl: string; intro: string }

let ensured = false
export async function ensureEventTypeTables() {
  if (ensured) return
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS schedule_event_types (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_slug text NOT NULL, slug text NOT NULL, name text NOT NULL,
      description text NOT NULL DEFAULT '', duration_min int NOT NULL DEFAULT 30,
      buffer_before_min int NOT NULL DEFAULT 0, buffer_after_min int NOT NULL DEFAULT 0,
      max_per_day int, visibility text NOT NULL DEFAULT 'live', info_text text NOT NULL DEFAULT '',
      questions jsonb NOT NULL DEFAULT '[]', reminders jsonb NOT NULL DEFAULT '[{"hoursBefore":24}]',
      sort int NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(owner_slug, slug)
    )`)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS schedule_host_profiles (
      person_slug text PRIMARY KEY, avatar_url text NOT NULL DEFAULT '', intro text NOT NULL DEFAULT '',
      updated_at timestamptz NOT NULL DEFAULT now()
    )`)
  ensured = true
}

function mapType(r: Record<string, unknown>): EventType {
  const parse = <T,>(v: unknown, d: T): T => { if (v == null) return d; if (typeof v === 'string') { try { return JSON.parse(v) as T } catch { return d } } return v as T }
  return {
    id: String(r.id), ownerSlug: String(r.owner_slug), slug: String(r.slug), name: String(r.name),
    description: String(r.description ?? ''), durationMin: Number(r.duration_min),
    bufferBeforeMin: Number(r.buffer_before_min), bufferAfterMin: Number(r.buffer_after_min),
    maxPerDay: r.max_per_day == null ? null : Number(r.max_per_day),
    visibility: String(r.visibility) as Visibility, infoText: String(r.info_text ?? ''),
    questions: parse<Question[]>(r.questions, []), reminders: parse<Reminder[]>(r.reminders, [{ hoursBefore: 24 }]),
    sort: Number(r.sort ?? 0),
  }
}

export async function listEventTypes(ownerSlug?: string): Promise<EventType[]> {
  await ensureEventTypeTables()
  const r = ownerSlug
    ? await db.execute(sql`SELECT * FROM schedule_event_types WHERE owner_slug = ${ownerSlug} ORDER BY sort, name`)
    : await db.execute(sql`SELECT * FROM schedule_event_types ORDER BY owner_slug, sort, name`)
  return rowsOf<Record<string, unknown>>(r).map(mapType)
}

// Für die öffentliche Liste: nur sichtbare (live). Interne nur per Direktlink.
export async function listBookableTypes(ownerSlug: string): Promise<EventType[]> {
  await ensureEventTypeTables()
  const r = await db.execute(sql`SELECT * FROM schedule_event_types WHERE owner_slug = ${ownerSlug} AND visibility = 'live' ORDER BY sort, name`)
  return rowsOf<Record<string, unknown>>(r).map(mapType)
}

export async function getEventType(ownerSlug: string, slug: string): Promise<EventType | null> {
  await ensureEventTypeTables()
  const r = rowsOf<Record<string, unknown>>(await db.execute(sql`SELECT * FROM schedule_event_types WHERE owner_slug = ${ownerSlug} AND slug = ${slug} LIMIT 1`))
  return r[0] ? mapType(r[0]) : null
}

export async function getEventTypeById(id: string): Promise<EventType | null> {
  await ensureEventTypeTables()
  const r = rowsOf<Record<string, unknown>>(await db.execute(sql`SELECT * FROM schedule_event_types WHERE id = ${id} LIMIT 1`))
  return r[0] ? mapType(r[0]) : null
}

export async function upsertEventType(t: {
  id?: string; ownerSlug: string; slug: string; name: string; description: string; durationMin: number;
  bufferBeforeMin: number; bufferAfterMin: number; maxPerDay: number | null; visibility: Visibility;
  infoText: string; questions: Question[]; reminders: Reminder[]; sort: number
}): Promise<void> {
  await ensureEventTypeTables()
  const q = JSON.stringify(t.questions); const rem = JSON.stringify(t.reminders)
  if (t.id) {
    await db.execute(sql`
      UPDATE schedule_event_types SET owner_slug=${t.ownerSlug}, slug=${t.slug}, name=${t.name}, description=${t.description},
        duration_min=${t.durationMin}, buffer_before_min=${t.bufferBeforeMin}, buffer_after_min=${t.bufferAfterMin},
        max_per_day=${t.maxPerDay}, visibility=${t.visibility}, info_text=${t.infoText},
        questions=${q}::jsonb, reminders=${rem}::jsonb, sort=${t.sort}, updated_at=now()
      WHERE id=${t.id}`)
  } else {
    await db.execute(sql`
      INSERT INTO schedule_event_types (owner_slug,slug,name,description,duration_min,buffer_before_min,buffer_after_min,max_per_day,visibility,info_text,questions,reminders,sort)
      VALUES (${t.ownerSlug},${t.slug},${t.name},${t.description},${t.durationMin},${t.bufferBeforeMin},${t.bufferAfterMin},${t.maxPerDay},${t.visibility},${t.infoText},${q}::jsonb,${rem}::jsonb,${t.sort})
      ON CONFLICT (owner_slug,slug) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description,
        duration_min=EXCLUDED.duration_min, buffer_before_min=EXCLUDED.buffer_before_min, buffer_after_min=EXCLUDED.buffer_after_min,
        max_per_day=EXCLUDED.max_per_day, visibility=EXCLUDED.visibility, info_text=EXCLUDED.info_text,
        questions=EXCLUDED.questions, reminders=EXCLUDED.reminders, sort=EXCLUDED.sort, updated_at=now()`)
  }
}

export async function deleteEventType(id: string): Promise<void> {
  await ensureEventTypeTables()
  await db.execute(sql`DELETE FROM schedule_event_types WHERE id = ${id}`)
}

// ── Host-Profile ─────────────────────────────────────────────
export async function getHostProfile(slug: string): Promise<HostProfile | null> {
  await ensureEventTypeTables()
  const r = rowsOf<Record<string, unknown>>(await db.execute(sql`SELECT person_slug, avatar_url, intro FROM schedule_host_profiles WHERE person_slug = ${slug} LIMIT 1`))
  if (!r[0]) return null
  return { personSlug: String(r[0].person_slug), avatarUrl: String(r[0].avatar_url ?? ''), intro: String(r[0].intro ?? '') }
}

export async function listHostProfiles(): Promise<HostProfile[]> {
  await ensureEventTypeTables()
  const r = rowsOf<Record<string, unknown>>(await db.execute(sql`SELECT person_slug, avatar_url, intro FROM schedule_host_profiles`))
  return r.map(x => ({ personSlug: String(x.person_slug), avatarUrl: String(x.avatar_url ?? ''), intro: String(x.intro ?? '') }))
}

export async function upsertHostProfile(slug: string, avatarUrl: string, intro: string): Promise<void> {
  await ensureEventTypeTables()
  await db.execute(sql`
    INSERT INTO schedule_host_profiles (person_slug, avatar_url, intro, updated_at) VALUES (${slug}, ${avatarUrl}, ${intro}, now())
    ON CONFLICT (person_slug) DO UPDATE SET avatar_url=EXCLUDED.avatar_url, intro=EXCLUDED.intro, updated_at=now()`)
}
