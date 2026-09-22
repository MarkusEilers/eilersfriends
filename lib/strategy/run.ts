import { assemble } from './prompt'
import { putFacts, type FactInput } from './facts'
import { noteTemplateUse } from './templates'
import { callModel } from '@/lib/ai/call'
import { recordUsage } from './usage'
import { logAiRun } from '@/lib/db/queries/strategy'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

/**
 * Ein Agent-Lauf: Prompt zusammensetzen, Modell rufen (mit Web-Recherche, wenn
 * erlaubt), Ausgabe gegen das Schema prüfen, Fakten schreiben, alles protokollieren.
 *
 * Der Rückgabewert ist bewusst schmal — die Oberfläche zeigt die Vorschläge,
 * der Kunde bestätigt sie. Erst dann gelten sie als gesichert.
 */

export interface RunResult {
  ok: boolean
  output?: Record<string, unknown>
  facts?: { written: number; drafts: number }
  missing?: string[]
  runId?: string
  model?: string
  promptVersion?: number
  error?: string
}

/** Fakten aus der Modell-Ausgabe ziehen: nur Schlüssel, die der Prompt deklariert hat. */
function extractFacts(output: Record<string, unknown>, produces: string[]): FactInput[] {
  const out: FactInput[] = []
  for (const key of produces) {
    // Schlüssel 'icp.pains' → Feld 'pains' oder verschachtelt output.icp.pains
    const short = key.includes('.') ? key.split('.').slice(1).join('.') : key
    let v: unknown = output[key] ?? output[short]
    if (v === undefined && key.includes('.')) {
      const [ns, rest] = [key.split('.')[0], key.split('.').slice(1).join('.')]
      const nsObj = output[ns]
      if (nsObj && typeof nsObj === 'object') v = (nsObj as Record<string, unknown>)[rest]
    }
    if (v === undefined || v === null || v === '') continue
    // Konfidenz und Beleg optional aus einem parallelen _meta-Feld
    const meta = (output._meta as Record<string, { confidence?: number; evidence?: string }> | undefined)?.[key]
    out.push({ key, value: v, confidence: meta?.confidence, evidence: meta?.evidence ?? null, source: 'agent' })
  }
  return out
}

export async function runAgent(input: {
  agentKey: string; stepKey: string
  companyId: string; productId?: string | null
  stepId?: string | null; blockId?: string | null
  userId?: string | null; extraInstruction?: string | null
}): Promise<RunResult> {
  // Welcher Schluessel gebraucht wird, haengt am Modell und entscheidet sich
  // in lib/ai/call.ts — hier waere die Pruefung eine Annahme zu frueh.
  let asm
  try { asm = await assemble(input) } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) } }

  const started = Date.now()

  // Der Aufruf selbst liegt in lib/ai/call.ts — dort steckt auch die
  // Minutenbremse und das Wissen darueber, welcher Anbieter zu welchem
  // Modellnamen gehoert. Hier bleibt, was diese Schicht ausmacht: Protokoll,
  // Vorlagen-Zaehlung und Abrechnung.
  //
  // Recherche laeuft nicht hier. Gesucht wird in lib/strategy/research/web.ts,
  // in einem eigenen Schritt, dessen Ergebnis als Fakt gespeichert und diesem
  // Agenten als Material uebergeben wird. Sammeln und Urteilen bleiben getrennt.
  let ergebnis: Awaited<ReturnType<typeof callModel>>
  try {
    ergebnis = await callModel({
      model: asm.model,
      system: asm.system,
      user: asm.user,
      schema: Object.keys(asm.outputSchema).length ? asm.outputSchema : null,
      temperature: asm.temperature,
    })
  } catch (e) {
    const detail = e instanceof Error ? e.message : 'network'
    await logAiRun({
      companyId: input.companyId, productId: input.productId ?? null, userId: input.userId ?? null,
      purpose: 'strategy-step', agentKey: input.agentKey, model: asm.model,
      input: { system: asm.system.slice(0, 2000), user: asm.user.slice(0, 4000) },
      durationMs: Date.now() - started, ok: false, error: detail,
    }).catch(() => {})
    return { ok: false, error: detail }
  }

  const duration = Date.now() - started
  const parsed = (ergebnis.value ?? {}) as Record<string, unknown>

  const runId = await logAiRun({
    companyId: input.companyId, productId: input.productId ?? null, userId: input.userId ?? null,
    purpose: 'strategy-step', agentKey: input.agentKey, model: asm.model,
    input: { system: asm.system.slice(0, 2000), user: asm.user.slice(0, 4000), promptVersion: asm.promptVersion },
    output: parsed,
    tokensIn: ergebnis.tokensIn, tokensOut: ergebnis.tokensOut,
    durationMs: duration, ok: true,
  }).catch(() => undefined)

  await noteTemplateUse(asm.usedTemplates.map((t) => t.id)).catch(() => {})

  // Verbrauch aufs Kundenkonto buchen — Kosten aus der Preistabelle, Betrag mit Aufschlag.
  await recordUsage({
    companyId: input.companyId, productId: input.productId ?? null,
    action: `${input.stepKey} · ${input.agentKey}`, agentKey: input.agentKey, model: asm.model,
    tokensIn: ergebnis.tokensIn, tokensOut: ergebnis.tokensOut,
    aiRunId: runId ?? null,
  }).catch(() => {})

  // Nur Fakten-Prompts füttern das Datenmodell. Kritik und Voice-Check legen
  // Befunde ab, das Sounding Board speichert nichts.
  if (asm.promptKind === 'facts') {
    const facts = await putFacts({
      companyId: input.companyId, productId: input.productId ?? null,
      facts: extractFacts(parsed, asm.produces),
      source: 'agent', stepId: input.stepId ?? null, blockId: input.blockId ?? null,
      aiRunId: runId ?? null, userId: input.userId ?? null,
    })
    return { ok: true, output: parsed, facts, missing: asm.missing, runId, model: asm.model, promptVersion: asm.promptVersion }
  }

  if (asm.promptKind === 'review') {
    await db.execute(sql`
      INSERT INTO strategy_reviews (company_id, product_id, step_id, agent_key, kind, verdict, findings, reviewed_text, ai_run_id)
      VALUES (${input.companyId}, ${input.productId ?? null}, ${input.stepId ?? null}, ${input.agentKey},
              ${asm.modelRole === 'voice_check' ? 'voice_check' : 'kritik'},
              ${String((parsed.verdict as string) ?? '')},
              ${JSON.stringify(parsed.findings ?? [])}::jsonb,
              ${input.extraInstruction ?? null}, ${runId ?? null})`).catch(() => {})
  }

  return { ok: true, output: parsed, missing: asm.missing, runId, model: asm.model, promptVersion: asm.promptVersion }
}
