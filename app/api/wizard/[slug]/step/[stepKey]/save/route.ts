import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { ensureWizardTables } from '@/lib/db/self-heal'
import { B2B_ANGEBOTE_STEPS } from '@/lib/wizard/step-prompts'

export const runtime = 'nodejs'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string; stepKey: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { slug, stepKey } = await params
  const body = await request.json().catch(() => ({}))

  await ensureWizardTables()

  // Ensure row exists
  await db.execute(sql`
    INSERT INTO user_framework_state (user_id, framework_slug, current_step, progress, status)
    VALUES (${session.user.id}, ${slug}, 0, 0, 'active')
    ON CONFLICT (user_id, framework_slug) DO NOTHING
  `)

  // Determine total steps for the framework
  const totalSteps = slug === 'b2b-angebote' ? B2B_ANGEBOTE_STEPS.length : 8

  // Update step_answers JSON map + recalculate progress
  const valueJson = JSON.stringify(body)
  await db.execute(sql.raw(`
    UPDATE user_framework_state
    SET
      step_answers = COALESCE(step_answers, '{}'::json)::jsonb || ${`'${valueJson.replace(/'/g, "''")}'::jsonb`} #>> '{}' || jsonb_build_object('${stepKey.replace(/'/g, "''")}', ${`'${valueJson.replace(/'/g, "''")}'::jsonb`}),
      updated_at = now()
    WHERE user_id = '${session.user.id}' AND framework_slug = '${slug.replace(/'/g, "''")}'
  `)).catch(async () => {
    // Fallback simpler approach: read, modify in JS, write
    const rows = (await db.execute(sql`
      SELECT step_answers FROM user_framework_state
      WHERE user_id = ${session.user.id} AND framework_slug = ${slug} LIMIT 1
    `)) as unknown as Array<{ step_answers: Record<string, unknown> | null }> | { rows: Array<{ step_answers: Record<string, unknown> | null }> }
    const list = Array.isArray(rows) ? rows : ((rows as { rows: Array<{ step_answers: Record<string, unknown> | null }> }).rows)
    const current = (list[0]?.step_answers ?? {}) as Record<string, unknown>
    current[stepKey] = body
    await db.execute(sql`
      UPDATE user_framework_state
      SET step_answers = ${JSON.stringify(current)}::jsonb, updated_at = now()
      WHERE user_id = ${session.user.id} AND framework_slug = ${slug}
    `)
  })

  // Recompute progress
  const rows = (await db.execute(sql`
    SELECT step_answers FROM user_framework_state
    WHERE user_id = ${session.user.id} AND framework_slug = ${slug} LIMIT 1
  `)) as unknown as Array<{ step_answers: Record<string, unknown> | null }> | { rows: Array<{ step_answers: Record<string, unknown> | null }> }
  const list = Array.isArray(rows) ? rows : ((rows as { rows: Array<{ step_answers: Record<string, unknown> | null }> }).rows)
  const answers = (list[0]?.step_answers ?? {}) as Record<string, unknown>
  const completed = Object.keys(answers).length
  const progress = Math.min(100, Math.round((completed / totalSteps) * 100))

  await db.execute(sql`
    UPDATE user_framework_state
    SET progress = ${progress}, current_step = ${completed}, updated_at = now()
    WHERE user_id = ${session.user.id} AND framework_slug = ${slug}
  `)

  return NextResponse.json({ ok: true, progress, stepsCompleted: completed })
}
