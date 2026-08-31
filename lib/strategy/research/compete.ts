/**
 * Recherche-Zufuhr fuer den Wettbewerbs-Schritt.
 *
 * Hier gilt die Umkehrung der Regel aus der Stimmen-Recherche: dort war die
 * Werbung des Anbieters kein Beleg, weil wir wissen wollten, was Kunden
 * empfinden. Hier ist die Werbung genau der Gegenstand — wir wollen wissen, was
 * die anderen behaupten, nicht was ihre Kunden fuehlen. Also woertliche Saetze
 * von ihren Seiten, nicht unsere Zusammenfassung davon.
 *
 * Dazu eine zweite Frage, die haeufig vergessen wird: Was tut die Zielgruppe
 * heute stattdessen? Der haerteste Wettbewerber ist meistens kein Anbieter,
 * sondern das Weitermachen wie bisher.
 */

import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { factMap, putFacts } from '../facts'
import { runAgent, type RunResult } from '../run'
import { recordUsage } from '../usage'
import { runSearch, renderFindings, type SearchFinding } from './web'

const COMPETE_INSTRUCTION = `Du sammelst Originalmaterial ueber Anbieter. Du bewertest nicht.

Bring woertliche Saetze zurueck: die Ueberschrift der Startseite, die Versprechen, die Preise wenn sie oeffentlich stehen, die Garantie wenn es eine gibt, den Text auf dem Knopf. Wortlaut, nicht Sinngemaesses — der Unterschied zwischen "Wir machen Ernaehrung messbar" und "wissenschaftlich fundierte Ernaehrungsberatung" ist die ganze Positionierung.

Zu jedem Fund die URL. Findest Du zu einem Anbieter nichts, schreib das hin. Erfinde keine Claims.

Hoechstens acht Funde je Anbieter.`

const ALTERNATIVE_INSTRUCTION = `Du suchst nicht nach Anbietern, sondern nach Verhalten: Was tun diese Menschen heute, um sich zu behelfen?

Dazu gehoert ausdruecklich das Naheliegende — es weiter aushalten, eine Tabelle fuehren, den Hausarzt fragen, im Forum nachfragen, gar nichts tun. Nicht nur Produkte.

Woertliche Zitate mit URL. Wo Du nichts findest, sag es.`

/** Ist das die eigene Firma? Name oder Domain, gross- und kleinschreibungsblind. */
function isOwn(name: string, own: string[]): boolean {
  const n = name.toLowerCase().replace(/[^a-z0-9]/g, '')
  return own.some((o) => o && (n.includes(o) || o.includes(n)))
}

/** Namen, mit denen man suchen kann — keine Kategorien, keine Werbezeilen. */
function usableNames(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return (value as Array<Record<string, unknown> | string>)
    .map((c) => (typeof c === 'string' ? c : String(c.name ?? '')))
    .map((n) => n.trim())
    .filter((n) => n.length > 1 && n.length < 60 && !/\(unspezifisch\)|markt voller|^markt\b/i.test(n))
    .slice(0, 5)
}

/** Aus dem Suchtext die Firmennamen ziehen. Ein billiger Aufruf, kein Urteil. */
async function extractNames(text: string): Promise<string[]> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || !text.trim()) return []
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: 'Gib die genannten Firmennamen als JSON zurueck: {"names": ["..."]}. Nur echte Anbieternamen, keine Kategorien, keine Beschreibungen. Hoechstens fuenf.' },
        { role: 'user', content: text.slice(0, 6000) },
      ],
      temperature: 0,
      response_format: { type: 'json_object' },
    }),
  }).catch(() => null)
  if (!res || !res.ok) return []
  const data = await res.json()
  try {
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? '{}')
    return Array.isArray(parsed.names) ? parsed.names.map(String).slice(0, 5) : []
  } catch { return [] }
}

export interface CompeteResult {
  findings: SearchFinding[]
  agents?: Record<string, RunResult>
}

export async function researchCompete(input: {
  companyId: string; productId?: string | null; stepKey?: string; userId?: string | null
}): Promise<CompeteResult> {
  const facts = await factMap(input.companyId, input.productId, [
    'company.industry', 'icp.segments', 'compete.their_story',
  ])
  let competitors = usableNames(facts['compete.their_story'])
  const segment = Array.isArray(facts['icp.segments'])
    ? String((facts['icp.segments'] as Array<Record<string, unknown>>)[0]?.name ?? '')
    : ''
  const industry = String(facts['company.industry'] ?? '')

  const productRow = input.productId
    ? ((await db.execute(sql`SELECT name FROM strategy_products WHERE id = ${input.productId}`)) as unknown as { name: string }[])[0]
    : undefined
  const term = productRow?.name || industry

  const companyRow = ((await db.execute(
    sql`SELECT name, website, domain FROM companies WHERE id = ${input.companyId}`,
  )) as unknown as { name?: string; website?: string; domain?: string }[])[0]
  const own = [companyRow?.name, companyRow?.website, companyRow?.domain]
    .filter(Boolean)
    .map((s) => String(s).toLowerCase().replace(/^https?:\/\//, '').replace(/[^a-z0-9]/g, ''))
    .filter((s) => s.length > 2)

  const findings: SearchFinding[] = []

  // Wenn oben nichts Brauchbares steht, suchen wir die Anbieter selbst. Bei
  // NovoDaily stand in research.competitors die eigene Werbezeile — ein Fehler
  // aus einem frueheren Schritt, der bis hierher niemandem auffiel, weil ihn
  // vorher nichts gelesen hat.
  if (!competitors.length) {
    const discovery = await runSearch(
      'anbieter-suche',
      `Welche Anbieter konkurrieren im deutschsprachigen Raum um ${segment || industry} mit einem Angebot wie ${term}? Nenne Firmennamen und Website.`,
      COMPETE_INSTRUCTION,
    )
    findings.push(discovery)
    competitors = await extractNames(discovery.text)
    // Die Suche liefert die eigene Firma mit — sie steht ja im selben Markt.
    // Ein Anbieter, der sich selbst analysiert, findet ueberall Uebereinstimmung.
    competitors = competitors.filter((n) => !isOwn(n, own))
  }

  for (const name of competitors) {
    findings.push(await runSearch(
      `anbieter:${name}`,
      `${name} — Startseite, Angebotsseite und Preise. Woertliche Ueberschrift, Versprechen, Preise, Garantie, Text auf dem Hauptknopf.`,
      COMPETE_INSTRUCTION,
    ))
  }
  findings.push(await runSearch(
    'alternativen',
    `Womit behelfen sich ${segment || industry} heute statt ${term}? Auch das Nichtstun, Eigenbau, Tabellen, Hausarzt, Forenfragen.`,
    ALTERNATIVE_INSTRUCTION,
  ))

  const tokensIn = findings.reduce((s, f) => s + f.tokensIn, 0)
  const tokensOut = findings.reduce((s, f) => s + f.tokensOut, 0)
  await recordUsage({
    companyId: input.companyId, productId: input.productId ?? null,
    action: 'recherche · wettbewerb sammeln', agentKey: 'research-compete-collect',
    model: process.env.STRATEGY_SEARCH_MODEL ?? 'gpt-4.1',
    tokensIn, tokensOut, aiRunId: null,
  }).catch(() => {})

  const evidence = `${findings.length} Anfragen, ${findings.reduce((s, f) => s + f.citations.length, 0)} belegte Quellen`
  await putFacts({
    companyId: input.companyId, productId: null,
    facts: [
      { key: 'research.compete_raw', value: { collected_at: new Date().toISOString(), findings }, evidence, confidence: 1 },
      { key: 'research.compete_material', value: renderFindings(findings), evidence, confidence: 1 },
    ],
    source: 'research', userId: input.userId ?? null,
  })

  const agents: Record<string, RunResult> = {}
  for (const agentKey of ['compete-story', 'compete-alternatives', 'compete-gap']) {
    agents[agentKey] = await runAgent({
      agentKey, stepKey: input.stepKey ?? 'compete',
      companyId: input.companyId, productId: input.productId ?? null, userId: input.userId ?? null,
    })
  }
  return { findings, agents }
}
