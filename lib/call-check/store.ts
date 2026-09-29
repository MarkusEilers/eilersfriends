import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { createHash, randomBytes } from 'crypto'

/**
 * Storage for the Gesprächs-Check.
 *
 * The transcript is never stored. Only the result (scores, findings and short
 * quotes the model picked) is kept, plus what we need for the list and for
 * abuse protection. That is what the consent text promises; keep it that way.
 */

let ready = false
export async function ensureCallCheckTable() {
  if (ready) return
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS call_checks (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      public_id     TEXT NOT NULL UNIQUE,
      email         TEXT NOT NULL,
      first_name    TEXT,
      locale        TEXT NOT NULL DEFAULT 'de',
      seller_label  TEXT,
      newsletter    BOOLEAN NOT NULL DEFAULT false,
      consent_at    TIMESTAMPTZ NOT NULL,
      word_count    INT NOT NULL DEFAULT 0,
      metrics       JSONB,
      result        JSONB,
      model         TEXT,
      tokens_in     INT NOT NULL DEFAULT 0,
      tokens_out    INT NOT NULL DEFAULT 0,
      cost_eur      NUMERIC(10,4) NOT NULL DEFAULT 0,
      ip_hash       TEXT,
      status        TEXT NOT NULL DEFAULT 'running',
      error         TEXT,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS call_checks_email ON call_checks (lower(email), created_at DESC)`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS call_checks_ip ON call_checks (ip_hash, created_at DESC)`)
  ready = true
}

export function hashIp(ip: string | null): string | null {
  if (!ip) return null
  const salt = process.env.CALL_CHECK_SALT ?? process.env.AUTH_SECRET ?? 'call-check'
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32)
}

export function newPublicId(): string {
  return randomBytes(16).toString('base64url')
}

/** How many checks this email / this IP started in the last 24 hours. */
export async function recentCounts(email: string, ipHash: string | null) {
  await ensureCallCheckTable()
  const rows = (await db.execute(sql`
    SELECT
      count(*) FILTER (WHERE lower(email) = lower(${email}))::int AS by_email,
      count(*) FILTER (WHERE ${ipHash}::text IS NOT NULL AND ip_hash = ${ipHash})::int AS by_ip
    FROM call_checks
    WHERE created_at > now() - interval '24 hours'`)) as unknown as Array<{ by_email: number; by_ip: number }>
  return rows[0] ?? { by_email: 0, by_ip: 0 }
}

/** Euro spent on checks today. The daily cap reads this before every run. */
export async function spentToday(): Promise<number> {
  await ensureCallCheckTable()
  const rows = (await db.execute(sql`
    SELECT COALESCE(sum(cost_eur), 0)::float8 AS eur FROM call_checks
    WHERE created_at > date_trunc('day', now())`)) as unknown as Array<{ eur: number }>
  return Number(rows[0]?.eur ?? 0)
}

export async function createCheck(x: {
  publicId: string; email: string; firstName: string | null; locale: string
  seller: string | null; newsletter: boolean; words: number; ipHash: string | null
}) {
  await ensureCallCheckTable()
  await db.execute(sql`
    INSERT INTO call_checks (public_id, email, first_name, locale, seller_label, newsletter, consent_at, word_count, ip_hash)
    VALUES (${x.publicId}, ${x.email}, ${x.firstName}, ${x.locale}, ${x.seller}, ${x.newsletter}, now(), ${x.words}, ${x.ipHash})`)
}

export async function finishCheck(publicId: string, x: {
  status: 'done' | 'error'; metrics?: unknown; result?: unknown; model?: string
  tokensIn?: number; tokensOut?: number; costEur?: number; error?: string | null
}) {
  await db.execute(sql`
    UPDATE call_checks SET
      status = ${x.status},
      metrics = ${x.metrics === undefined ? null : JSON.stringify(x.metrics)}::jsonb,
      result = ${x.result === undefined ? null : JSON.stringify(x.result)}::jsonb,
      model = ${x.model ?? null},
      tokens_in = ${x.tokensIn ?? 0},
      tokens_out = ${x.tokensOut ?? 0},
      cost_eur = ${x.costEur ?? 0},
      error = ${x.error ?? null}
    WHERE public_id = ${publicId}`)
}

export interface StoredCheck {
  public_id: string; first_name: string | null; locale: string; status: string
  seller_label: string | null; word_count: number; metrics: unknown; result: unknown
  created_at: string
}

export async function getCheck(publicId: string): Promise<StoredCheck | null> {
  await ensureCallCheckTable()
  const rows = (await db.execute(sql`
    SELECT public_id, first_name, locale, status, seller_label, word_count, metrics, result, created_at
    FROM call_checks WHERE public_id = ${publicId} LIMIT 1`)) as unknown as StoredCheck[]
  return rows[0] ?? null
}
