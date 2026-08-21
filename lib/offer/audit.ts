import { createHash } from 'crypto'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

/**
 * Beweiskette für elektronische Unterschriften (Muster: DocuSign / Adobe Sign).
 *
 * Jedes Ereignis (eingeladen, geöffnet, eingereicht, unterschrieben) wird als
 * unveränderlicher Eintrag protokolliert und über SHA-256 mit dem Vorgänger
 * verkettet. Wird ein Eintrag nachträglich verändert, brechen alle folgenden
 * Prüfsummen — die Manipulation ist damit erkennbar.
 *
 * Wichtig zur Einordnung: Ein Hash ist keine Verschlüsselung, sondern ein
 * Fingerabdruck. Zeitpunkt und IP werden deshalb zusätzlich im Klartext
 * gespeichert; der Hash beweist, dass sie seither unverändert sind.
 */

export type AuditEvent = 'invited' | 'opened' | 'submitted' | 'signed' | 'finalized'

let ensured = false
export async function ensureAuditSchema() {
  if (ensured) return
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS offer_signature_audit (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      offer_id    UUID REFERENCES offers(id) ON DELETE CASCADE,
      signer_id   UUID,
      seq         INTEGER NOT NULL,
      event       TEXT NOT NULL,
      actor_name  TEXT,
      actor_email TEXT,
      ip          TEXT,
      user_agent  TEXT,
      occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      payload     JSONB NOT NULL DEFAULT '{}'::jsonb,
      prev_hash   TEXT,
      entry_hash  TEXT NOT NULL,
      created_at  TIMESTAMPTZ DEFAULT now()
    )`)
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS offer_signature_audit_seq_idx ON offer_signature_audit (offer_id, seq)`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS offer_archives (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      offer_id    UUID REFERENCES offers(id) ON DELETE CASCADE,
      kind        TEXT NOT NULL DEFAULT 'signed_pdf',
      url         TEXT,
      sha256      TEXT NOT NULL,
      byte_size   INTEGER,
      snapshot    JSONB NOT NULL DEFAULT '{}'::jsonb,
      chain_head  TEXT,
      created_at  TIMESTAMPTZ DEFAULT now()
    )`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS offer_archives_offer_idx ON offer_archives (offer_id, created_at DESC)`)
  ensured = true
}

export function sha256(input: string | Buffer): string {
  return createHash('sha256').update(input).digest('hex')
}

/** Kanonische Zeichenkette eines Eintrags — Grundlage der Prüfsumme. */
function canonical(e: {
  seq: number; event: string; actorEmail?: string | null; ip?: string | null
  occurredAt: string; payload: unknown; prevHash: string | null
}): string {
  return [
    e.seq, e.event, e.actorEmail ?? '', e.ip ?? '',
    e.occurredAt, JSON.stringify(e.payload ?? {}), e.prevHash ?? 'GENESIS',
  ].join('|')
}

/** Hängt ein Ereignis an die Kette und gibt den neuen Kopf-Hash zurück. */
export async function appendAudit(input: {
  offerId: string; signerId?: string | null; event: AuditEvent
  actorName?: string | null; actorEmail?: string | null
  ip?: string | null; userAgent?: string | null; payload?: unknown
}): Promise<{ seq: number; entryHash: string }> {
  await ensureAuditSchema()
  const last = (await db.execute(sql`
    SELECT seq, entry_hash FROM offer_signature_audit
    WHERE offer_id = ${input.offerId} ORDER BY seq DESC LIMIT 1
  `)) as unknown as { seq: number; entry_hash: string }[]

  const seq = (last[0]?.seq ?? 0) + 1
  const prevHash = last[0]?.entry_hash ?? null
  const occurredAt = new Date().toISOString()
  const payload = input.payload ?? {}
  const entryHash = sha256(canonical({
    seq, event: input.event, actorEmail: input.actorEmail, ip: input.ip, occurredAt, payload, prevHash,
  }))

  await db.execute(sql`
    INSERT INTO offer_signature_audit (offer_id, signer_id, seq, event, actor_name, actor_email, ip, user_agent, occurred_at, payload, prev_hash, entry_hash)
    VALUES (${input.offerId}, ${input.signerId ?? null}, ${seq}, ${input.event}, ${input.actorName ?? null},
            ${input.actorEmail ?? null}, ${input.ip ?? null}, ${input.userAgent ?? null}, ${occurredAt},
            ${JSON.stringify(payload)}::jsonb, ${prevHash}, ${entryHash})
  `)
  return { seq, entryHash }
}

export interface AuditRow {
  seq: number; event: string; actor_name: string | null; actor_email: string | null
  ip: string | null; user_agent: string | null; occurred_at: string
  payload: Record<string, unknown>; prev_hash: string | null; entry_hash: string
}

export async function listAudit(offerId: string): Promise<AuditRow[]> {
  await ensureAuditSchema()
  const res = await db.execute(sql`
    SELECT seq, event, actor_name, actor_email, ip, user_agent, occurred_at, payload, prev_hash, entry_hash
    FROM offer_signature_audit WHERE offer_id = ${offerId} ORDER BY seq`)
  return res as unknown as AuditRow[]
}

/** Rechnet die gesamte Kette nach. Bricht sie, wird der erste defekte Eintrag benannt. */
export async function verifyChain(offerId: string): Promise<{ ok: boolean; entries: number; brokenAt?: number; head?: string }> {
  const rows = await listAudit(offerId)
  let prev: string | null = null
  for (const r of rows) {
    const expected = sha256(canonical({
      seq: r.seq, event: r.event, actorEmail: r.actor_email, ip: r.ip,
      occurredAt: new Date(r.occurred_at).toISOString(), payload: r.payload, prevHash: prev,
    }))
    if (expected !== r.entry_hash || (r.prev_hash ?? null) !== prev) {
      return { ok: false, entries: rows.length, brokenAt: r.seq }
    }
    prev = r.entry_hash
  }
  return { ok: true, entries: rows.length, head: prev ?? undefined }
}

export async function listArchives(offerId: string) {
  await ensureAuditSchema()
  const res = await db.execute(sql`
    SELECT id, kind, url, sha256, byte_size, chain_head, created_at
    FROM offer_archives WHERE offer_id = ${offerId} ORDER BY created_at DESC`)
  return res as unknown as { id: string; kind: string; url: string | null; sha256: string; byte_size: number | null; chain_head: string | null; created_at: string }[]
}

export async function saveArchive(input: {
  offerId: string; kind?: string; url?: string | null; sha256: string
  byteSize?: number; snapshot: unknown; chainHead?: string | null
}) {
  await ensureAuditSchema()
  await db.execute(sql`
    INSERT INTO offer_archives (offer_id, kind, url, sha256, byte_size, snapshot, chain_head)
    VALUES (${input.offerId}, ${input.kind ?? 'signed_pdf'}, ${input.url ?? null}, ${input.sha256},
            ${input.byteSize ?? null}, ${JSON.stringify(input.snapshot)}::jsonb, ${input.chainHead ?? null})`)
}
