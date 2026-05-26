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

export async function GET(_request: Request, { params }: { params: Promise<{ draftId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { draftId } = await params
  await ensureBauplanV2Tables()
  if (!(await ensureOwnership(draftId, session.user.id))) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const rows = rowsOf<Record<string, unknown>>(
    await db.execute(sql`
      SELECT id, type, topic, reality, economic_impact, kpi, "order"
      FROM bauplan_challenges WHERE bauplan_id = ${draftId} ORDER BY type ASC, "order" ASC
    `)
  )
  return NextResponse.json({
    items: rows.map((r) => ({
      id: r.id,
      type: r.type,
      topic: r.topic,
      reality: r.reality ?? '',
      economicImpact: r.economic_impact ?? '',
      kpi: r.kpi ?? '',
      order: r.order ?? 0,
    })),
  })
}

export async function PUT(request: Request, { params }: { params: Promise<{ draftId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { draftId } = await params
  await ensureBauplanV2Tables()
  if (!(await ensureOwnership(draftId, session.user.id))) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json().catch(() => ({} as Record<string, unknown>))
  const items = (body.items as Array<Record<string, unknown>>) ?? []

  await db.execute(sql`DELETE FROM bauplan_challenges WHERE bauplan_id = ${draftId}`)
  for (let i = 0; i < items.length; i++) {
    const it = items[i]!
    if (!it.topic) continue
    await db.execute(sql`
      INSERT INTO bauplan_challenges (id, bauplan_id, type, topic, reality, economic_impact, kpi, "order", created_by)
      VALUES (${it.id ?? null}, ${draftId}, ${it.type as string},
              ${(it.topic as string) ?? ''}, ${(it.reality as string) ?? ''},
              ${(it.economicImpact as string) ?? ''}, ${(it.kpi as string) ?? ''},
              ${i}, ${(it.createdBy as string) ?? 'user'})
    `)
  }

  await db.execute(sql`
    INSERT INTO bauplan_step_states (bauplan_id, step_key, status, completed_at, points_awarded)
    VALUES (${draftId}, '03-challenges-outcomes', 'completed', NOW(), 250)
    ON CONFLICT (bauplan_id, step_key) DO UPDATE SET status = 'completed', completed_at = COALESCE(bauplan_step_states.completed_at, NOW())
  `)
  await db.execute(sql`UPDATE bauplan_drafts SET current_step_key = '04-beef-radar', updated_at = NOW() WHERE id = ${draftId}`)

  return NextResponse.json({ ok: true })
}
