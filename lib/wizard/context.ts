import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { ensureWizardTables } from '@/lib/db/self-heal'

export interface WizardContext {
  userId: string
  frameworkSlug: string
  currentStep: number
  previousAnswers: Record<string, unknown>
  user?: { email: string; firstName?: string }
}

export async function buildWizardContext(
  userId: string,
  frameworkSlug: string,
): Promise<WizardContext | null> {
  await ensureWizardTables()
  const rows = (await db.execute(sql`
    SELECT current_step, step_answers, progress, status
    FROM user_framework_state
    WHERE user_id = ${userId} AND framework_slug = ${frameworkSlug}
    LIMIT 1
  `)) as unknown as Array<{ current_step: number; step_answers: Record<string, unknown> | null }>
  const list = Array.isArray(rows) ? rows : ((rows as unknown as { rows?: unknown[] }).rows ?? [])
  const row = (list as Array<{ current_step: number; step_answers: Record<string, unknown> | null }>)[0]
  if (!row) return null
  return {
    userId,
    frameworkSlug,
    currentStep: row.current_step,
    previousAnswers: row.step_answers ?? {},
  }
}

export function contextSummary(ctx: WizardContext): string {
  const entries = Object.entries(ctx.previousAnswers)
  if (entries.length === 0) return 'Keine vorherigen Schritt-Antworten.'
  const parts: string[] = []
  for (const [stepKey, value] of entries) {
    parts.push(`Step ${stepKey}: ${JSON.stringify(value).slice(0, 600)}`)
  }
  return parts.join('\n')
}
