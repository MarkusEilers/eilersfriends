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

// GET: read all three sub-sections (business context + product + blocks)
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

  const bcRows = rowsOf<Record<string, unknown>>(
    await db.execute(sql`
      SELECT market_position, target_market, business_model, business_model_free_text, competitive_positioning
      FROM bauplan_business_context WHERE bauplan_id = ${draftId} LIMIT 1
    `)
  )
  const productRows = rowsOf<Record<string, unknown>>(
    await db.execute(sql`
      SELECT product_name, product_type, product_summary, product_url, product_stage
      FROM bauplan_product WHERE bauplan_id = ${draftId} LIMIT 1
    `)
  )
  const blockRows = rowsOf<Record<string, unknown>>(
    await db.execute(sql`
      SELECT id, name, description, is_bonus, "order"
      FROM bauplan_building_blocks WHERE bauplan_id = ${draftId}
      ORDER BY is_bonus ASC, "order" ASC
    `)
  )

  return NextResponse.json({
    businessContext: bcRows[0]
      ? {
          marketPosition: bcRows[0].market_position ?? '',
          targetMarket: bcRows[0].target_market ?? '',
          businessModel: bcRows[0].business_model ?? 'hybrid',
          businessModelFreeText: bcRows[0].business_model_free_text ?? '',
          competitivePositioning: bcRows[0].competitive_positioning ?? '',
        }
      : null,
    product: productRows[0]
      ? {
          productName: productRows[0].product_name ?? '',
          productType: productRows[0].product_type ?? 'programm',
          productSummary: productRows[0].product_summary ?? '',
          productUrl: productRows[0].product_url ?? '',
          productStage: productRows[0].product_stage ?? 'pilot',
        }
      : null,
    blocks: blockRows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description ?? '',
      isBonus: r.is_bonus,
      order: r.order,
    })),
  })
}

// PUT: upsert all three sub-sections atomically
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
  const bc = body.businessContext as Record<string, unknown> | null
  const product = body.product as Record<string, unknown> | null
  const blocks = (body.blocks as Array<Record<string, unknown>>) ?? []

  if (bc) {
    await db.execute(sql`
      INSERT INTO bauplan_business_context (bauplan_id, market_position, target_market, business_model,
                                            business_model_free_text, competitive_positioning, created_by, updated_at)
      VALUES (${draftId}, ${bc.marketPosition ?? null}, ${bc.targetMarket ?? null},
              ${bc.businessModel ?? null}, ${bc.businessModelFreeText ?? null},
              ${bc.competitivePositioning ?? null}, 'user', NOW())
      ON CONFLICT (bauplan_id) DO UPDATE SET
        market_position = EXCLUDED.market_position,
        target_market = EXCLUDED.target_market,
        business_model = EXCLUDED.business_model,
        business_model_free_text = EXCLUDED.business_model_free_text,
        competitive_positioning = EXCLUDED.competitive_positioning,
        updated_at = NOW()
    `)
  }

  if (product) {
    await db.execute(sql`
      INSERT INTO bauplan_product (bauplan_id, product_name, product_type, product_summary, product_url, product_stage, created_by, updated_at)
      VALUES (${draftId}, ${product.productName ?? null}, ${product.productType ?? null},
              ${product.productSummary ?? null}, ${product.productUrl ?? null}, ${product.productStage ?? null},
              'user', NOW())
      ON CONFLICT (bauplan_id) DO UPDATE SET
        product_name = EXCLUDED.product_name,
        product_type = EXCLUDED.product_type,
        product_summary = EXCLUDED.product_summary,
        product_url = EXCLUDED.product_url,
        product_stage = EXCLUDED.product_stage,
        updated_at = NOW()
    `)
  }

  // Diff-based block sync: delete missing, upsert remaining
  const incomingIds = blocks.map((b) => String(b.id ?? ''))
  if (incomingIds.length > 0) {
    await db.execute(sql`
      DELETE FROM bauplan_building_blocks
      WHERE bauplan_id = ${draftId}
        AND id::text NOT IN ${sql.raw('(' + incomingIds.map((i) => `'${i.replace(/'/g, "''")}'`).join(',') + ')')}
    `)
  } else {
    await db.execute(sql`DELETE FROM bauplan_building_blocks WHERE bauplan_id = ${draftId}`)
  }

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i]!
    await db.execute(sql`
      INSERT INTO bauplan_building_blocks (id, bauplan_id, name, description, is_bonus, "order", created_by)
      VALUES (${b.id ?? null}, ${draftId}, ${b.name ?? ''}, ${b.description ?? ''},
              ${Boolean(b.isBonus)}, ${i}, 'user')
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        is_bonus = EXCLUDED.is_bonus,
        "order" = EXCLUDED."order"
    `)
  }

  // Mark step as completed
  await db.execute(sql`
    INSERT INTO bauplan_step_states (bauplan_id, step_key, status, completed_at, points_awarded)
    VALUES (${draftId}, '01-business-product-blocks', 'completed', NOW(), 250)
    ON CONFLICT (bauplan_id, step_key) DO UPDATE SET
      status = 'completed',
      completed_at = COALESCE(bauplan_step_states.completed_at, NOW())
  `)
  await db.execute(sql`
    UPDATE bauplan_drafts SET updated_at = NOW(), current_step_key = '02-icp' WHERE id = ${draftId}
  `)

  return NextResponse.json({ ok: true })
}
