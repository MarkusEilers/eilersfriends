import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { addCard, moveCard, commentCard, cardHistory, meetingView, type Actor } from '@/lib/meetings/queries'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Wer darf hier arbeiten?
 *
 * Zwei Wege in dieselbe Tuer: angemeldet als Admin oder Coach, oder mit dem
 * persoenlichen Zugang aus der Einladung. Beides fuehrt zu einem Handelnden mit
 * Namen — anonym bewegt hier niemand eine Karte.
 */
async function actorFor(req: Request, meetingId?: string | null): Promise<{ actor: Actor; meetingId: string | null } | null> {
  const s = await auth()
  if (s?.user?.role === 'admin' || s?.user?.role === 'coach') {
    return { actor: { name: s.user.name ?? 'Team', email: s.user.email, userId: s.user.id }, meetingId: meetingId ?? null }
  }
  const token = new URL(req.url).searchParams.get('t') ?? req.headers.get('x-meeting-token')
  if (!token) return null
  const rows = await db.execute(sql`
    SELECT p.name, p.email, p.meeting_id FROM meeting_participants p WHERE p.token = ${token} LIMIT 1`)
  const p = (rows as unknown as { name: string | null; email: string; meeting_id: string }[])[0]
  if (!p) return null
  await db.execute(sql`UPDATE meeting_participants SET opened_at = COALESCE(opened_at, now()) WHERE token = ${token}`)
  return { actor: { name: p.name ?? p.email, email: p.email }, meetingId: p.meeting_id }
}

/** Der Stand des Bretts — fuer das Protokoll und fuer das Nachladen nach einem Konflikt. */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const token = url.searchParams.get('t')
  const card = url.searchParams.get('card')
  if (card) {
    const who = await actorFor(req)
    if (!who) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    return NextResponse.json({ ok: true, history: await cardHistory(card) })
  }
  if (!token) return NextResponse.json({ error: 'Kein Zugang' }, { status: 401 })
  const rows = await db.execute(sql`SELECT meeting_id FROM meeting_participants WHERE token = ${token} LIMIT 1`)
  const p = (rows as unknown as { meeting_id: string }[])[0]
  if (!p) return NextResponse.json({ error: 'Kein Zugang' }, { status: 401 })
  const view = await meetingView(p.meeting_id)
  return NextResponse.json({ ok: true, ...view })
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const who = await actorFor(req, body?.meetingId)
  if (!who) return NextResponse.json({ error: 'Kein Zugang' }, { status: 401 })
  const meetingId = body?.meetingId ?? who.meetingId

  switch (body?.action) {
    case 'add': {
      if (!body.seriesId || !body.boardId || !body.columnId || !body.title?.trim()) {
        return NextResponse.json({ error: 'seriesId, boardId, columnId und title sind Pflicht' }, { status: 400 })
      }
      const id = await addCard({ ...body, meetingId, actor: who.actor })
      return NextResponse.json({ ok: true, id })
    }
    case 'move': {
      if (!body.cardId || !body.columnId) {
        return NextResponse.json({ error: 'cardId und columnId sind Pflicht' }, { status: 400 })
      }
      const res = await moveCard({ ...body, meetingId, actor: who.actor })
      return NextResponse.json(res, { status: res.conflict ? 409 : res.ok ? 200 : 404 })
    }
    case 'comment': {
      if (!body.cardId || !body.text?.trim()) {
        return NextResponse.json({ error: 'cardId und text sind Pflicht' }, { status: 400 })
      }
      await commentCard({ cardId: body.cardId, text: body.text, meetingId, actor: who.actor })
      return NextResponse.json({ ok: true })
    }
    case 'assign': {
      if (!body.cardId) return NextResponse.json({ error: 'cardId ist Pflicht' }, { status: 400 })
      const { upsertContact } = await import('@/lib/meetings/queries')
      const contactId = body.email ? await upsertContact({ email: body.email }) : null
      await db.execute(sql`
        UPDATE meeting_cards SET assignee_contact_id = ${contactId}, due_date = ${body.dueDate ?? null},
          version = version + 1, updated_at = now()
        WHERE id = ${body.cardId}`)
      return NextResponse.json({ ok: true })
    }
    default:
      return NextResponse.json({ error: 'unbekannte action' }, { status: 400 })
  }
}
