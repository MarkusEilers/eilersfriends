import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { calendarsForPerson, sendMailAs } from '@/lib/schedule/graph'

/**
 * Personal calendar assistant — the part that Claude chats and the SecondBrain
 * call through the MCP endpoint.
 *
 * One view over all calendars of a person (the Microsoft 365 connector in
 * claude.ai sees only one mailbox and cannot write), plus the writes needed to
 * organise a week: create focus blocks, move, retitle, prioritise, delete.
 *
 * Guard rails, because a chat can be talked into things:
 * - Events with other attendees are not moved or deleted unless the call says
 *   notify_attendees: true — moving them sends updates to other people.
 * - Events the person does not organise are never moved or deleted.
 * - Writes only inside a window from yesterday to 90 days ahead.
 * - Every write is logged with the state before it, so it can be undone.
 */

const TZ = 'Europe/Berlin'
const GRAPH = 'https://graph.microsoft.com/v1.0'

export interface AssistantEvent {
  id: string
  calendar: string
  subject: string
  start: string
  end: string
  allDay: boolean
  showAs: string
  importance: string
  categories: string[]
  isOrganizer: boolean
  organizer: string | null
  attendees: string[]
  otherAttendees: number
  online: boolean
  location: string | null
  preview: string
  recurring: boolean
}

type GraphEvent = {
  id: string; subject?: string; isAllDay?: boolean; showAs?: string; importance?: string
  categories?: string[]; isOrganizer?: boolean; isCancelled?: boolean; type?: string
  start?: { dateTime: string }; end?: { dateTime: string }
  organizer?: { emailAddress?: { name?: string; address?: string } }
  attendees?: Array<{ emailAddress?: { name?: string; address?: string }; type?: string }>
  location?: { displayName?: string }; isOnlineMeeting?: boolean; bodyPreview?: string
}

async function graph(token: string, path: string, init: RequestInit = {}) {
  const res = await fetch(`${GRAPH}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: `outlook.timezone="${TZ}"`,
      ...(init.headers ?? {}),
    },
  })
  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = (data as { error?: { message?: string } }).error?.message ?? `graph_${res.status}`
    throw new Error(msg)
  }
  return data
}

/** Accepts "2026-10-07T09:00" (Berlin wall time) or a full ISO timestamp. */
function toGraphTime(v: string): { dateTime: string; timeZone: string } {
  const s = String(v).trim()
  if (/(Z|[+-]\d\d:?\d\d)$/.test(s)) return { dateTime: new Date(s).toISOString().slice(0, 19), timeZone: 'UTC' }
  if (/^\d{4}-\d\d-\d\d$/.test(s)) return { dateTime: `${s}T00:00:00`, timeZone: TZ }
  return { dateTime: s.length === 16 ? `${s}:00` : s.slice(0, 19), timeZone: TZ }
}

function berlinToDate(v: string): Date {
  const g = toGraphTime(v)
  if (g.timeZone === 'UTC') return new Date(`${g.dateTime}Z`)
  // Berlin wall time → rough UTC (offset 1–2 h) is enough for the window check.
  return new Date(`${g.dateTime}+01:00`)
}

function addMinutes(v: string, min: number): string {
  const d = new Date(`${toGraphTime(v).dateTime}Z`)
  return new Date(d.getTime() + min * 60000).toISOString().slice(0, 19)
}

function shape(calendar: string, me: string, e: GraphEvent): AssistantEvent {
  const att = (e.attendees ?? []).filter((a) => (a.emailAddress?.address ?? '').toLowerCase() !== me)
  return {
    id: e.id,
    calendar,
    subject: e.subject ?? '',
    start: (e.start?.dateTime ?? '').slice(0, 16),
    end: (e.end?.dateTime ?? '').slice(0, 16),
    allDay: Boolean(e.isAllDay),
    showAs: e.showAs ?? 'busy',
    importance: e.importance ?? 'normal',
    categories: e.categories ?? [],
    isOrganizer: Boolean(e.isOrganizer),
    organizer: e.organizer?.emailAddress?.name ?? e.organizer?.emailAddress?.address ?? null,
    attendees: att.map((a) => a.emailAddress?.name || a.emailAddress?.address || '?'),
    otherAttendees: att.length,
    online: Boolean(e.isOnlineMeeting),
    location: e.location?.displayName || null,
    preview: (e.bodyPreview ?? '').replace(/\s+/g, ' ').slice(0, 160),
    recurring: e.type === 'occurrence' || e.type === 'exception',
  }
}

const SELECT = 'subject,start,end,isAllDay,showAs,importance,categories,isOrganizer,isCancelled,organizer,attendees,location,isOnlineMeeting,bodyPreview,type'

export async function listEvents(person: string, from: string, to: string): Promise<{ timezone: string; events: AssistantEvent[]; calendars: string[] }> {
  const cals = await calendarsForPerson(person)
  if (!cals.length) throw new Error('no_calendar_connected')
  const start = toGraphTime(from), end = toGraphTime(to)
  const qs = `startDateTime=${encodeURIComponent(start.dateTime)}&endDateTime=${encodeURIComponent(end.dateTime)}&$select=${SELECT}&$orderby=start/dateTime&$top=250`
  const all: AssistantEvent[] = []
  for (const c of cals) {
    const data = await graph(c.token, `/me/calendarView?${qs}`) as { value?: GraphEvent[] }
    for (const e of data?.value ?? []) if (!e.isCancelled) all.push(shape(c.calendar, c.calendar, e))
  }
  all.sort((a, b) => a.start.localeCompare(b.start))
  return { timezone: TZ, events: all, calendars: cals.map((c) => c.calendar) }
}

/** Gaps between events, within working hours, of at least minMinutes. */
export async function freeTime(person: string, from: string, to: string, minMinutes = 30, dayStart = '08:00', dayEnd = '19:00') {
  const { events } = await listEvents(person, from, to)
  const busy = events.filter((e) => !e.allDay && e.showAs !== 'free')
  const out: Array<{ start: string; end: string; minutes: number }> = []
  // The range is half-open like the event query: "to" 2026-10-09T00:00 ends
  // before the 9th. Counting that day would report it as entirely free,
  // because none of its events were fetched.
  const first = new Date(`${toGraphTime(from).dateTime.slice(0, 10)}T00:00:00Z`)
  const until = new Date(`${toGraphTime(to).dateTime}Z`)
  for (let d = first; d < until; d = new Date(d.getTime() + 864e5)) {
    const day = d.toISOString().slice(0, 10)
    const wd = d.getUTCDay()
    if (wd === 0 || wd === 6) continue
    let cursor = `${day}T${dayStart}`
    const endOfDay = `${day}T${dayEnd}`
    const today = busy.filter((e) => e.start.slice(0, 10) === day || e.end.slice(0, 10) === day)
      .sort((a, b) => a.start.localeCompare(b.start))
    for (const e of today) {
      if (e.start > cursor) {
        const gapEnd = e.start < endOfDay ? e.start : endOfDay
        const mins = (Date.parse(`${gapEnd}:00Z`) - Date.parse(`${cursor}:00Z`)) / 60000
        if (mins >= minMinutes) out.push({ start: cursor, end: gapEnd, minutes: mins })
      }
      if (e.end > cursor) cursor = e.end
      if (cursor >= endOfDay) break
    }
    if (cursor < endOfDay) {
      const mins = (Date.parse(`${endOfDay}:00Z`) - Date.parse(`${cursor}:00Z`)) / 60000
      if (mins >= minMinutes) out.push({ start: cursor, end: endOfDay, minutes: mins })
    }
  }
  return { timezone: TZ, slots: out }
}

/* ───────────── writes ───────────── */

let logReady = false
async function ensureLog() {
  if (logReady) return
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS assistant_actions (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      person      TEXT NOT NULL,
      key_name    TEXT,
      action      TEXT NOT NULL,
      calendar    TEXT,
      event_id    TEXT,
      before      JSONB,
      after       JSONB,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
  logReady = true
}
async function log(person: string, keyName: string | null, action: string, calendar: string | null, eventId: string | null, before: unknown, after: unknown) {
  try {
    await ensureLog()
    await db.execute(sql`
      INSERT INTO assistant_actions (person, key_name, action, calendar, event_id, before, after)
      VALUES (${person}, ${keyName}, ${action}, ${calendar}, ${eventId},
              ${before === null ? null : JSON.stringify(before)}::jsonb, ${after === null ? null : JSON.stringify(after)}::jsonb)`)
  } catch (e) { console.error('[assistant] log failed', e) }
}

function checkWindow(start: string) {
  const t = berlinToDate(start).getTime()
  const now = Date.now()
  if (t < now - 864e5 || t > now + 90 * 864e5) throw new Error('outside_window: writes only from yesterday to 90 days ahead')
}

async function tokenFor(person: string, calendar?: string | null) {
  const cals = await calendarsForPerson(person)
  if (!cals.length) throw new Error('no_calendar_connected')
  if (!calendar) return cals[0]
  const c = cals.find((x) => x.calendar === calendar.toLowerCase())
  if (!c) throw new Error(`unknown_calendar: use one of ${cals.map((x) => x.calendar).join(', ')}`)
  return c
}

async function loadEvent(token: string, calendar: string, id: string) {
  const e = await graph(token, `/me/events/${encodeURIComponent(id)}?$select=${SELECT}`) as GraphEvent
  return shape(calendar, calendar, e)
}

function guard(ev: AssistantEvent, notify: boolean, what: string) {
  if (!ev.isOrganizer) throw new Error(`not_organizer: ${what} is only allowed for events you organise ("${ev.subject}" is organised by ${ev.organizer ?? 'someone else'})`)
  if (ev.otherAttendees > 0 && !notify) {
    throw new Error(`has_attendees: "${ev.subject}" has ${ev.otherAttendees} other attendee(s): ${ev.attendees.join(', ')}. ${what} would notify them. Repeat with notify_attendees: true only if the user explicitly wants that.`)
  }
}

export async function createBlock(person: string, keyName: string | null, a: {
  subject: string; start: string; minutes?: number; end?: string; calendar?: string
  showAs?: string; importance?: string; categories?: string[]; body?: string
}) {
  checkWindow(a.start)
  const c = await tokenFor(person, a.calendar)
  const start = toGraphTime(a.start)
  const end = a.end ? toGraphTime(a.end) : { dateTime: addMinutes(a.start, a.minutes ?? 60), timeZone: start.timeZone }
  const created = await graph(c.token, '/me/events', {
    method: 'POST',
    body: JSON.stringify({
      subject: a.subject, start, end,
      showAs: a.showAs ?? 'busy', importance: a.importance ?? 'normal',
      categories: a.categories ?? [],
      body: a.body ? { contentType: 'text', content: a.body } : undefined,
      isReminderOn: false,
    }),
  }) as GraphEvent
  const ev = shape(c.calendar, c.calendar, created)
  await log(person, keyName, 'create', c.calendar, ev.id, null, ev)
  return ev
}

export async function moveEvent(person: string, keyName: string | null, a: {
  id: string; calendar?: string; start: string; minutes?: number; notify_attendees?: boolean
}) {
  checkWindow(a.start)
  const c = await tokenFor(person, a.calendar)
  const before = await loadEvent(c.token, c.calendar, a.id)
  guard(before, Boolean(a.notify_attendees), 'Moving')
  const dur = a.minutes ?? Math.round((Date.parse(`${before.end}:00Z`) - Date.parse(`${before.start}:00Z`)) / 60000)
  const start = toGraphTime(a.start)
  const end = { dateTime: addMinutes(a.start, dur), timeZone: start.timeZone }
  const updated = await graph(c.token, `/me/events/${encodeURIComponent(a.id)}`, {
    method: 'PATCH', body: JSON.stringify({ start, end }),
  }) as GraphEvent
  const ev = shape(c.calendar, c.calendar, updated)
  await log(person, keyName, 'move', c.calendar, a.id, before, ev)
  return { before: { start: before.start, end: before.end }, after: ev }
}

export async function updateEvent(person: string, keyName: string | null, a: {
  id: string; calendar?: string; subject?: string; importance?: string; showAs?: string
  categories?: string[]; body?: string
}) {
  const c = await tokenFor(person, a.calendar)
  const before = await loadEvent(c.token, c.calendar, a.id)
  if (!before.isOrganizer && (a.subject || a.body)) throw new Error('not_organizer: only importance, categories and show-as can be changed on invitations')
  const patch: Record<string, unknown> = {}
  if (a.subject) patch.subject = a.subject
  if (a.importance) patch.importance = a.importance
  if (a.showAs) patch.showAs = a.showAs
  if (a.categories) patch.categories = a.categories
  if (a.body) patch.body = { contentType: 'text', content: a.body }
  const updated = await graph(c.token, `/me/events/${encodeURIComponent(a.id)}`, { method: 'PATCH', body: JSON.stringify(patch) }) as GraphEvent
  const ev = shape(c.calendar, c.calendar, updated)
  await log(person, keyName, 'update', c.calendar, a.id, before, ev)
  return ev
}

export async function deleteEvent(person: string, keyName: string | null, a: { id: string; calendar?: string; notify_attendees?: boolean }) {
  const c = await tokenFor(person, a.calendar)
  const before = await loadEvent(c.token, c.calendar, a.id)
  checkWindow(before.start)
  guard(before, Boolean(a.notify_attendees), 'Deleting')
  await graph(c.token, `/me/events/${encodeURIComponent(a.id)}`, { method: 'DELETE' })
  await log(person, keyName, 'delete', c.calendar, a.id, before, null)
  return { deleted: true, event: before }
}

export async function recentActions(person: string, limit = 20) {
  await ensureLog()
  const rows = await db.execute(sql`
    SELECT action, calendar, event_id, before->>'subject' AS subject,
           before->>'start' AS before_start, after->>'start' AS after_start, created_at::text AS at
    FROM assistant_actions WHERE person = ${person}
    ORDER BY created_at DESC LIMIT ${Math.min(limit, 100)}`)
  return rows
}

export async function sendMail(person: string, keyName: string | null, a: { to: string; subject: string; body: string }) {
  const html = a.body.split(/\n{2,}/).map((p) => `<p>${p.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>')}</p>`).join('')
  const r = await sendMailAs(person, a.to, a.subject, html)
  if (!r.ok) throw new Error(r.error ?? 'send_failed')
  await log(person, keyName, 'mail', null, null, null, { to: a.to, subject: a.subject })
  return { sent: true, to: a.to, subject: a.subject }
}
