import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { ensureBauplanV2Tables } from '@/lib/db/self-heal-v2'

export const runtime = 'nodejs'

function rowsOf<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[]
  if (r && typeof r === 'object' && 'rows' in r) {
    const x = (r as { rows: unknown }).rows
    if (Array.isArray(x)) return x as T[]
  }
  return []
}

async function ensureOwnership(draftId: string, userId: string) {
  const rows = rowsOf<{ id: string }>(
    await db.execute(sql`SELECT id FROM bauplan_drafts WHERE id = ${draftId} AND user_id = ${userId} LIMIT 1`)
  )
  return rows.length > 0
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ draftId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { draftId } = await params

  await ensureBauplanV2Tables()
  if (!(await ensureOwnership(draftId, session.user.id))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const cardRows = rowsOf<Record<string, unknown>>(
    await db.execute(sql`
      SELECT id, building_block_id, "column", text
      FROM bauplan_beef_radar_cards WHERE bauplan_id = ${draftId}
    `)
  )
  return NextResponse.json({
    cards: cardRows.map((r) => ({
      id: r.id,
      buildingBlockId: r.building_block_id,
      column: r.column,
      text: r.text,
    })),
  })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ draftId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { draftId } = await params

  await ensureBauplanV2Tables()
  if (!(await ensureOwnership(draftId, session.user.id))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json().catch(() => ({} as Record<string, unknown>))
  const cards = (body.cards as Array<Record<string, unknown>>) ?? []

  // Replace-all: delete then insert
  await db.execute(sql`DELETE FROM bauplan_beef_radar_cards WHERE bauplan_id = ${draftId}`)
  for (const c of cards) {
    if (!c.buildingBlockId || !c.column) continue
    await db.execute(sql`
      INSERT INTO bauplan_beef_radar_cards (bauplan_id, building_block_id, "column", text, created_by)
      VALUES (${draftId}, ${c.buildingBlockId as string}, ${c.column as string},
              ${(c.text as string) ?? ''}, 'user')
    `)
  }

  await db.execute(sql`
    INSERT INTO bauplan_step_states (bauplan_id, step_key, status, completed_at, points_awarded)
    VALUES (${draftId}, '04-beef-radar', 'completed', NOW(), 250)
    ON CONFLICT (bauplan_id, step_key) DO UPDATE SET
      status = 'completed',
      completed_at = COALESCE(bauplan_step_states.completed_at, NOW())
  `)
  await db.execute(sql`
    UPDATE bauplan_drafts SET updated_at = NOW(), current_step_key = '05-future-problems' WHERE id = ${draftId}
  `)

  return NextResponse.json({ ok: true })
}
