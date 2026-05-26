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

export async function GET(_req: Request, { params }: { params: Promise<{ draftId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { draftId } = await params
  await ensureBauplanV2Tables()
  if (!(await ensureOwnership(draftId, session.user.id))) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const rows = rowsOf<Record<string, unknown>>(
    await db.execute(sql`SELECT id, cluster_name, economic_value_per_unit, unit, confidence_level, methodology, contained_cards, "order" FROM bauplan_economic_clusters WHERE bauplan_id = ${draftId} ORDER BY "order" ASC`)
  )
  const budgetRows = rowsOf<Record<string, unknown>>(
    await db.execute(sql`SELECT maximum_budget FROM bauplan_drafts WHERE id = ${draftId} LIMIT 1`)
  )
  return NextResponse.json({
    clusters: rows.map((r) => ({
      id: r.id, clusterName: r.cluster_name, economicValuePerUnit: Number(r.economic_value_per_unit ?? 0),
      unit: r.unit, confidenceLevel: r.confidence_level, methodology: r.methodology ?? '',
      containedCards: r.contained_cards ?? [], order: r.order ?? 0,
    })),
    maximumBudget: budgetRows[0]?.maximum_budget ?? null,
  })
}

export async function PUT(request: Request, { params }: { params: Promise<{ draftId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { draftId } = await params
  await ensureBauplanV2Tables()
  if (!(await ensureOwnership(draftId, session.user.id))) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json().catch(() => ({} as Record<string, unknown>))
  const clusters = (body.clusters as Array<Record<string, unknown>>) ?? []
  const maximumBudget = body.maximumBudget ?? null

  await db.execute(sql`DELETE FROM bauplan_economic_clusters WHERE bauplan_id = ${draftId}`)
  for (let i = 0; i < clusters.length; i++) {
    const c = clusters[i]!
    if (!c.clusterName) continue
    await db.execute(sql`
      INSERT INTO bauplan_economic_clusters (id, bauplan_id, cluster_name, economic_value_per_unit, unit, confidence_level, methodology, contained_cards, "order", created_by)
      VALUES (${(c.id as string) ?? null}, ${draftId}, ${(c.clusterName as string) ?? ''},
              ${Number(c.economicValuePerUnit ?? 0)}, ${(c.unit as string) ?? 'company/year'},
              ${(c.confidenceLevel as string) ?? 'hypothese'}, ${(c.methodology as string) ?? ''},
              ${JSON.stringify(c.containedCards ?? [])}::jsonb, ${i}, ${(c.createdBy as string) ?? 'user'})
    `)
  }
  await db.execute(sql`UPDATE bauplan_drafts SET maximum_budget = ${JSON.stringify(maximumBudget)}::jsonb WHERE id = ${draftId}`)

  await db.execute(sql`
    INSERT INTO bauplan_step_states (bauplan_id, step_key, status, completed_at, points_awarded)
    VALUES (${draftId}, '06-economic-cluster', 'completed', NOW(), 250)
    ON CONFLICT (bauplan_id, step_key) DO UPDATE SET status = 'completed', completed_at = COALESCE(bauplan_step_states.completed_at, NOW())
  `)
  await db.execute(sql`UPDATE bauplan_drafts SET current_step_key = '07-bulletproof', updated_at = NOW() WHERE id = ${draftId}`)
  return NextResponse.json({ ok: true })
}
