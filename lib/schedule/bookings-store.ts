import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

function rowsOf<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[]
  if (r && typeof r === 'object' && 'rows' in r) { const x = (r as { rows: unknown }).rows; if (Array.isArray(x)) return x as T[] }
  return []
}

export type Answer = { question: string; answer: string }
export type Booking = {
  id: string; eventTypeId: string | null; ownerSlug: string; typeSlug: string
  startUtc: string; endUtc: string; dayKey: string
  customerName: string; customerEmail: string; answers: Answer[]; note: string
  status: string; msEventId: string | null; joinUrl: string | null; manageToken: string
  remindersSent: number[]
}

let ensured = false
export async function ensureBookingsTable() {
  if (ensured) return
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS schedule_bookings (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      event_type_id uuid, owner_slug text NOT NULL, type_slug text NOT NULL,
      start_utc timestamptz NOT NULL, end_utc timestamptz NOT NULL, day_key text NOT NULL,
      customer_name text NOT NULL, customer_email text NOT NULL,
      answers jsonb NOT NULL DEFAULT '[]', note text NOT NULL DEFAULT '',
      status text NOT NULL DEFAULT 'confirmed', ms_event_id text, join_url text,
      manage_token text NOT NULL, reminders_sent jsonb NOT NULL DEFAULT '[]',
      created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
    )`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_sched_book_token ON schedule_bookings(manage_token)`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_sched_book_cap ON schedule_bookings(owner_slug, type_slug, day_key, status)`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_sched_book_due ON schedule_bookings(status, start_utc)`)
  ensured = true
}

function parse<T>(v: unknown, d: T): T { if (v == null) return d; if (typeof v === 'string') { try { return JSON.parse(v) as T } catch { return d } } return v as T }
function mapRow(r: Record<string, unknown>): Booking {
  return {
    id: String(r.id), eventTypeId: r.event_type_id ? String(r.event_type_id) : null,
    ownerSlug: String(r.owner_slug), typeSlug: String(r.type_slug),
    startUtc: new Date(r.start_utc as string).toISOString(), endUtc: new Date(r.end_utc as string).toISOString(),
    dayKey: String(r.day_key), customerName: String(r.customer_name), customerEmail: String(r.customer_email),
    answers: parse<Answer[]>(r.answers, []), note: String(r.note ?? ''), status: String(r.status),
    msEventId: r.ms_event_id ? String(r.ms_event_id) : null, joinUrl: r.join_url ? String(r.join_url) : null,
    manageToken: String(r.manage_token), remindersSent: parse<number[]>(r.reminders_sent, []),
  }
}

// Zählung bestätigter Buchungen je Tag (für Tageslimit)
export async function bookingCountsByDay(ownerSlug: string, typeSlug: string): Promise<Record<string, number>> {
  await ensureBookingsTable()
  const r = rowsOf<Record<string, unknown>>(await db.execute(sql`
    SELECT day_key, COUNT(*)::int AS n FROM schedule_bookings
    WHERE owner_slug=${ownerSlug} AND type_slug=${typeSlug} AND status='confirmed' AND start_utc > now() - interval '1 day'
    GROUP BY day_key`))
  const out: Record<string, number> = {}
  for (const x of r) out[String(x.day_key)] = Number(x.n)
  return out
}

export async function createBooking(b: {
  eventTypeId: string | null; ownerSlug: string; typeSlug: string; startUtc: string; endUtc: string; dayKey: string
  customerName: string; customerEmail: string; answers: Answer[]; note: string
  msEventId: string | null; joinUrl: string | null; manageToken: string
}): Promise<string> {
  await ensureBookingsTable()
  const ans = JSON.stringify(b.answers)
  const r = rowsOf<Record<string, unknown>>(await db.execute(sql`
    INSERT INTO schedule_bookings (event_type_id, owner_slug, type_slug, start_utc, end_utc, day_key, customer_name, customer_email, answers, note, ms_event_id, join_url, manage_token)
    VALUES (${b.eventTypeId}, ${b.ownerSlug}, ${b.typeSlug}, ${b.startUtc}, ${b.endUtc}, ${b.dayKey}, ${b.customerName}, ${b.customerEmail}, ${ans}::jsonb, ${b.note}, ${b.msEventId}, ${b.joinUrl}, ${b.manageToken})
    RETURNING id`))
  return String(r[0].id)
}

export async function getBookingByToken(token: string): Promise<Booking | null> {
  await ensureBookingsTable()
  const r = rowsOf<Record<string, unknown>>(await db.execute(sql`SELECT * FROM schedule_bookings WHERE manage_token = ${token} LIMIT 1`))
  return r[0] ? mapRow(r[0]) : null
}

export async function setBookingCancelled(id: string): Promise<void> {
  await ensureBookingsTable()
  await db.execute(sql`UPDATE schedule_bookings SET status='cancelled', updated_at=now() WHERE id=${id}`)
}

export async function updateBookingTime(id: string, startUtc: string, endUtc: string, dayKey: string): Promise<void> {
  await ensureBookingsTable()
  await db.execute(sql`UPDATE schedule_bookings SET start_utc=${startUtc}, end_utc=${endUtc}, day_key=${dayKey}, reminders_sent='[]'::jsonb, updated_at=now() WHERE id=${id}`)
}

// Cron: fällige Buchungen samt Reminder-Konfig des Event-Typs
export type DueRow = Booking & { reminders: { hoursBefore: number }[] }
export async function dueBookingsForReminders(): Promise<DueRow[]> {
  await ensureBookingsTable()
  const r = rowsOf<Record<string, unknown>>(await db.execute(sql`
    SELECT b.*, et.reminders AS et_reminders
    FROM schedule_bookings b
    JOIN schedule_event_types et ON et.owner_slug = b.owner_slug AND et.slug = b.type_slug
    WHERE b.status='confirmed' AND b.start_utc > now() AND b.start_utc < now() + interval '3 days'`))
  return r.map(x => ({ ...mapRow(x), reminders: parse<{ hoursBefore: number }[]>(x.et_reminders, [{ hoursBefore: 24 }]) }))
}

export async function markReminderSent(id: string, hoursBefore: number): Promise<void> {
  await ensureBookingsTable()
  await db.execute(sql`UPDATE schedule_bookings SET reminders_sent = reminders_sent || ${JSON.stringify([hoursBefore])}::jsonb, updated_at=now() WHERE id=${id}`)
}
