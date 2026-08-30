import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { ensureFactSchema } from './schema'

/**
 * Eigene Vorlagen und Beispiele. Sie steuern die Qualität der Agent-Ergebnisse
 * stärker als jede Prompt-Formulierung: Ein Modell ahmt nach, was es sieht.
 *
 * Reihenfolge beim Einspeisen: is_gold zuerst, dann mandantenspezifisch,
 * dann allgemein — analog zur Writer-Bibliothek.
 */

export interface StrategyTemplate {
  id: string
  step_key: string | null
  kind: 'example' | 'skeleton' | 'snippet' | 'style'
  title: string
  body: string
  tags: string[]
  is_gold: boolean
  company_id: string | null
  usage_count: number
  is_active: boolean
}

export async function forStep(stepKey: string, opts?: { tags?: string[]; companyId?: string | null; limit?: number }): Promise<StrategyTemplate[]> {
  await ensureFactSchema()
  const limit = opts?.limit ?? 4
  const res = await db.execute(sql`
    SELECT * FROM strategy_templates
    WHERE is_active
      AND (step_key = ${stepKey} OR step_key IS NULL)
      AND (company_id IS NULL OR company_id = ${opts?.companyId ?? null}::uuid)
      ${opts?.tags && opts.tags.length ? sql`AND tags && ${opts.tags}::text[]` : sql``}
    ORDER BY is_gold DESC,
             (company_id IS NOT NULL) DESC,
             (step_key IS NOT NULL) DESC,
             usage_count DESC, updated_at DESC
    LIMIT ${limit}`)
  return res as unknown as StrategyTemplate[]
}

export async function listTemplates(stepKey?: string | null): Promise<StrategyTemplate[]> {
  await ensureFactSchema()
  const res = stepKey
    ? await db.execute(sql`SELECT * FROM strategy_templates WHERE is_active AND step_key = ${stepKey} ORDER BY is_gold DESC, updated_at DESC`)
    : await db.execute(sql`SELECT * FROM strategy_templates WHERE is_active ORDER BY step_key NULLS FIRST, is_gold DESC, updated_at DESC`)
  return res as unknown as StrategyTemplate[]
}

export async function upsertTemplate(t: {
  id?: string; stepKey?: string | null; kind?: string; title: string; body: string
  tags?: string[]; isGold?: boolean; companyId?: string | null; userId?: string | null
}) {
  await ensureFactSchema()
  if (t.id) {
    await db.execute(sql`
      UPDATE strategy_templates SET step_key=${t.stepKey ?? null}, kind=${t.kind ?? 'example'},
        title=${t.title}, body=${t.body}, tags=${sql`${t.tags ?? []}::text[]`},
        is_gold=${t.isGold ?? false}, company_id=${t.companyId ?? null}, updated_at=now()
      WHERE id=${t.id}`)
    return t.id
  }
  const res = await db.execute(sql`
    INSERT INTO strategy_templates (step_key, kind, title, body, tags, is_gold, company_id, created_by)
    VALUES (${t.stepKey ?? null}, ${t.kind ?? 'example'}, ${t.title}, ${t.body},
            ${sql`${t.tags ?? []}::text[]`}, ${t.isGold ?? false}, ${t.companyId ?? null}, ${t.userId ?? null})
    RETURNING id`)
  return (res as unknown as { id: string }[])[0]?.id
}

export async function archiveTemplate(id: string) {
  await ensureFactSchema()
  await db.execute(sql`UPDATE strategy_templates SET is_active=false, updated_at=now() WHERE id=${id}`)
}

export async function noteTemplateUse(ids: string[]) {
  if (!ids.length) return
  await db.execute(sql`UPDATE strategy_templates SET usage_count = usage_count + 1 WHERE id = ANY(${ids}::uuid[])`)
}

/** Vorlagen als Few-Shot-Block für den Prompt. */
export function renderTemplates(list: StrategyTemplate[]): string {
  if (!list.length) return ''
  const parts = list.map((t, i) => {
    const marker = t.is_gold ? ' [freigegeben]' : ''
    return `### Beispiel ${i + 1}: ${t.title}${marker}\n${t.body.trim()}`
  })
  return `So sieht ein gutes Ergebnis aus. Übernimm Struktur, Dichte und Klang — nie den Inhalt.\n\n${parts.join('\n\n')}`
}
