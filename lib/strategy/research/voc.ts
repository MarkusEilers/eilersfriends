/**
 * Recherche-Schritt vor dem ICP.
 *
 * Zwei Haelften, bewusst getrennt:
 *   1. Sammeln  — Suchanfragen laufen, Originalmaterial wird als Fakt
 *                 `research.voc_raw` abgelegt. Nachvollziehbar, wiederverwendbar,
 *                 und beim naechsten Lauf sieht man, was sich geaendert hat.
 *   2. Urteilen — ein Fakten-Agent liest nur dieses Material und zieht daraus
 *                 Stimmen, Ereignisse, Waehrungen und die Awareness-Verteilung.
 *
 * Erst danach laufen Pains, Gains und Trigger. Eine Produktseite darf mitlaufen,
 * sie ist aber nie die einzige Quelle.
 */

import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { factMap, putFacts } from '../facts'
import { runAgent, type RunResult } from '../run'
import { recordUsage } from '../usage'
import { collectVoc, renderFindings, type SearchFinding, type VocContext } from './web'

/** Was die Anfragen brauchen: Branche, Segmente, Produktbegriffe, Wettbewerber. */
async function buildContext(companyId: string, productId?: string | null): Promise<VocContext> {
  const facts = await factMap(companyId, productId, [
    'company.industry', 'product.description', 'icp.segments', 'compete.their_story',
  ])
  const segments = Array.isArray(facts['icp.segments'])
    ? (facts['icp.segments'] as Array<Record<string, unknown>>)
        .map((s) => String(s.name ?? s.label ?? s.topic ?? '')).filter(Boolean)
    : []
  const competitors = Array.isArray(facts['compete.their_story'])
    ? (facts['compete.their_story'] as Array<Record<string, unknown> | string>)
        .map((c) => (typeof c === 'string' ? c : String(c.name ?? ''))).filter(Boolean)
    : []

  const productRow = productId
    ? ((await db.execute(sql`SELECT name FROM strategy_products WHERE id = ${productId}`)) as unknown as { name: string }[])[0]
    : undefined

  const terms = [productRow?.name, String(facts['company.industry'] ?? '')].filter(Boolean) as string[]
  return {
    industry: facts['company.industry'] ? String(facts['company.industry']) : undefined,
    segmentLabels: segments,
    productTerms: terms,
    competitorNames: competitors,
  }
}

export interface VocResult {
  findings: SearchFinding[]
  empty: string[]
  failed: string[]
  agents?: Record<string, RunResult>
}

/** Sammeln, ablegen, auswerten. */
export async function researchVoc(input: {
  companyId: string; productId?: string | null; stepKey?: string; userId?: string | null
}): Promise<VocResult> {
  const ctx = await buildContext(input.companyId, input.productId)
  const findings = await collectVoc(ctx)

  const tokensIn = findings.reduce((s, f) => s + f.tokensIn, 0)
  const tokensOut = findings.reduce((s, f) => s + f.tokensOut, 0)
  await recordUsage({
    companyId: input.companyId, productId: input.productId ?? null,
    action: 'recherche · stimmen sammeln', agentKey: 'research-voc-collect',
    model: process.env.STRATEGY_SEARCH_MODEL ?? 'gpt-4.1',
    tokensIn, tokensOut, aiRunId: null,
  }).catch(() => {})

  // Zweimal ablegen, mit Absicht:
  //   voc_raw       — die Fundstellen als Struktur, fuer Nachweis und Vergleich
  //                   mit dem naechsten Lauf
  //   voc_material  — dasselbe als lesbarer Text, denn genau das geht in den Prompt
  const evidence = `${findings.length} Anfragen, ${findings.reduce((s, f) => s + f.citations.length, 0)} belegte Quellen`
  await putFacts({
    companyId: input.companyId, productId: null,
    facts: [
      { key: 'research.voc_raw', value: { collected_at: new Date().toISOString(), findings }, evidence, confidence: 1 },
      { key: 'research.voc_material', value: renderFindings(findings), evidence, confidence: 1 },
    ],
    source: 'research', userId: input.userId ?? null,
  })

  // Drei schmale Agenten statt eines breiten. Der breite lief nicht in einem Zug
  // durch und lieferte ueberall mittlere Tiefe — dieselbe Beobachtung wie bei der
  // ICP-Kette: ein Agent, ein Fakt-Buendel.
  const agents: Record<string, RunResult> = {}
  for (const agentKey of ['research-voc-quotes', 'research-voc-events', 'research-voc-currencies']) {
    agents[agentKey] = await runAgent({
      agentKey, stepKey: input.stepKey ?? 'research',
      companyId: input.companyId, productId: input.productId ?? null, userId: input.userId ?? null,
    })
  }

  return {
    findings,
    empty: findings.filter((f) => !f.error && !f.text.trim()).map((f) => f.source),
    failed: findings.filter((f) => f.error).map((f) => f.source),
    agents,
  }
}

export { renderFindings }
