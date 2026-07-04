import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { encrypt, decrypt } from './crypto'

function rowsOf<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[]
  if (r && typeof r === 'object' && 'rows' in r) { const x = (r as { rows: unknown }).rows; if (Array.isArray(x)) return x as T[] }
  return []
}

export async function ensureScheduleTable() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS schedule_connections (
      person_slug TEXT PRIMARY KEY,
      ms_email TEXT,
      refresh_token_enc TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'connected',
      connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`)
}

export type ConnStatus = { personSlug: string; msEmail: string | null; status: string; connectedAt: string }

export async function getConnectionStatus(slug: string): Promise<ConnStatus | null> {
  await ensureScheduleTable()
  const r = rowsOf<Record<string, unknown>>(await db.execute(
    sql`SELECT person_slug, ms_email, status, connected_at FROM schedule_connections WHERE person_slug = ${slug} LIMIT 1`))
  if (!r[0]) return null
  return { personSlug: String(r[0].person_slug), msEmail: (r[0].ms_email as string) ?? null, status: String(r[0].status), connectedAt: String(r[0].connected_at) }
}

export async function getRefreshToken(slug: string): Promise<string | null> {
  await ensureScheduleTable()
  const r = rowsOf<Record<string, unknown>>(await db.execute(
    sql`SELECT refresh_token_enc FROM schedule_connections WHERE person_slug = ${slug} AND status = 'connected' LIMIT 1`))
  if (!r[0]) return null
  try { return decrypt(String(r[0].refresh_token_enc)) } catch { return null }
}

export async function saveConnection(slug: string, refreshToken: string, msEmail: string | null) {
  await ensureScheduleTable()
  const enc = encrypt(refreshToken)
  await db.execute(sql`
    INSERT INTO schedule_connections (person_slug, ms_email, refresh_token_enc, status, connected_at, updated_at)
    VALUES (${slug}, ${msEmail}, ${enc}, 'connected', NOW(), NOW())
    ON CONFLICT (person_slug) DO UPDATE SET ms_email = EXCLUDED.ms_email, refresh_token_enc = EXCLUDED.refresh_token_enc,
      status = 'connected', connected_at = NOW(), updated_at = NOW()`)
}

export async function markRevoked(slug: string) {
  await ensureScheduleTable()
  await db.execute(sql`UPDATE schedule_connections SET status = 'revoked', updated_at = NOW() WHERE person_slug = ${slug}`)
}

// ─── Zusätzliche (verbundene) Kalender pro Person — Verfügbarkeits-Filter ─────
export async function ensureCalendarsTable() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS schedule_calendars (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      person_slug text NOT NULL, ms_email text NOT NULL, tenant_id text, label text,
      refresh_token_enc text NOT NULL, status text NOT NULL DEFAULT 'connected',
      active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(person_slug, ms_email))`)
}

export async function saveExtraCalendar(slug: string, email: string, tenantId: string | null, refreshToken: string) {
  await ensureCalendarsTable()
  const enc = encrypt(refreshToken)
  await db.execute(sql`
    INSERT INTO schedule_calendars (person_slug, ms_email, tenant_id, refresh_token_enc, status, active, updated_at)
    VALUES (${slug}, ${email}, ${tenantId}, ${enc}, 'connected', true, now())
    ON CONFLICT (person_slug, ms_email) DO UPDATE SET tenant_id = EXCLUDED.tenant_id,
      refresh_token_enc = EXCLUDED.refresh_token_enc, status = 'connected', updated_at = now()`)
}

export type ExtraCalToken = { id: string; msEmail: string; tenantId: string | null; refreshToken: string }
export async function getActiveExtraCalendars(slug: string): Promise<ExtraCalToken[]> {
  await ensureCalendarsTable()
  const r = rowsOf<Record<string, unknown>>(await db.execute(
    sql`SELECT id, ms_email, tenant_id, refresh_token_enc FROM schedule_calendars WHERE person_slug = ${slug} AND status = 'connected' AND active = true`))
  const out: ExtraCalToken[] = []
  for (const x of r) { try { out.push({ id: String(x.id), msEmail: String(x.ms_email), tenantId: (x.tenant_id as string) ?? null, refreshToken: decrypt(String(x.refresh_token_enc)) }) } catch { /* skip */ } }
  return out
}

export type ExtraCalInfo = { id: string; msEmail: string; tenantId: string | null; status: string; active: boolean; createdAt: string }
export async function listExtraCalendars(slug: string): Promise<ExtraCalInfo[]> {
  await ensureCalendarsTable()
  const r = rowsOf<Record<string, unknown>>(await db.execute(
    sql`SELECT id, ms_email, tenant_id, status, active, created_at FROM schedule_calendars WHERE person_slug = ${slug} ORDER BY created_at`))
  return r.map(x => ({ id: String(x.id), msEmail: String(x.ms_email), tenantId: (x.tenant_id as string) ?? null, status: String(x.status), active: Boolean(x.active), createdAt: String(x.created_at) }))
}

export async function setExtraCalendarRefresh(id: string, refreshToken: string) {
  await ensureCalendarsTable()
  await db.execute(sql`UPDATE schedule_calendars SET refresh_token_enc = ${encrypt(refreshToken)}, status='connected', updated_at = now() WHERE id = ${id}`)
}
export async function setExtraCalendarActive(id: string, active: boolean) {
  await ensureCalendarsTable()
  await db.execute(sql`UPDATE schedule_calendars SET active = ${active}, updated_at = now() WHERE id = ${id}`)
}
export async function markExtraCalendarRevoked(id: string) {
  await ensureCalendarsTable()
  await db.execute(sql`UPDATE schedule_calendars SET status='revoked', updated_at = now() WHERE id = ${id}`)
}
export async function removeExtraCalendar(id: string) {
  await ensureCalendarsTable()
  await db.execute(sql`DELETE FROM schedule_calendars WHERE id = ${id}`)
}
