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
      SELECT demographics, currencies, pains_gains, interview_contacts
      FROM bauplan_icp WHERE bauplan_id = ${draftId} LIMIT 1
    `)
  )
  const r = rows[0]
  return NextResponse.json({
    icp: r ? {
      demographics: r.demographics ?? {},
      currencies: r.currencies ?? [],
      painsGains: r.pains_gains ?? [],
      interviewContacts: r.interview_contacts ?? [],
    } : null,
  })
}

export async function PUT(request: Request, { params }: { params: Promise<{ draftId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { draftId } = await params
  await ensureBauplanV2Tables()
  if (!(await ensureOwnership(draftId, session.user.id))) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json().catch(() => ({} as Record<string, unknown>))
  const demographics = body.demographics ?? {}
  const currencies = body.currencies ?? []
  const painsGains = body.painsGains ?? []
  const interviewContacts = body.interviewContacts ?? []

  await db.execute(sql`
    INSERT INTO bauplan_icp (bauplan_id, demographics, currencies, pains_gains, interview_contacts, researched_at, updated_at)
    VALUES (${draftId}, ${JSON.stringify(demographics)}::jsonb, ${JSON.stringify(currencies)}::jsonb,
            ${JSON.stringify(painsGains)}::jsonb, ${JSON.stringify(interviewContacts)}::jsonb,
            NOW(), NOW())
    ON CONFLICT (bauplan_id) DO UPDATE SET
      demographics = EXCLUDED.demographics,
      currencies = EXCLUDED.currencies,
      pains_gains = EXCLUDED.pains_gains,
      interview_contacts = EXCLUDED.interview_contacts,
      researched_at = EXCLUDED.researched_at,
      updated_at = NOW()
  `)

  await db.execute(sql`
    INSERT INTO bauplan_step_states (bauplan_id, step_key, status, completed_at, points_awarded)
    VALUES (${draftId}, '02-icp', 'completed', NOW(), 250)
    ON CONFLICT (bauplan_id, step_key) DO UPDATE SET status = 'completed', completed_at = COALESCE(bauplan_step_states.completed_at, NOW())
  `)
  await db.execute(sql`UPDATE bauplan_drafts SET current_step_key = '03-challenges-outcomes', updated_at = NOW() WHERE id = ${draftId}`)

  return NextResponse.json({ ok: true })
}
