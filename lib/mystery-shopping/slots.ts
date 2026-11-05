import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

/**
 * Mystery Shopping — Plätze je Quartal und eine Buchung pro Firma.
 *
 * Frei = Kapazität − bereits vergeben (außerhalb des Shops, im Admin gepflegt)
 *        − bezahlte Buchungen − laufende Reservierungen (Stripe-Checkout offen, 30 Min.).
 * Eine Firma = eine Arbeits-Domain. Wer bezahlt hat, kann nicht noch einmal buchen.
 */

export const DEFAULT_CAPACITY = 16
const HOLD_MINUTES = 32

function rowsOf<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[]
  if (r && typeof r === 'object' && 'rows' in r) return ((r as { rows: unknown[] }).rows ?? []) as T[]
  return []
}

let ready = false
export async function ensureMysteryTables() {
  if (ready) return
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS mystery_shopping_quarters (
      quarter      TEXT PRIMARY KEY,
      capacity     INT  NOT NULL DEFAULT 16,
      taken_offset INT  NOT NULL DEFAULT 0,
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS mystery_shopping_bookings (
      id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      quarter           TEXT NOT NULL,
      company_domain    TEXT NOT NULL,
      company           TEXT,
      email             TEXT NOT NULL,
      name              TEXT,
      stripe_session_id TEXT UNIQUE,
      status            TEXT NOT NULL DEFAULT 'pending',
      hold_until        TIMESTAMPTZ,
      paid_at           TIMESTAMPTZ,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS msb_quarter ON mystery_shopping_bookings (quarter, status)`)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS mystery_shopping_leads (
      id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email          TEXT NOT NULL,
      first_name     TEXT,
      company_domain TEXT NOT NULL,
      source         TEXT,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
  // Eine Firma bucht nur einmal: höchstens eine bezahlte Buchung je Domain.
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS msb_one_per_company ON mystery_shopping_bookings (company_domain) WHERE status = 'paid'`)
  ready = true
}

/** Quartal in Berliner Zeit, z. B. "2026-Q4". */
export function quarterOf(d = new Date()): string {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit' }).formatToParts(d)
  const y = p.find((x) => x.type === 'year')!.value
  const m = Number(p.find((x) => x.type === 'month')!.value)
  return `${y}-Q${Math.ceil(m / 3)}`
}

export function nextQuarterLabel(q = quarterOf()): string {
  const [y, n] = q.split('-Q').map(Number)
  const nq = n === 4 ? 1 : n + 1
  const ny = n === 4 ? y + 1 : y
  return `${['Januar', 'April', 'Juli', 'Oktober'][nq - 1]} ${ny}`
}

export interface Availability {
  quarter: string
  capacity: number
  taken: number
  free: number
  soldOut: boolean
  paid: number
  pending: number
  offset: number
}

export async function getAvailability(): Promise<Availability> {
  await ensureMysteryTables()
  const quarter = quarterOf()
  const q = rowsOf<{ capacity: number; taken_offset: number }>(
    await db.execute(sql`SELECT capacity, taken_offset FROM mystery_shopping_quarters WHERE quarter = ${quarter}`),
  )[0]
  const capacity = q?.capacity ?? DEFAULT_CAPACITY
  const offset = q?.taken_offset ?? 0
  const c = rowsOf<{ paid: string; pending: string }>(await db.execute(sql`
    SELECT count(*) FILTER (WHERE status = 'paid')::text AS paid,
           count(*) FILTER (WHERE status = 'pending' AND hold_until > now())::text AS pending
    FROM mystery_shopping_bookings WHERE quarter = ${quarter}`))[0]
  const paid = Number(c?.paid ?? 0)
  const pending = Number(c?.pending ?? 0)
  const taken = Math.min(capacity, offset + paid + pending)
  const free = Math.max(0, capacity - taken)
  return { quarter, capacity, taken, free, soldOut: free === 0, paid, pending, offset }
}

export async function hasCompanyBooked(domain: string): Promise<boolean> {
  await ensureMysteryTables()
  const r = rowsOf(await db.execute(sql`SELECT 1 FROM mystery_shopping_bookings WHERE company_domain = ${domain} AND status = 'paid' LIMIT 1`))
  return r.length > 0
}

/** Platz für die Dauer des Stripe-Checkouts halten. Ältere offene Versuche derselben Firma verfallen. */
export async function holdSlot(input: { domain: string; company: string; email: string; name: string; sessionId: string }) {
  await ensureMysteryTables()
  await db.execute(sql`UPDATE mystery_shopping_bookings SET status = 'replaced' WHERE company_domain = ${input.domain} AND status = 'pending'`)
  await db.execute(sql`
    INSERT INTO mystery_shopping_bookings (quarter, company_domain, company, email, name, stripe_session_id, status, hold_until)
    VALUES (${quarterOf()}, ${input.domain}, ${input.company || null}, ${input.email}, ${input.name || null}, ${input.sessionId}, 'pending', now() + make_interval(mins => ${HOLD_MINUTES}))
    ON CONFLICT (stripe_session_id) DO NOTHING`)
}

/** Aus dem Stripe-Webhook: bezahlt. Idempotent. */
export async function markPaid(sessionId: string) {
  await ensureMysteryTables()
  try {
    await db.execute(sql`UPDATE mystery_shopping_bookings SET status = 'paid', paid_at = now(), hold_until = NULL WHERE stripe_session_id = ${sessionId} AND status <> 'paid'`)
  } catch (e) {
    // Zweite bezahlte Buchung derselben Firma (Unique-Index) — als Doppelbuchung markieren statt zu verlieren.
    await db.execute(sql`UPDATE mystery_shopping_bookings SET status = 'duplicate_paid', paid_at = now() WHERE stripe_session_id = ${sessionId}`)
    console.error('[mystery] doppelte Buchung', sessionId, e)
  }
}

export async function releaseHold(sessionId: string) {
  await ensureMysteryTables()
  await db.execute(sql`UPDATE mystery_shopping_bookings SET status = 'expired' WHERE stripe_session_id = ${sessionId} AND status = 'pending'`)
}

export async function setQuarterConfig(quarter: string, capacity: number, offset: number) {
  await ensureMysteryTables()
  await db.execute(sql`
    INSERT INTO mystery_shopping_quarters (quarter, capacity, taken_offset) VALUES (${quarter}, ${capacity}, ${offset})
    ON CONFLICT (quarter) DO UPDATE SET capacity = excluded.capacity, taken_offset = excluded.taken_offset, updated_at = now()`)
}

export interface BookingRow { id: string; quarter: string; company_domain: string; company: string | null; email: string; name: string | null; status: string; created_at: string; paid_at: string | null }
export async function listBookings(limit = 100): Promise<BookingRow[]> {
  await ensureMysteryTables()
  return rowsOf<BookingRow>(await db.execute(sql`
    SELECT id, quarter, company_domain, company, email, name, status, created_at, paid_at
    FROM mystery_shopping_bookings WHERE status IN ('paid','pending','duplicate_paid')
    ORDER BY created_at DESC LIMIT ${limit}`))
}

/** Opt-in von der Squeeze-Seite. Gibt eine Lead-ID für den Checkout zurück. */
export async function createLead(input: { email: string; firstName: string; domain: string; source: string }): Promise<string> {
  await ensureMysteryTables()
  const r = rowsOf<{ id: string }>(await db.execute(sql`
    INSERT INTO mystery_shopping_leads (email, first_name, company_domain, source)
    VALUES (${input.email.toLowerCase()}, ${input.firstName || null}, ${input.domain}, ${input.source || null}) RETURNING id`))
  return r[0].id
}

export async function getLead(id: string): Promise<{ email: string; first_name: string | null } | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  await ensureMysteryTables()
  return rowsOf<{ email: string; first_name: string | null }>(await db.execute(sql`
    SELECT email, first_name FROM mystery_shopping_leads WHERE id = ${id} AND created_at > now() - interval '7 days'`))[0] ?? null
}
