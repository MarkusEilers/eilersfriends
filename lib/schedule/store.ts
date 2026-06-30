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
