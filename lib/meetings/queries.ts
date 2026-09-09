import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { randomBytes } from 'crypto'
import { ensureMeetingSchema, BOARD_TEMPLATES, type BoardKind } from './schema'

const token = () => randomBytes(18).toString('base64url')

/* ─────────────────────────── Kontakte ─────────────────────────── */

/** Finden oder anlegen — nie neu. Der Dedup-Schluessel ist die Adresse. */
export async function upsertContact(input: {
  email: string; name?: string | null; orgId?: string | null; role?: string | null; source?: string
}): Promise<string> {
  await ensureMeetingSchema()
  const email = input.email.trim().toLowerCase()
  const parts = (input.name ?? '').trim().split(/\s+/)
  const first = parts.length > 1 ? parts.slice(0, -1).join(' ') : (parts[0] || null)
  const last = parts.length > 1 ? parts[parts.length - 1] : null
  const rows = await db.execute(sql`
    INSERT INTO contacts (email, org_id, first_name, last_name, role, source)
    VALUES (${email}, ${input.orgId ?? null}, ${first}, ${last}, ${input.role ?? null}, ${input.source ?? 'meeting'})
    ON CONFLICT (email) DO UPDATE SET
      org_id = COALESCE(contacts.org_id, EXCLUDED.org_id),
      first_name = COALESCE(contacts.first_name, EXCLUDED.first_name),
      last_name = COALESCE(contacts.last_name, EXCLUDED.last_name),
      role = COALESCE(contacts.role, EXCLUDED.role),
      updated_at = now()
    RETURNING id`)
  const id = (rows as unknown as { id: string }[])[0].id
  // Falls es zu dieser Adresse schon einen Zugang gibt, gleich verbinden.
  await db.execute(sql`
    UPDATE contacts c SET user_id = u.id FROM users u
    WHERE c.id = ${id} AND lower(u.email) = ${email} AND c.user_id IS NULL`).catch(() => {})
  return id
}

/**
 * Kontakt und Zugang verbinden.
 *
 * Der Schluessel ist die Adresse: Wer sich mit derselben E-Mail anmeldet, mit
 * der er in einer Besprechung sass, ist derselbe Mensch. Die Verbindung wird
 * gesetzt, nicht geraten — und sie laeuft in beide Richtungen: aus dem Kontakt
 * wird ein Zugang, wenn jemand kauft; aus dem Zugang wird ein Kontakt, wenn wir
 * ihn zum ersten Mal in eine Besprechung einladen.
 */
export async function linkContactToUser(email: string): Promise<{ contactId: string | null; userId: string | null }> {
  await ensureMeetingSchema()
  const mail = email.trim().toLowerCase()
  const rows = await db.execute(sql`
    UPDATE contacts c SET user_id = u.id, updated_at = now()
    FROM users u
    WHERE lower(u.email) = ${mail} AND lower(c.email) = ${mail} AND c.user_id IS DISTINCT FROM u.id
    RETURNING c.id AS contact_id, u.id AS user_id`)
  const hit = (rows as unknown as { contact_id: string; user_id: string }[])[0]
  if (hit) return { contactId: hit.contact_id, userId: hit.user_id }

  const existing = await db.execute(sql`
    SELECT id, user_id FROM contacts WHERE lower(email) = ${mail} LIMIT 1`)
  const c = (existing as unknown as { id: string; user_id: string | null }[])[0]
  return { contactId: c?.id ?? null, userId: c?.user_id ?? null }
}

/* ─────────────────────────── Strang ─────────────────────────── */

export async function createSeries(input: {
  orgId: string; name: string; purpose?: string | null; cadence?: string | null; userId?: string | null
}) {
  await ensureMeetingSchema()
  const rows = await db.execute(sql`
    INSERT INTO meeting_series (org_id, name, purpose, cadence, created_by)
    VALUES (${input.orgId}, ${input.name}, ${input.purpose ?? null}, ${input.cadence ?? null}, ${input.userId ?? null})
    RETURNING id`)
  const seriesId = (rows as unknown as { id: string }[])[0].id

  // Die beiden Bretter aus der Vorlage. Ab hier gehoeren sie dem Strang und
  // koennen dort umbenannt oder erweitert werden, ohne andere Straenge zu treffen.
  let boardSort = 0
  for (const kind of Object.keys(BOARD_TEMPLATES) as BoardKind[]) {
    const tpl = BOARD_TEMPLATES[kind]
    const b = await db.execute(sql`
      INSERT INTO meeting_boards (series_id, kind, name, sort)
      VALUES (${seriesId}, ${kind}, ${tpl.name}, ${boardSort++})
      RETURNING id`)
    const boardId = (b as unknown as { id: string }[])[0].id
    let colSort = 0
    for (const c of tpl.columns) {
      await db.execute(sql`
        INSERT INTO meeting_board_columns (board_id, key, name, sort, color, is_done)
        VALUES (${boardId}, ${c.key}, ${c.name}, ${colSort++}, ${c.color},
                ${'is_done' in c ? Boolean((c as { is_done?: boolean }).is_done) : false})`)
    }
  }
  return seriesId
}

export interface BoardView {
  id: string; kind: string; name: string; sort: number
  columns: Array<{ id: string; key: string; name: string; sort: number; color: string | null; is_done: boolean }>
  cards: CardRow[]
}

export interface CardRow {
  id: string; board_id: string; column_id: string | null
  title: string; body: string | null
  assignee_contact_id: string | null; assignee_name: string | null
  due_date: string | null; sort: number; version: number
  carried_count: number; origin_meeting_id: string | null
  closed_at: string | null
  comment_count: number
}

/** Die Bretter eines Strangs mit ihren offenen Karten. */
export async function boardsOf(seriesId: string, opts?: { includeClosed?: boolean }): Promise<BoardView[]> {
  await ensureMeetingSchema()
  const boards = (await db.execute(sql`
    SELECT id, kind, name, sort FROM meeting_boards WHERE series_id = ${seriesId} ORDER BY sort`)) as unknown as
    Array<{ id: string; kind: string; name: string; sort: number }>

  const cols = (await db.execute(sql`
    SELECT c.* FROM meeting_board_columns c
    JOIN meeting_boards b ON b.id = c.board_id
    WHERE b.series_id = ${seriesId} ORDER BY c.sort`)) as unknown as
    Array<BoardView['columns'][number] & { board_id: string }>

  const cards = (await db.execute(sql`
    SELECT k.id, k.board_id, k.column_id, k.title, k.body, k.assignee_contact_id,
           TRIM(CONCAT(ct.first_name, ' ', ct.last_name)) AS assignee_name,
           k.due_date, k.sort, k.version, k.carried_count, k.origin_meeting_id, k.closed_at,
           (SELECT COUNT(*)::int FROM meeting_card_events e
              WHERE e.card_id = k.id AND e.kind = 'kommentar') AS comment_count
    FROM meeting_cards k
    LEFT JOIN contacts ct ON ct.id = k.assignee_contact_id
    WHERE k.series_id = ${seriesId}
      ${opts?.includeClosed ? sql`` : sql`AND k.closed_at IS NULL`}
    ORDER BY k.sort`)) as unknown as CardRow[]

  return boards.map((b) => ({
    ...b,
    columns: cols.filter((c) => c.board_id === b.id),
    cards: cards.filter((k) => k.board_id === b.id),
  }))
}

/* ─────────────────────────── Termine ─────────────────────────── */

export async function createMeeting(input: {
  orgId: string; seriesId?: string | null; title: string
  startsAt: string; endsAt?: string | null; location?: string | null
  participants?: Array<{ email: string; name?: string | null; role?: string | null }>
  userId?: string | null
}) {
  await ensureMeetingSchema()
  const rows = await db.execute(sql`
    INSERT INTO meetings (org_id, series_id, title, starts_at, ends_at, location, share_token, created_by)
    VALUES (${input.orgId}, ${input.seriesId ?? null}, ${input.title}, ${input.startsAt},
            ${input.endsAt ?? null}, ${input.location ?? null}, ${token()}, ${input.userId ?? null})
    RETURNING id, share_token`)
  const meeting = (rows as unknown as { id: string; share_token: string }[])[0]

  for (const p of input.participants ?? []) {
    await addParticipant({ meetingId: meeting.id, orgId: input.orgId, ...p })
  }
  return meeting
}

export async function addParticipant(input: {
  meetingId: string; orgId?: string | null; email: string; name?: string | null; role?: string | null
}) {
  await ensureMeetingSchema()
  const contactId = await upsertContact({
    email: input.email, name: input.name, orgId: input.orgId ?? null, role: input.role,
  })
  const rows = await db.execute(sql`
    INSERT INTO meeting_participants (meeting_id, contact_id, email, name, role, token)
    VALUES (${input.meetingId}, ${contactId}, ${input.email.trim().toLowerCase()},
            ${input.name ?? null}, ${input.role ?? 'teilnehmer'}, ${token()})
    ON CONFLICT (meeting_id, lower(email)) DO UPDATE SET
      name = COALESCE(EXCLUDED.name, meeting_participants.name),
      role = EXCLUDED.role
    RETURNING id, token, contact_id`)
  return (rows as unknown as { id: string; token: string; contact_id: string }[])[0]
}

/**
 * Ein Termin mit allem, was dazugehoert — und dem lebenden Brett des Strangs.
 *
 * Genau das ist der Punkt am Bezug: Es wird nichts kopiert. Der naechste Termin
 * derselben Reihe sieht dieselben Karten, in dem Zustand, in dem sie inzwischen
 * sind.
 */
export async function meetingView(id: string, byToken = false) {
  await ensureMeetingSchema()
  const rows = await db.execute(sql`
    SELECT m.*, s.name AS series_name, s.purpose AS series_purpose, c.name AS org_name
    FROM meetings m
    LEFT JOIN meeting_series s ON s.id = m.series_id
    LEFT JOIN companies c ON c.id = m.org_id
    WHERE ${byToken ? sql`m.share_token = ${id}` : sql`m.id = ${id}::uuid`}
    LIMIT 1`)
  const meeting = (rows as unknown as Array<Record<string, unknown>>)[0]
  if (!meeting) return null

  const [participants, decisions, boards, previous] = await Promise.all([
    db.execute(sql`
      SELECT id, contact_id, email, name, role, attended, opened_at
      FROM meeting_participants WHERE meeting_id = ${meeting.id} ORDER BY role, name`),
    db.execute(sql`
      SELECT id, text, rationale, decided_by, consequence, sort, created_at
      FROM meeting_decisions WHERE meeting_id = ${meeting.id} ORDER BY sort, created_at`),
    meeting.series_id ? boardsOf(String(meeting.series_id)) : Promise.resolve([]),
    meeting.series_id
      ? db.execute(sql`
          SELECT id, title, starts_at, status FROM meetings
          WHERE series_id = ${meeting.series_id} AND starts_at < ${meeting.starts_at}
          ORDER BY starts_at DESC LIMIT 5`)
      : Promise.resolve([]),
  ])

  return {
    meeting,
    participants: participants as unknown as Array<Record<string, unknown>>,
    decisions: decisions as unknown as Array<Record<string, unknown>>,
    boards,
    previous: previous as unknown as Array<Record<string, unknown>>,
  }
}

/* ─────────────────────────── Karten ─────────────────────────── */

export interface Actor { name?: string | null; email?: string | null; userId?: string | null }

async function logEvent(input: {
  cardId: string; meetingId?: string | null; kind: string
  from?: string | null; to?: string | null; comment?: string | null
  actor: Actor; payload?: Record<string, unknown>
}) {
  await db.execute(sql`
    INSERT INTO meeting_card_events (card_id, meeting_id, kind, from_column, to_column, comment,
      actor_name, actor_email, actor_user_id, payload)
    VALUES (${input.cardId}, ${input.meetingId ?? null}, ${input.kind}, ${input.from ?? null},
            ${input.to ?? null}, ${input.comment ?? null}, ${input.actor.name ?? null},
            ${input.actor.email ?? null}, ${input.actor.userId ?? null},
            ${JSON.stringify(input.payload ?? {})}::jsonb)`)
}

export async function addCard(input: {
  seriesId: string; boardId: string; columnId: string; title: string; body?: string | null
  meetingId?: string | null; assigneeEmail?: string | null; dueDate?: string | null; actor: Actor
}) {
  await ensureMeetingSchema()
  const assignee = input.assigneeEmail ? await upsertContact({ email: input.assigneeEmail }) : null
  const rows = await db.execute(sql`
    INSERT INTO meeting_cards (series_id, board_id, column_id, title, body, assignee_contact_id,
      due_date, sort, origin_meeting_id, created_by)
    VALUES (${input.seriesId}, ${input.boardId}, ${input.columnId}, ${input.title}, ${input.body ?? null},
            ${assignee}, ${input.dueDate ?? null},
            (SELECT COALESCE(MAX(sort), 0) + 100 FROM meeting_cards WHERE column_id = ${input.columnId}),
            ${input.meetingId ?? null}, ${input.actor.name ?? input.actor.email ?? null})
    RETURNING id`)
  const cardId = (rows as unknown as { id: string }[])[0].id
  await logEvent({ cardId, meetingId: input.meetingId, kind: 'angelegt', to: input.columnId, actor: input.actor })
  return cardId
}

/**
 * Verschieben mit Versionspruefung.
 *
 * Bei voller Mitarbeit greifen zwei Leute irgendwann gleichzeitig zu. Eine
 * Sperre waere das falsche Mittel — sie haelt den auf, der gerade arbeitet. Die
 * Version sagt nur: Dein Stand war veraltet, hol Dir den neuen.
 */
export async function moveCard(input: {
  cardId: string; columnId: string; sort?: number; version?: number
  meetingId?: string | null; actor: Actor
}): Promise<{ ok: boolean; conflict?: boolean; version?: number }> {
  await ensureMeetingSchema()
  const cur = (await db.execute(sql`
    SELECT column_id, version, board_id FROM meeting_cards WHERE id = ${input.cardId}`)) as unknown as
    Array<{ column_id: string | null; version: number; board_id: string }>
  if (!cur.length) return { ok: false }
  if (input.version != null && input.version !== cur[0].version) {
    return { ok: false, conflict: true, version: cur[0].version }
  }

  const isDone = (await db.execute(sql`
    SELECT is_done FROM meeting_board_columns WHERE id = ${input.columnId}`)) as unknown as
    Array<{ is_done: boolean }>

  await db.execute(sql`
    UPDATE meeting_cards SET
      column_id = ${input.columnId},
      sort = COALESCE(${input.sort ?? null}, sort),
      version = version + 1,
      closed_at = ${isDone[0]?.is_done ? sql`now()` : sql`NULL`},
      closed_meeting_id = ${isDone[0]?.is_done ? (input.meetingId ?? null) : null},
      updated_at = now()
    WHERE id = ${input.cardId}`)

  await logEvent({
    cardId: input.cardId, meetingId: input.meetingId, kind: 'verschoben',
    from: cur[0].column_id, to: input.columnId, actor: input.actor,
  })
  return { ok: true, version: cur[0].version + 1 }
}

export async function commentCard(input: {
  cardId: string; text: string; meetingId?: string | null; actor: Actor
}) {
  await ensureMeetingSchema()
  await logEvent({
    cardId: input.cardId, meetingId: input.meetingId, kind: 'kommentar',
    comment: input.text, actor: input.actor,
  })
}

export async function cardHistory(cardId: string) {
  await ensureMeetingSchema()
  const rows = await db.execute(sql`
    SELECT e.*, cf.name AS from_name, ct.name AS to_name
    FROM meeting_card_events e
    LEFT JOIN meeting_board_columns cf ON cf.id = e.from_column
    LEFT JOIN meeting_board_columns ct ON ct.id = e.to_column
    WHERE e.card_id = ${cardId} ORDER BY e.created_at DESC LIMIT 100`)
  return rows as unknown as Array<Record<string, unknown>>
}

/* ─────────────────────────── Abschluss ─────────────────────────── */

/**
 * Beim Abschliessen passiert dreierlei: Der Stand wird eingefroren, die offenen
 * Karten bekommen einen Strich auf dem Bierdeckel — und ab dem naechsten Termin
 * sieht man, was zum vierten Mal mitlaeuft.
 */
export async function closeMeeting(meetingId: string) {
  await ensureMeetingSchema()
  const view = await meetingView(meetingId)
  if (!view) throw new Error('Termin nicht gefunden')

  await db.execute(sql`
    INSERT INTO meeting_snapshots (meeting_id, payload)
    VALUES (${meetingId}, ${JSON.stringify({
      boards: view.boards, decisions: view.decisions, participants: view.participants,
      frozen_at: new Date().toISOString(),
    })}::jsonb)
    ON CONFLICT (meeting_id) DO UPDATE SET payload = EXCLUDED.payload, created_at = now()`)

  if (view.meeting.series_id) {
    await db.execute(sql`
      UPDATE meeting_cards SET carried_count = carried_count + 1
      WHERE series_id = ${view.meeting.series_id} AND closed_at IS NULL`)
  }

  await db.execute(sql`
    UPDATE meetings SET status = 'protokolliert', closed_at = now(), updated_at = now()
    WHERE id = ${meetingId}`)

  return view
}

export async function seriesFor(orgId: string) {
  await ensureMeetingSchema()
  const rows = await db.execute(sql`
    SELECT s.*,
      (SELECT COUNT(*)::int FROM meetings m WHERE m.series_id = s.id) AS meeting_count,
      (SELECT MAX(starts_at) FROM meetings m WHERE m.series_id = s.id) AS last_meeting,
      (SELECT COUNT(*)::int FROM meeting_cards k WHERE k.series_id = s.id AND k.closed_at IS NULL) AS open_cards
    FROM meeting_series s WHERE s.org_id = ${orgId} ORDER BY s.created_at DESC`)
  return rows as unknown as Array<Record<string, unknown>>
}

export async function meetingsFor(orgId: string, limit = 50) {
  await ensureMeetingSchema()
  const rows = await db.execute(sql`
    SELECT m.id, m.title, m.starts_at, m.location, m.status, m.share_token,
           s.name AS series_name,
           (SELECT COUNT(*)::int FROM meeting_participants p WHERE p.meeting_id = m.id) AS participants
    FROM meetings m LEFT JOIN meeting_series s ON s.id = m.series_id
    WHERE m.org_id = ${orgId} ORDER BY m.starts_at DESC LIMIT ${limit}`)
  return rows as unknown as Array<Record<string, unknown>>
}
