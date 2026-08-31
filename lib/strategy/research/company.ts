/**
 * Recherche-Zufuhr fuer den ersten Schritt: das Unternehmen selbst.
 *
 * Frueher hat dieser Schritt auch die Wettbewerber liefern sollen. Das konnte
 * nicht funktionieren: das Material war die eigene Website, und auf der eigenen
 * Website steht kein Wettbewerber. Herausgekommen ist bei NovoDaily die eigene
 * Werbezeile, als Wettbewerber gefuehrt — tagelang unbemerkt, weil sie niemand
 * gelesen hat. Die Wettbewerber holt jetzt der Wettbewerbs-Schritt, der dafuer
 * eigens sucht.
 *
 * Hier bleibt: wie stellt sich dieses Unternehmen selbst dar, und was verraet
 * das ueber Reifegrad, Groesse, Geschaeftsmodell und Vertriebsweg.
 */

import { factMap, putFacts } from '../facts'
import { runAgent, type RunResult } from '../run'
import { recordUsage } from '../usage'
import { runSearch, renderFindings, type SearchFinding } from './web'

const SELF_INSTRUCTION = `Du sammelst, wie sich ein Unternehmen selbst darstellt.

Woertlich: die Ueberschrift der Startseite, die Versprechen, die Zielgruppen-Ansprache, Zahlen und Belege, die es nennt, Kundenstimmen, den Text auf den Knoepfen, die Preise wenn sie stehen. Wortlaut, nicht Sinngemaesses.

Auch das Drumherum zaehlt: Ueber-uns, Karriereseiten, Presse, Impressum. Eine Stellenanzeige verraet mehr ueber Reifegrad als jede Startseite.

Zu jedem Fund die URL. Was Du nicht findest, schreibst Du als nicht gefunden hin.`

export async function researchCompany(input: {
  companyId: string; productId?: string | null; stepKey?: string; userId?: string | null
}): Promise<{ findings: SearchFinding[]; agent?: RunResult }> {
  const facts = await factMap(input.companyId, null, ['company.website_url', 'company.industry'])
  const url = String(facts['company.website_url'] ?? '').replace(/^https?:\/\//, '').replace(/\/$/, '')
  const industry = String(facts['company.industry'] ?? '')
  if (!url) throw new Error('company.website_url fehlt — ohne Adresse keine Recherche')

  const findings: SearchFinding[] = []
  findings.push(await runSearch('startseite', `site:${url} Startseite und Angebotsseiten — Ueberschrift, Versprechen, Preise, Text auf den Knoepfen.`, SELF_INSTRUCTION))
  findings.push(await runSearch('ueber-uns', `site:${url} Ueber uns, Team, Presse, Impressum — Groesse, Geschichte, Rechtsform, Standorte.`, SELF_INSTRUCTION))
  findings.push(await runSearch('aussensicht', `Was steht ausserhalb der eigenen Website ueber ${url} (${industry})? Presse, Verzeichnisse, Stellenanzeigen, Partnerseiten.`, SELF_INSTRUCTION))

  await recordUsage({
    companyId: input.companyId, productId: null,
    action: 'recherche · unternehmen sammeln', agentKey: 'research-company-collect',
    model: process.env.STRATEGY_SEARCH_MODEL ?? 'gpt-4.1',
    tokensIn: findings.reduce((s, f) => s + f.tokensIn, 0),
    tokensOut: findings.reduce((s, f) => s + f.tokensOut, 0),
    aiRunId: null,
  }).catch(() => {})

  await putFacts({
    companyId: input.companyId, productId: null,
    facts: [{
      key: 'research.company_material', value: renderFindings(findings),
      evidence: `${findings.length} Anfragen, ${findings.reduce((s, f) => s + f.citations.length, 0)} belegte Quellen`,
      confidence: 1,
    }],
    source: 'research', userId: input.userId ?? null,
  })

  const agent = await runAgent({
    agentKey: 'research-company', stepKey: input.stepKey ?? 'foundation',
    companyId: input.companyId, productId: input.productId ?? null, userId: input.userId ?? null,
  })
  return { findings, agent }
}
