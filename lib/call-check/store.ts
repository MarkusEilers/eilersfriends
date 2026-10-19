import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { createHash, randomBytes } from 'crypto'

import { encrypt, decrypt, signState, verifyState } from '@/lib/schedule/crypto'

/**
 * Storage for the Gesprächs-Check.
 *
 * Since 18.10.2026 the transcript is kept — encrypted (AES-256-GCM) — so the
 * user can reopen, compare and re-run their calls in their protected area.
 * The consent text says so; the user can delete a transcript at any time
 * (the result stays). Quota: 10 checks per company domain, more as paid
 * credit packs.
 */

export const FREE_CHECKS_PER_COMPANY = 10
export const CREDIT_PACK = { checks: 10, eurNet: 37 }
/** Without a confirmed address (double opt-in) a person may run this many checks. */
export const CHECKS_BEFORE_DOI = 2

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
  // Wie ist es ausgegangen? Nachträglich gesetzt — Grundlage, um Kaufwahrscheinlichkeit und Skill-Map zu kalibrieren.
  await db.execute(sql`ALTER TABLE call_checks ADD COLUMN IF NOT EXISTS outcome TEXT`)
  await db.execute(sql`ALTER TABLE call_checks ADD COLUMN IF NOT EXISTS outcome_at TIMESTAMPTZ`)
  await db.execute(sql`ALTER TABLE call_checks ADD COLUMN IF NOT EXISTS offer_id UUID`)
  // Verlauf + Kontingent (18.10.2026)
  await db.execute(sql`ALTER TABLE call_checks ADD COLUMN IF NOT EXISTS transcript_enc TEXT`)
  await db.execute(sql`ALTER TABLE call_checks ADD COLUMN IF NOT EXISTS transcript_deleted_at TIMESTAMPTZ`)
  await db.execute(sql`ALTER TABLE call_checks ADD COLUMN IF NOT EXISTS company_domain TEXT`)
  await db.execute(sql`UPDATE call_checks SET company_domain = lower(split_part(email, '@', 2)) WHERE company_domain IS NULL`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS call_checks_domain ON call_checks (company_domain, created_at DESC)`)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS call_check_credits (
      id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_domain    TEXT NOT NULL,
      checks            INT NOT NULL,
      source            TEXT NOT NULL DEFAULT 'stripe',
      email             TEXT,
      stripe_session_id TEXT UNIQUE,
      amount_eur        NUMERIC(10,2),
      created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS call_check_verified (
      email        TEXT PRIMARY KEY,
      verified_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
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
  domain: string; transcript: string
}) {
  await ensureCallCheckTable()
  await db.execute(sql`
    INSERT INTO call_checks (public_id, email, first_name, locale, seller_label, newsletter, consent_at, word_count, ip_hash, company_domain, transcript_enc)
    VALUES (${x.publicId}, ${x.email}, ${x.firstName}, ${x.locale}, ${x.seller}, ${x.newsletter}, now(), ${x.words}, ${x.ipHash},
            ${x.domain.toLowerCase()}, ${encrypt(x.transcript)})`)
}

/** How many checks a company has used and may still run. Failed runs do not count. */
export async function quotaFor(domain: string): Promise<{ used: number; limit: number; remaining: number }> {
  await ensureCallCheckTable()
  const d = domain.toLowerCase()
  const rows = (await db.execute(sql`
    SELECT
      (SELECT count(*)::int FROM call_checks WHERE company_domain = ${d} AND status <> 'error') AS used,
      (SELECT COALESCE(sum(checks), 0)::int FROM call_check_credits WHERE company_domain = ${d}) AS bought`)) as unknown as Array<{ used: number; bought: number }>
  const used = rows[0]?.used ?? 0
  const limit = FREE_CHECKS_PER_COMPANY + (rows[0]?.bought ?? 0)
  return { used, limit, remaining: Math.max(0, limit - used) }
}

/** Credit pack bought via Stripe. Idempotent per session — webhook and return page may both call it. */
export async function addCredits(x: { domain: string; checks: number; email: string | null; sessionId: string; amountEur: number | null; source?: string }) {
  await ensureCallCheckTable()
  await db.execute(sql`
    INSERT INTO call_check_credits (company_domain, checks, source, email, stripe_session_id, amount_eur)
    VALUES (${x.domain.toLowerCase()}, ${x.checks}, ${x.source ?? 'stripe'}, ${x.email}, ${x.sessionId}, ${x.amountEur})
    ON CONFLICT (stripe_session_id) DO NOTHING`)
}

/** The stored transcript, decrypted — only for the owner or Eilers+Friends. */
export async function getTranscript(publicId: string): Promise<string | null> {
  await ensureCallCheckTable()
  const rows = (await db.execute(sql`SELECT transcript_enc FROM call_checks WHERE public_id = ${publicId} LIMIT 1`)) as unknown as Array<{ transcript_enc: string | null }>
  const enc = rows[0]?.transcript_enc
  if (!enc) return null
  try { return decrypt(enc) } catch { return null }
}

/** Delete the transcript of one check. The result stays. */
export async function deleteTranscript(publicId: string) {
  await ensureCallCheckTable()
  await db.execute(sql`UPDATE call_checks SET transcript_enc = NULL, transcript_deleted_at = now() WHERE public_id = ${publicId}`)
}

export interface CheckListItem {
  public_id: string; created_at: string; status: string; word_count: number; email: string
  first_name: string | null; has_transcript: boolean; outcome: string | null
  summary: string | null; probability: number | null
}

/** All checks of a person — or, for an owner/admin view, of a whole company domain. */
export async function listChecks(by: { email?: string; domain?: string }): Promise<CheckListItem[]> {
  await ensureCallCheckTable()
  if (!by.email && !by.domain) return []
  const rows = (await db.execute(sql`
    SELECT public_id, created_at, status, word_count, email, first_name, outcome,
           (transcript_enc IS NOT NULL) AS has_transcript,
           result->>'summary' AS summary,
           NULLIF(result->'purchase'->>'probability', '')::float8 AS probability
    FROM call_checks
    WHERE ${by.email ? sql`lower(email) = lower(${by.email})` : sql`company_domain = ${String(by.domain).toLowerCase()}`}
    ORDER BY created_at DESC LIMIT 200`)) as unknown as CheckListItem[]
  return rows
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
  created_at: string; outcome: string | null; offer_id: string | null; email?: string
}

export const OUTCOMES = ['won', 'follow_up', 'offer_requested', 'nothing', 'lost'] as const
export type Outcome = (typeof OUTCOMES)[number]

export async function setOutcome(publicId: string, outcome: Outcome) {
  await ensureCallCheckTable()
  await db.execute(sql`UPDATE call_checks SET outcome=${outcome}, outcome_at=now() WHERE public_id=${publicId} AND status='done'`)
}

export async function getCheck(publicId: string): Promise<StoredCheck | null> {
  await ensureCallCheckTable()
  const rows = (await db.execute(sql`
    SELECT public_id, first_name, locale, status, seller_label, word_count, metrics, result, created_at, outcome, offer_id, email
    FROM call_checks WHERE public_id = ${publicId} LIMIT 1`)) as unknown as StoredCheck[]
  return rows[0] ?? null
}


/**
 * Double opt-in. An address counts as confirmed when it clicked our
 * confirmation link, confirmed the newsletter, or belongs to a portal account.
 */
export async function isVerified(email: string): Promise<boolean> {
  await ensureCallCheckTable()
  const e = email.toLowerCase()
  const rows = (await db.execute(sql`
    SELECT
      EXISTS (SELECT 1 FROM call_check_verified WHERE email = ${e}) AS a,
      EXISTS (SELECT 1 FROM newsletter_subscribers WHERE lower(email) = ${e} AND doi_confirmed_at IS NOT NULL) AS b,
      EXISTS (SELECT 1 FROM public.users WHERE lower(email) = ${e}) AS c`).catch(async () =>
      db.execute(sql`SELECT EXISTS (SELECT 1 FROM call_check_verified WHERE email = ${e}) AS a, false AS b, false AS c`)
    )) as unknown as Array<{ a: boolean; b: boolean; c: boolean }>
  const r = rows[0]
  return !!(r && (r.a || r.b || r.c))
}

export async function markVerified(email: string) {
  await ensureCallCheckTable()
  await db.execute(sql`INSERT INTO call_check_verified (email) VALUES (${email.toLowerCase()}) ON CONFLICT (email) DO NOTHING`)
}

/** Checks a person has run so far (failed runs do not count). */
export async function checksByEmail(email: string): Promise<number> {
  await ensureCallCheckTable()
  const rows = (await db.execute(sql`
    SELECT count(*)::int AS n FROM call_checks WHERE lower(email) = lower(${email}) AND status <> 'error'`)) as unknown as Array<{ n: number }>
  return rows[0]?.n ?? 0
}

/** Signed confirmation token: email + locale, valid for 14 days. */
export function verifyToken(email: string, locale: string): string {
  return signState(JSON.stringify({ e: email.toLowerCase(), l: locale, t: Date.now() }))
}
export function readVerifyToken(token: string): { email: string; locale: string } | null {
  const raw = verifyState(token)
  if (!raw) return null
  try {
    const o = JSON.parse(raw) as { e: string; l: string; t: number }
    if (!o.e || Date.now() - o.t > 14 * 864e5) return null
    return { email: o.e, locale: o.l || 'de' }
  } catch { return null }
}
