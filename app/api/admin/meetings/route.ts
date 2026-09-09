import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  createSeries, createMeeting, meetingView, seriesFor, meetingsFor, closeMeeting, addParticipant,
} from '@/lib/meetings/queries'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const maxDuration = 60

async function guard() {
  const s = await auth()
  const r = s?.user?.role
  return r === 'admin' || r === 'coach' ? s : null
}

export async function GET(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (id) {
    const view = await meetingView(id)
    return view
      ? NextResponse.json({ ok: true, ...view })
      : NextResponse.json({ error: 'nicht gefunden' }, { status: 404 })
  }
  const orgId = url.searchParams.get('orgId')
  if (!orgId) return NextResponse.json({ error: 'orgId oder id ist Pflicht' }, { status: 400 })
  return NextResponse.json({
    ok: true,
    series: await seriesFor(orgId),
    meetings: await meetingsFor(orgId),
  })
}

export async function POST(req: Request) {
  const s = await guard()
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const userId = s.user?.id ?? null

  switch (body?.action) {
    case 'series': {
      if (!body.orgId || !body.name) {
        return NextResponse.json({ error: 'orgId und name sind Pflicht' }, { status: 400 })
      }
      return NextResponse.json({ ok: true, id: await createSeries({ ...body, userId }) })
    }
    case 'meeting': {
      if (!body.orgId || !body.title || !body.startsAt) {
        return NextResponse.json({ error: 'orgId, title und startsAt sind Pflicht' }, { status: 400 })
      }
      return NextResponse.json({ ok: true, meeting: await createMeeting({ ...body, userId }) })
    }
    case 'participant': {
      if (!body.meetingId || !body.email) {
        return NextResponse.json({ error: 'meetingId und email sind Pflicht' }, { status: 400 })
      }
      return NextResponse.json({ ok: true, participant: await addParticipant(body) })
    }
    case 'decision': {
      if (!body.meetingId || !body.text) {
        return NextResponse.json({ error: 'meetingId und text sind Pflicht' }, { status: 400 })
      }
      const rows = await db.execute(sql`
        INSERT INTO meeting_decisions (meeting_id, series_id, text, rationale, decided_by, consequence, sort)
        VALUES (${body.meetingId},
                (SELECT series_id FROM meetings WHERE id = ${body.meetingId}),
                ${body.text}, ${body.rationale ?? null}, ${body.decidedBy ?? null},
                ${body.consequence ?? null},
                (SELECT COALESCE(MAX(sort), 0) + 1 FROM meeting_decisions WHERE meeting_id = ${body.meetingId}))
        RETURNING id`)
      return NextResponse.json({ ok: true, id: (rows as unknown as { id: string }[])[0].id })
    }
    case 'transcript': {
      if (!body.meetingId) return NextResponse.json({ error: 'meetingId ist Pflicht' }, { status: 400 })
      await db.execute(sql`
        UPDATE meetings SET transcript = ${body.transcript ?? null},
          transcript_source = ${body.source ?? 'upload'}, summary = COALESCE(${body.summary ?? null}, summary),
          updated_at = now()
        WHERE id = ${body.meetingId}`)
      return NextResponse.json({ ok: true })
    }
    case 'close': {
      if (!body.meetingId) return NextResponse.json({ error: 'meetingId ist Pflicht' }, { status: 400 })
      await closeMeeting(body.meetingId)
      return NextResponse.json({ ok: true })
    }
    default:
      return NextResponse.json({ error: 'unbekannte action' }, { status: 400 })
  }
}
