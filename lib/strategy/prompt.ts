import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { ensureFactSchema } from './schema'
import { factMap, listFactKeys } from './facts'
import { forStep, renderTemplates, type StrategyTemplate } from './templates'
import { resolveModel, ROLE_DEFAULT_KIND, type ModelRole, type PromptKind } from './models'
import { splitForPrompt, titleOf, visibleItems, type FactItem } from './items'

export interface PromptRow {
  id: string; agent_key: string; version: number
  system_prompt: string; user_template: string | null
  output_schema: Record<string, unknown>
  consumes: string[]; produces: string[]
  model_role: ModelRole; prompt_kind: PromptKind; model_override: string | null
  temperature: number; allow_research: boolean
  template_tags: string[]; is_active: boolean; notes: string | null
}

export async function activePrompt(agentKey: string): Promise<PromptRow | null> {
  await ensureFactSchema()
  const res = await db.execute(sql`SELECT * FROM strategy_prompts WHERE agent_key = ${agentKey} AND is_active LIMIT 1`)
  return (res as unknown as PromptRow[])[0] ?? null
}

export async function listPromptVersions(agentKey: string): Promise<PromptRow[]> {
  await ensureFactSchema()
  const res = await db.execute(sql`SELECT * FROM strategy_prompts WHERE agent_key = ${agentKey} ORDER BY version DESC`)
  return res as unknown as PromptRow[]
}

/**
 * Neue Prompt-Version anlegen und aktiv schalten. Alte Versionen bleiben
 * erhalten — in ai_runs steht, welche Version welches Ergebnis erzeugt hat.
 */
export async function publishPrompt(p: {
  agentKey: string; systemPrompt: string; userTemplate?: string | null
  outputSchema?: unknown; consumes?: string[]; produces?: string[]
  modelRole?: ModelRole; promptKind?: PromptKind; modelOverride?: string | null; temperature?: number
  allowResearch?: boolean; templateTags?: string[]; notes?: string | null; userId?: string | null
}) {
  await ensureFactSchema()
  const cur = await db.execute(sql`SELECT COALESCE(MAX(version),0) AS v FROM strategy_prompts WHERE agent_key = ${p.agentKey}`)
  const next = ((cur as unknown as { v: number }[])[0]?.v ?? 0) + 1
  await db.execute(sql`UPDATE strategy_prompts SET is_active=false, updated_at=now() WHERE agent_key=${p.agentKey} AND is_active`)
  const res = await db.execute(sql`
    INSERT INTO strategy_prompts (agent_key, version, system_prompt, user_template, output_schema,
      consumes, produces, model_role, prompt_kind, model_override, temperature, allow_research, template_tags, is_active, notes, created_by)
    VALUES (${p.agentKey}, ${next}, ${p.systemPrompt}, ${p.userTemplate ?? null},
            ${JSON.stringify(p.outputSchema ?? {})}::jsonb,
            ${sql`${p.consumes ?? []}::text[]`}, ${sql`${p.produces ?? []}::text[]`},
            ${p.modelRole ?? 'strategie'}, ${p.promptKind ?? ROLE_DEFAULT_KIND[p.modelRole ?? 'strategie']},
            ${p.modelOverride ?? null}, ${p.temperature ?? 0.7},
            ${p.allowResearch ?? false}, ${sql`${p.templateTags ?? []}::text[]`}, true, ${p.notes ?? null}, ${p.userId ?? null})
    RETURNING id, version`)
  return (res as unknown as { id: string; version: number }[])[0]
}

/** {{fact:icp.pains}} durch den echten Wert ersetzen. */
export function renderTemplateString(str: string, facts: Record<string, unknown>): string {
  return str.replace(/\{\{fact:([a-z0-9_.]+)\}\}/gi, (_m, key: string) => {
    const v = facts[key]
    if (v === undefined || v === null) return '(noch nicht erarbeitet)'
    return typeof v === 'string' ? v : JSON.stringify(v, null, 2)
  })
}

/** Verworfene Einträge gehören nicht in den Brief — nur in die Negativliste. */
function renderValue(v: unknown): string {
  if (typeof v === 'string') return v
  if (Array.isArray(v)) return JSON.stringify(visibleItems(v), null, 2)
  return JSON.stringify(v, null, 2)
}

/** Die Fakten als lesbarer Brief — das, was wir über diesen Kunden wissen. */
export function renderFactBrief(facts: Record<string, unknown>, labels: Record<string, string>): string {
  const keys = Object.keys(facts)
  if (!keys.length) return 'Zu diesem Kunden liegen noch keine gesicherten Angaben vor.'
  const lines = keys.map((k) => `**${labels[k] ?? k}** (${k})\n${renderValue(facts[k])}`)
  return lines.join('\n\n')
}

function bullets(items: FactItem[]): string {
  return items.map((i) => `- ${titleOf(i)}`).join('\n')
}

/**
 * Was zu den Schlüsseln, die dieser Agent schreibt, bereits entschieden ist.
 *
 * Ohne diesen Block fängt jeder Lauf bei null an: er formuliert Bestätigtes neu
 * und schlägt Verworfenes wieder vor. Beides lässt das System dumm wirken.
 */
export function renderDecided(facts: Record<string, unknown>, labels: Record<string, string>): string {
  const parts: string[] = []
  for (const [key, value] of Object.entries(facts)) {
    if (!Array.isArray(value)) continue
    const { settled, rejected } = splitForPrompt(value)
    if (!settled.length && !rejected.length) continue
    const label = labels[key] ?? key
    const block: string[] = [`### ${label} (${key})`]
    if (settled.length) {
      block.push(
        'Diese Punkte stehen — vom Kunden gesetzt oder bestätigt. Wiederhole sie nicht und formuliere sie nicht um. Ergänze, was daneben fehlt. Wenn Du einen davon für falsch hältst, sag es einmal und begründe es.',
        bullets(settled),
      )
    }
    if (rejected.length) {
      block.push(
        'Diese Punkte hat der Kunde verworfen. Schlage sie nicht erneut vor — auch nicht anders formuliert.',
        bullets(rejected),
      )
    }
    parts.push(block.join('\n'))
  }
  return parts.join('\n\n')
}

export interface AssembledPrompt {
  system: string
  user: string
  model: string
  temperature: number
  outputSchema: Record<string, unknown>
  produces: string[]
  allowResearch: boolean
  promptId: string
  promptVersion: number
  modelRole: ModelRole
  promptKind: PromptKind
  usedTemplates: StrategyTemplate[]
  missing: string[]
}

/**
 * Setzt den vollständigen Prompt zusammen:
 * System-Prompt · Mandanten-Brief aus den Fakten · Vorlagen · Auftrag · Schema.
 */
export async function assemble(input: {
  agentKey: string; stepKey: string; companyId: string; productId?: string | null
  extraInstruction?: string | null
}): Promise<AssembledPrompt> {
  const p = await activePrompt(input.agentKey)
  if (!p) throw new Error(`Kein aktiver Prompt für ${input.agentKey}`)

  const facts = await factMap(input.companyId, input.productId, p.consumes?.length ? p.consumes : undefined)
  const missing = (p.consumes ?? []).filter((k) => facts[k] === undefined)

  const keyRows = await listFactKeys()
  const labels: Record<string, string> = {}
  for (const k of keyRows) labels[k.key] = k.label

  const templates = await forStep(input.stepKey, { tags: p.template_tags, companyId: input.companyId })
  const templateBlock = renderTemplates(templates)

  // Auch die Schlüssel laden, die dieser Agent schreibt — für den Entschieden-Block.
  const produced = await factMap(input.companyId, input.productId, p.produces?.length ? p.produces : undefined)
  const decided = renderDecided(produced, labels)

  const brief = renderFactBrief(facts, labels)
  const task = p.user_template ? renderTemplateString(p.user_template, facts) : 'Erarbeite das Ergebnis für diesen Schritt.'

  const kind: PromptKind = p.prompt_kind ?? ROLE_DEFAULT_KIND[p.model_role]
  const RULES: Record<PromptKind, string[]> = {
    facts: [
      '- Antworte ausschließlich im vorgegebenen JSON-Schema. Kein Fließtext davor oder danach.',
      '- Jede Aussage ist konkret und auf diesen Kunden bezogen. Keine Allgemeinplätze.',
      '- Wo Du etwas annimmst statt weißt, kennzeichne es im Feld evidence als Annahme.',
      '- Schreibe auf Deutsch, in der Sprache des Kunden, nicht in Beratersprache.',
    ],
    review: [
      '- Antworte ausschließlich im vorgegebenen JSON-Schema.',
      '- Jeder Befund nennt die Fundstelle und sagt, was konkret nicht hält.',
      '- Kein Lob ohne Befund. Wenn etwas gut ist, sag warum es trägt.',
      '- Urteile über den Text, nie über die Person.',
    ],
    dialog: [
      '- Du lieferst keine fertigen Antworten. Du stellst die Fragen, die weiterbringen.',
      '- Höchstens fünf Fragen. Jede zielt auf eine Lücke, die Du im Material siehst.',
      '- Benenne zu jeder Frage kurz, warum sie jetzt zählt.',
      '- Antworte im vorgegebenen JSON-Schema.',
    ],
  }
  const system = [
    p.system_prompt.trim(),
    '',
    'Regeln für die Ausgabe:',
    ...RULES[kind],
  ].join('\n')

  const user = [
    '## Was wir über diesen Kunden wissen',
    brief,
    missing.length ? `\n## Noch offen\nZu diesen Punkten liegt nichts vor: ${missing.join(', ')}. Arbeite ohne sie und kennzeichne, wo sie fehlen.` : '',
    decided ? `\n## Dazu ist schon entschieden\n${decided}` : '',
    templateBlock ? `\n## Orientierung\n${templateBlock}` : '',
    `\n## Auftrag\n${task}`,
    input.extraInstruction ? `\n## Zusätzlich\n${input.extraInstruction}` : '',
  ].filter(Boolean).join('\n\n')

  return {
    system, user,
    model: resolveModel(p.model_role, p.model_override),
    temperature: Number(p.temperature ?? 0.7),
    outputSchema: p.output_schema ?? {},
    produces: p.produces ?? [],
    allowResearch: p.allow_research,
    promptId: p.id, promptVersion: p.version, modelRole: p.model_role,
    promptKind: p.prompt_kind ?? ROLE_DEFAULT_KIND[p.model_role],
    usedTemplates: templates, missing,
  }
}
