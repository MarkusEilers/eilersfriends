'use server'

import { revalidatePath } from 'next/cache'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { currentContext } from '@/lib/actions/strategy'
import { runAgent } from '@/lib/strategy/run'
import { confirmFact, rejectFact } from '@/lib/strategy/facts'
import { ensureLineageSchema } from '@/lib/strategy/lineage'
import { researchCompany } from '@/lib/strategy/research/company'
import { researchCompete } from '@/lib/strategy/research/compete'
import { researchVoc } from '@/lib/strategy/research/voc'

/**
 * Input · Work · Output im Schritt — und die Agenten, die Outputs erzeugen.
 *
 * Was ein Schritt liest und schreibt, steht im Katalog:
 *  - Outputs:  strategy_fact_keys mit step_key = dieser Schritt
 *  - Agenten:  aktive Fakten-Prompts, deren produces einen dieser Schlüssel enthält
 *  - Inputs:   was diese Agenten lesen (consumes), ohne die eigenen Outputs
 */

const pgArr = (xs: string[]) => '{' + xs.map((x) => '"' + x.replace(/["\\]/g, '') + '"').join(',') + '}'

/** Recherche-Stufen, die zu einem Schritt gehören (sammeln, dann auswerten). */
const RESEARCH: Record<string, { label: string; run: (i: { companyId: string; productId?: string | null; stepKey?: string; userId?: string | null }) => Promise<unknown> }> = {
  'foundation': { label: 'Website und Marktsignale recherchieren', run: researchCompany },
  'icp': { label: 'Stimmen der Zielgruppe recherchieren', run: researchVoc },
  'compete': { label: 'Wettbewerb recherchieren', run: researchCompete },
}

export interface IOFact {
  key: string; label: string; stepKey: string | null; stepTitle: string | null
  factId: string | null; version: number | null; value: unknown; source: string | null; status: string | null
  updatedAt: string | null; staleSince: string | null; staleReason: string | null; producedBy: string | null
}
export interface IOAgent { key: string; label: string; produces: string[]; consumes: string[]; missing: string[]; stale: boolean }
export interface StepIO {
  inputs: IOFact[]; outputs: IOFact[]; agents: IOAgent[]
  research: { label: string } | null
  canRun: boolean; staleCount: number
}

async function mayRun(ctx: Awaited<ReturnType<typeof currentContext>>) {
  if (ctx.isCoach) return true
  if (!ctx.companyId) return false
  const r = (await db.execute(sql`SELECT 1 FROM org_memberships WHERE user_id=${ctx.userId} AND company_id=${ctx.companyId} AND org_role IN ('owner','admin','lead') LIMIT 1`).catch(() => [])) as unknown as unknown[]
  return r.length > 0
}

async function factsFor(companyId: string, productId: string | null, keys: string[]): Promise<Map<string, Record<string, unknown>>> {
  if (!keys.length) return new Map()
  const rows = (await db.execute(sql`
    SELECT DISTINCT ON (key) id, key, version, value, source, status, updated_at::text AS updated_at,
           stale_since::text AS stale_since, stale_reason
    FROM strategy_facts
    WHERE company_id=${companyId} AND is_current AND status <> 'rejected' AND key = ANY(${pgArr(keys)}::text[])
      AND (product_id IS NOT DISTINCT FROM ${productId}::uuid OR product_id IS NULL)
    ORDER BY key, (product_id IS NULL), version DESC`)) as unknown as Record<string, unknown>[]
  return new Map(rows.map((r) => [String(r.key), r]))
}

export async function getStepIOAction(stepKey: string, productId?: string | null): Promise<StepIO> {
  const ctx = await currentContext()
  await ensureLineageSchema()
  const empty: StepIO = { inputs: [], outputs: [], agents: [], research: null, canRun: false, staleCount: 0 }
  if (!ctx.companyId) return empty
  const pid = productId ?? null

  const outKeys = (await db.execute(sql`
    SELECT k.key, k.label, k.produced_by FROM strategy_fact_keys k
    WHERE k.is_active AND k.step_key=${stepKey} ORDER BY k.sort_order, k.key`)) as unknown as { key: string; label: string; produced_by: string | null }[]
  const outSet = new Set(outKeys.map((k) => k.key))
  const prompts = (await db.execute(sql`
    SELECT DISTINCT ON (agent_key) agent_key, consumes, produces, notes FROM strategy_prompts
    WHERE is_active AND prompt_kind='facts' AND produces && ${pgArr([...outSet])}::text[]
    ORDER BY agent_key, version DESC`)) as unknown as { agent_key: string; consumes: string[]; produces: string[]; notes: string | null }[]

  const inKeys = [...new Set(prompts.flatMap((p) => p.consumes ?? []).filter((k) => !outSet.has(k)))]
  const inMeta = inKeys.length ? ((await db.execute(sql`
    SELECT k.key, k.label, k.step_key, s.title AS step_title FROM strategy_fact_keys k LEFT JOIN strategy_steps s ON s.key=k.step_key
    WHERE k.key = ANY(${pgArr(inKeys)}::text[])`)) as unknown as { key: string; label: string; step_key: string | null; step_title: string | null }[]) : []

  const facts = await factsFor(ctx.companyId, pid, [...inKeys, ...outSet])
  const toIO = (key: string, label: string, stepKey2: string | null, stepTitle: string | null, producedBy: string | null): IOFact => {
    const f = facts.get(key)
    return {
      key, label, stepKey: stepKey2, stepTitle, producedBy,
      factId: (f?.id as string) ?? null, version: (f?.version as number) ?? null, value: f?.value ?? null,
      source: (f?.source as string) ?? null, status: (f?.status as string) ?? null, updatedAt: (f?.updated_at as string) ?? null,
      staleSince: (f?.stale_since as string) ?? null, staleReason: (f?.stale_reason as string) ?? null,
    }
  }
  const inputs = inKeys.map((k) => { const m = inMeta.find((x) => x.key === k); return toIO(k, m?.label ?? k, m?.step_key ?? null, m?.step_title ?? null, null) })
    .sort((a, b) => (a.stepTitle ?? '').localeCompare(b.stepTitle ?? '') || a.label.localeCompare(b.label))
  const outputs = outKeys.map((k) => toIO(k.key, k.label, stepKey, null, k.produced_by))

  // Reihenfolge: wer liest, was ein anderer Agent dieses Schritts schreibt, läuft später
  const ordered = [...prompts].sort((a, b) => {
    const aNeedsB = (a.consumes ?? []).some((k) => (b.produces ?? []).includes(k))
    const bNeedsA = (b.consumes ?? []).some((k) => (a.produces ?? []).includes(k))
    return aNeedsB && !bNeedsA ? 1 : bNeedsA && !aNeedsB ? -1 : a.agent_key.localeCompare(b.agent_key)
  })
  const labelOf = (key: string) => outKeys.find((k) => k.key === key)?.label ?? key
  const agents: IOAgent[] = ordered.map((p) => ({
    key: p.agent_key,
    label: (p.produces ?? []).filter((k) => outSet.has(k)).map(labelOf).join(' · ') || p.agent_key,
    produces: p.produces ?? [], consumes: p.consumes ?? [],
    missing: (p.consumes ?? []).filter((k) => !facts.get(k)),
    stale: (p.produces ?? []).some((k) => !!facts.get(k)?.stale_since),
  }))

  return {
    inputs, outputs, agents,
    research: RESEARCH[stepKey] ? { label: RESEARCH[stepKey].label } : null,
    canRun: await mayRun(ctx),
    staleCount: outputs.filter((o) => o.staleSince).length,
  }
}

function paths(stepKey: string) {
  revalidatePath(`/dashboard/strategie/${stepKey}`)
  revalidatePath('/dashboard/strategie')
}

/** Einen Agenten für diesen Schritt laufen lassen — erzeugt neue Output-Versionen mit Herkunft. */
export async function runStepAgentAction(stepKey: string, productId: string | null, agentKey: string) {
  const ctx = await currentContext()
  if (!ctx.companyId) return { ok: false, error: 'Keine Organisation gewählt' }
  if (!(await mayRun(ctx))) return { ok: false, error: 'Nur Eilers+Friends, Admins und Leads können Agenten starten.' }
  const [st] = (await db.execute(sql`SELECT id FROM strategy_steps WHERE key=${stepKey}`)) as unknown as { id: string }[]
  const r = await runAgent({ agentKey, stepKey, companyId: ctx.companyId, productId: productId ?? null, stepId: st?.id ?? null, userId: ctx.userId })
  paths(stepKey)
  return r.ok ? { ok: true, missing: r.missing ?? [] } : { ok: false, error: r.error ?? 'Lauf fehlgeschlagen' }
}

/** Recherche-Stufe des Schritts (sammeln + auswerten). */
export async function runStepResearchAction(stepKey: string, productId: string | null) {
  const ctx = await currentContext()
  if (!ctx.companyId) return { ok: false, error: 'Keine Organisation gewählt' }
  if (!(await mayRun(ctx))) return { ok: false, error: 'Nur Eilers+Friends, Admins und Leads können die Recherche starten.' }
  const r = RESEARCH[stepKey]
  if (!r) return { ok: false, error: 'Für diesen Schritt gibt es keine Recherche.' }
  try {
    await r.run({ companyId: ctx.companyId, productId: productId ?? null, stepKey, userId: ctx.userId })
    paths(stepKey)
    return { ok: true }
  } catch (e) { return { ok: false, error: (e as Error).message } }
}

export async function confirmOutputAction(stepKey: string, factId: string) {
  const ctx = await currentContext()
  if (!ctx.companyId) return { ok: false }
  const [f] = (await db.execute(sql`SELECT 1 FROM strategy_facts WHERE id=${factId} AND company_id=${ctx.companyId}`)) as unknown as unknown[]
  if (!f) return { ok: false }
  await confirmFact(factId, ctx.userId)
  paths(stepKey)
  return { ok: true }
}

export async function rejectOutputAction(stepKey: string, factId: string) {
  const ctx = await currentContext()
  if (!ctx.companyId) return { ok: false }
  const [f] = (await db.execute(sql`SELECT 1 FROM strategy_facts WHERE id=${factId} AND company_id=${ctx.companyId}`)) as unknown as unknown[]
  if (!f) return { ok: false }
  await rejectFact(factId)
  paths(stepKey)
  return { ok: true }
}

/** Überholt-Markierung bewusst aufheben („passt trotzdem") — ohne Neulauf. */
export async function keepOutputAction(stepKey: string, factId: string) {
  const ctx = await currentContext()
  if (!ctx.companyId) return { ok: false }
  await db.execute(sql`UPDATE strategy_facts SET stale_since=NULL, stale_reason=NULL, stale_cause=NULL, updated_at=now() WHERE id=${factId} AND company_id=${ctx.companyId}`)
  paths(stepKey)
  return { ok: true }
}
