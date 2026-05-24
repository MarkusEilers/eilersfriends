import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { ensureWizardTables } from '@/lib/db/self-heal'
import { WizardEditorial } from '@/components/wizard/WizardEditorial'

export const dynamic = 'force-dynamic'

interface Row { current_step: number; progress: number; status: string; started_at: Date; step_answers: Record<string, unknown> | null }

function rowsOf<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[]
  if (r && typeof r === 'object' && 'rows' in r) {
    const x = (r as { rows: unknown }).rows
    if (Array.isArray(x)) return x as T[]
  }
  return []
}

export default async function FrameworkWizardPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')
  if (slug !== 'b2b-angebote') notFound()

  await ensureWizardTables()
  const userId = session.user.id
  await db.execute(sql`
    INSERT INTO user_framework_state (user_id, framework_slug, current_step, progress, status)
    VALUES (${userId}, ${slug}, 0, 0, 'active')
    ON CONFLICT (user_id, framework_slug) DO NOTHING
  `)
  const result = await db.execute(sql`
    SELECT current_step, progress, status, started_at, step_answers
    FROM user_framework_state WHERE user_id = ${userId} AND framework_slug = ${slug} LIMIT 1
  `)
  const rows = rowsOf<Row>(result)
  const row = rows[0] ?? { current_step: 0, progress: 0, status: 'active', started_at: new Date(), step_answers: {} }
  const answers = (row.step_answers ?? {}) as Record<string, unknown>
  const stepsCompleted = Object.keys(answers).length

  return <WizardEditorial answers={answers} stepsCompleted={stepsCompleted} startedAt={new Date(row.started_at)} />
}
