import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { encrypt, decrypt } from '@/lib/schedule/crypto'
import type { AskCalibration, AskResult, Lang } from './types'
import { getFunnel } from './registry'

/**
 * ask_submissions  eine Zeile je abgeschlossenem Durchlauf. Antworten und
 *                  Ergebnis im Klartext (Benchmark braucht sie), Kontakt
 *                  verschlüsselt. Ohne Kontakt bleibt die Teilnahme anonym.
 * ask_calibration  Schwellen je Funnel, im Admin änderbar.
 */
let ready = false
export async function ensureAsk() {
  if (ready) return
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ask_submissions (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      funnel        TEXT NOT NULL,
      lang          TEXT NOT NULL DEFAULT 'de',
      answers       JSONB NOT NULL,
      result        JSONB NOT NULL,
      vid           TEXT,
      source        TEXT,
      variant       TEXT,
      ip_hash       TEXT,
      contact_enc   TEXT,
      email_domain  TEXT,
      company       TEXT,
      contact_id    UUID,
      consent_at    TIMESTAMPTZ,
      doi_sent      INT NOT NULL DEFAULT 0,
      confirmed_at  TIMESTAMPTZ,
      report_views  INT NOT NULL DEFAULT 0,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS ask_sub_funnel ON ask_submissions (funnel, created_at DESC)`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS ask_sub_ip ON ask_submissions (ip_hash, created_at DESC)`)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ask_calibration (
      funnel      TEXT PRIMARY KEY,
      data        JSONB NOT NULL,
      updated_by  TEXT,
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
  ready = true
}

type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? r : ((r as { rows?: Row[] })?.rows ?? [])) as Row[]
const json = <T,>(v: unknown): T => (typeof v === 'string' ? JSON.parse(v) : v) as T

/** Kalibrierung aus der DB, sonst die Startwerte der Funnel-Datei. */
export async function getCalibration(funnel: string): Promise<AskCalibration> {
  await ensureAsk()
  const r = rows(await db.execute(sql`SELECT data FROM ask_calibration WHERE funnel = ${funnel}`))
  if (r[0]) return json<AskCalibration>(r[0].data)
  return { benchmarks: getFunnel(funnel)?.benchmarks ?? {} }
}
export async function saveCalibration(funnel: string, cal: AskCalibration, by: string) {
  await ensureAsk()
  await db.execute(sql`
    INSERT INTO ask_calibration (funnel, data, updated_by) VALUES (${funnel}, ${JSON.stringify(cal)}::jsonb, ${by})
    ON CONFLICT (funnel) DO UPDATE SET data = excluded.data, updated_by = excluded.updated_by, updated_at = now()`)
}

export async function recentByIp(ipHash: string | null): Promise<number> {
  if (!ipHash) return 0
  await ensureAsk()
  const r = rows(await db.execute(sql`SELECT count(*)::int AS n FROM ask_submissions WHERE ip_hash = ${ipHash} AND created_at > now() - interval '1 hour'`))
  return Number(r[0]?.n ?? 0)
}

export async function createSubmission(x: { funnel: string; lang: Lang; answers: Record<string, number>; result: AskResult; vid: string | null; source: string | null; variant: string | null; ipHash: string | null }): Promise<string> {
  await ensureAsk()
  const r = rows(await db.execute(sql`
    INSERT INTO ask_submissions (funnel, lang, answers, result, vid, source, variant, ip_hash)
    VALUES (${x.funnel}, ${x.lang}, ${JSON.stringify(x.answers)}::jsonb, ${JSON.stringify(x.result)}::jsonb, ${x.vid}, ${x.source}, ${x.variant}, ${x.ipHash})
    RETURNING id`))
  return String(r[0].id)
}

export interface AskContact { email: string; company: string; phone: string | null; firstName: string | null }
export interface Submission {
  id: string; funnel: string; lang: Lang; answers: Record<string, number>; result: AskResult
  vid: string | null; source: string | null; company: string | null; contact: AskContact | null
  consentAt: string | null; confirmedAt: string | null; doiSent: number; reportViews: number; createdAt: string
}
function toSub(r: Row): Submission {
  let contact: AskContact | null = null
  if (r.contact_enc) { try { contact = JSON.parse(decrypt(String(r.contact_enc))) } catch { contact = null } }
  return {
    id: String(r.id), funnel: String(r.funnel), lang: String(r.lang) as Lang,
    answers: json(r.answers), result: json(r.result), vid: (r.vid as string) ?? null, source: (r.source as string) ?? null,
    company: (r.company as string) ?? null, contact,
    consentAt: r.consent_at ? String(r.consent_at) : null, confirmedAt: r.confirmed_at ? String(r.confirmed_at) : null,
    doiSent: Number(r.doi_sent ?? 0), reportViews: Number(r.report_views ?? 0), createdAt: String(r.created_at),
  }
}

export async function getSubmission(id: string): Promise<Submission | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  await ensureAsk()
  const r = rows(await db.execute(sql`SELECT * FROM ask_submissions WHERE id = ${id}`))
  return r[0] ? toSub(r[0]) : null
}

export async function attachContact(id: string, c: AskContact, domain: string, contactId: string | null) {
  await ensureAsk()
  await db.execute(sql`
    UPDATE ask_submissions SET contact_enc = ${encrypt(JSON.stringify(c))}, company = ${c.company}, email_domain = ${domain || null},
      contact_id = ${contactId}, consent_at = COALESCE(consent_at, now()), doi_sent = doi_sent + 1
    WHERE id = ${id}`)
}

/** true, wenn die Bestätigung neu ist (für die Benachrichtigung). */
export async function confirm(id: string): Promise<boolean> {
  await ensureAsk()
  const r = rows(await db.execute(sql`UPDATE ask_submissions SET confirmed_at = now() WHERE id = ${id} AND confirmed_at IS NULL RETURNING id`))
  return !!r[0]
}
export async function countView(id: string) {
  await db.execute(sql`UPDATE ask_submissions SET report_views = report_views + 1 WHERE id = ${id}`).catch(() => {})
}

export async function listSubmissions(funnel: string | null, limit = 300): Promise<Submission[]> {
  await ensureAsk()
  const r = rows(await db.execute(funnel
    ? sql`SELECT * FROM ask_submissions WHERE funnel = ${funnel} ORDER BY created_at DESC LIMIT ${limit}`
    : sql`SELECT * FROM ask_submissions ORDER BY created_at DESC LIMIT ${limit}`))
  return r.map(toSub)
}
