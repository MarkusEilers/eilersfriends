/**
 * Recherche-Sammelschicht.
 *
 * Getrennt vom Urteil: hier wird nur gesucht und eingesammelt. Das Bewerten
 * macht danach ein eigener Fakten-Agent auf dem gesammelten Material.
 *
 * Zwei Wege, bewusst kombiniert:
 *   Breite   — offene Suchanfragen, damit uns nichts entgeht, was wir nicht
 *              erwartet haben.
 *   Portale  — feste, site-eingeschraenkte Anfragen auf die Quellen, die
 *              erfahrungsgemaess am meisten hergeben: Foren, Frageportale,
 *              Bewertungen der Wettbewerber.
 *
 * Jede Anfrage laeuft als eigener Aufruf. Ein Aufruf, der nichts findet, kostet
 * uns eine Zeile im Bericht — nicht das ganze Ergebnis.
 */

export interface SearchFinding {
  source: string
  query: string
  text: string
  citations: Array<{ title: string; url: string }>
  tokensIn: number
  tokensOut: number
  /**
   * Wie viele Suchanfragen dieser Lauf ausgeloest hat.
   *
   * Die Websuche wird je Anfrage bezahlt, nicht nach Tokens. Wer sie nicht
   * mitzaehlt, bekommt eine Rechnung, in der ein Teil der Kosten fehlt — und
   * weil wir mit Aufschlag weitergeben, fehlt er mehrfach.
   */
  searches: number
  error?: string
}

/**
 * Wer sucht.
 *
 * Beide Anbieter koennen Websuche serverseitig, beide liefern Belegstellen mit
 * URL zurueck. Die Wahl haengt an zwei Dingen: Claude hat im Konto deutlich
 * mehr Luft je Minute — das OpenAI-Konto liegt bei 30.000 Token und hat uns
 * mehrfach mitten im Lauf gestoppt —, und die Recherche ist der Teil, der die
 * meisten Aufrufe braucht.
 *
 * Umschaltbar bleibt es trotzdem: STRATEGY_SEARCH_PROVIDER=openai holt den
 * alten Weg zurueck, ohne dass jemand Code anfasst.
 */
type Anbieter = 'claude' | 'openai'

const PROVIDER: Anbieter =
  (process.env.STRATEGY_SEARCH_PROVIDER as Anbieter | undefined)
  ?? (process.env.ANTHROPIC_API_KEY ? 'claude' : 'openai')

const CLAUDE_MODEL = process.env.STRATEGY_SEARCH_MODEL_CLAUDE ?? 'claude-sonnet-5'
const OPENAI_MODEL = process.env.STRATEGY_SEARCH_MODEL ?? 'gpt-4.1'

/** Wie viele Suchen ein einzelner Auftrag ausloesen darf. */
const MAX_SUCHEN = Number(process.env.STRATEGY_SEARCH_MAX ?? 5)

/** Ein Suchlauf mit Websuche. Gibt Text plus die tatsaechlich benutzten Quellen zurueck. */
export async function runSearch(source: string, query: string, instruction: string): Promise<SearchFinding> {
  return PROVIDER === 'claude'
    ? sucheClaude(source, query, instruction)
    : sucheOpenAI(source, query, instruction)
}

/**
 * Claude mit serverseitiger Websuche.
 *
 * Die Belegstellen kommen an zwei Stellen zurueck: als `citations` an den
 * Textbloecken — das sind die tatsaechlich benutzten — und als Ergebnisliste
 * des Suchwerkzeugs. Wir nehmen zuerst die benutzten; nur wenn das Modell
 * keine markiert hat, fallen wir auf die Trefferliste zurueck. Sonst stuenden
 * im Bericht Quellen, die niemand gelesen hat.
 */
async function sucheClaude(source: string, query: string, instruction: string): Promise<SearchFinding> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  const empty: SearchFinding = { source, query, text: '', citations: [], tokensIn: 0, tokensOut: 0, searches: 0 }
  if (!apiKey) return { ...empty, error: 'ANTHROPIC_API_KEY nicht gesetzt' }

  let res: Response
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 4000,
        tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: MAX_SUCHEN }],
        messages: [{ role: 'user', content: `${instruction}

Suchauftrag: ${query}` }],
      }),
    })
  } catch (e) {
    return { ...empty, error: e instanceof Error ? e.message : 'network' }
  }
  if (!res.ok) return { ...empty, error: `${res.status}: ${(await res.text()).slice(0, 200)}` }

  const data = await res.json() as {
    content?: Array<{
      type?: string
      text?: string
      citations?: Array<{ type?: string; url?: string; title?: string }>
      content?: Array<{ type?: string; url?: string; title?: string }>
    }>
    usage?: {
      input_tokens?: number; output_tokens?: number
      server_tool_use?: { web_search_requests?: number }
    }
  }

  let text = ''
  const benutzt: Array<{ title: string; url: string }> = []
  const gefunden: Array<{ title: string; url: string }> = []
  const merke = (liste: Array<{ title: string; url: string }>, url?: string, title?: string) => {
    if (!url) return
    if (!liste.some((c) => c.url === url)) liste.push({ title: title ?? '', url })
  }

  for (const block of data.content ?? []) {
    if (block.type === 'text' && block.text) {
      text += block.text
      for (const z of block.citations ?? []) merke(benutzt, z.url, z.title)
    }
    if (block.type === 'web_search_tool_result') {
      for (const t of block.content ?? []) merke(gefunden, t.url, t.title)
    }
  }

  return {
    source, query, text,
    citations: benutzt.length ? benutzt : gefunden,
    tokensIn: data.usage?.input_tokens ?? 0,
    tokensOut: data.usage?.output_tokens ?? 0,
    searches: data.usage?.server_tool_use?.web_search_requests ?? 0,
  }
}

/** Der bisherige Weg ueber die Responses-API. Bleibt als Rueckfallebene. */
async function sucheOpenAI(source: string, query: string, instruction: string): Promise<SearchFinding> {
  const apiKey = process.env.OPENAI_API_KEY
  const empty: SearchFinding = { source, query, text: '', citations: [], tokensIn: 0, tokensOut: 0, searches: 0 }
  if (!apiKey) return { ...empty, error: 'OPENAI_API_KEY nicht gesetzt' }

  let res: Response
  try {
    res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        tools: [{ type: 'web_search' }],
        tool_choice: 'required',
        input: `${instruction}

Suchauftrag: ${query}`,
      }),
    })
  } catch (e) {
    return { ...empty, error: e instanceof Error ? e.message : 'network' }
  }
  if (!res.ok) return { ...empty, error: `${res.status}: ${(await res.text()).slice(0, 200)}` }

  const data = await res.json()
  let text = ''
  const citations: Array<{ title: string; url: string }> = []
  for (const out of data.output ?? []) {
    if (out.type !== 'message') continue
    for (const part of out.content ?? []) {
      if (part.text) text += part.text
      for (const a of part.annotations ?? []) {
        if (a.type === 'url_citation' && a.url) {
          const url = String(a.url).replace(/[?&]utm_source=openai/, '')
          if (!citations.some((c) => c.url === url)) citations.push({ title: a.title ?? '', url })
        }
      }
    }
  }
  return {
    source, query, text, citations,
    tokensIn: data.usage?.input_tokens ?? 0,
    tokensOut: data.usage?.output_tokens ?? 0,
    // Die Responses-API nennt die Zahl nicht. Ein Aufruf, mindestens eine Suche.
    searches: 1,
  }
}

/** Welcher Anbieter gerade sucht — fuer Berichte und Fehlersuche. */
export function sucheAnbieter(): { anbieter: Anbieter; modell: string } {
  return { anbieter: PROVIDER, modell: PROVIDER === 'claude' ? CLAUDE_MODEL : OPENAI_MODEL }
}

/**
 * Die Anweisung an jeden Suchlauf. Sie ist bei allen Quellen gleich, weil der
 * Unterschied in der Anfrage steckt, nicht in der Haltung.
 *
 * Die harte Regel steht am Anfang: lieber leer als erfunden. Ein leerer
 * Abschnitt ist ein Befund. Ein erfundenes Zitat vergiftet alles, was darauf
 * aufbaut — und faellt spaeter niemandem mehr auf.
 */
export const COLLECT_INSTRUCTION = `Du sammelst Originalmaterial. Du bewertest nicht, Du fasst nicht zusammen, Du interpretierst nicht.

Bring zurueck, was die Menschen dort selbst geschrieben haben — woertlich, ungeglaettet, mit Tippfehlern. Zu jedem Fund: die Quelle als vollstaendige URL, das Datum wenn erkennbar, und mindestens einen ganzen Satz im Originalwortlaut.

Wenn Du nichts Passendes findest, schreib genau das hin: nichts gefunden. Erfinde kein Zitat, glaette keines, und bau aus zwei halben keines zusammen. Ein leerer Fund ist ein Ergebnis.

Hoechstens acht Funde. Lieber vier echte als acht ausgedachte.`

export interface VocContext {
  industry?: string
  segmentLabels: string[]
  productTerms: string[]
  competitorNames: string[]
  locale?: string
}

/**
 * Die Kaskade. Reihenfolge ist Absicht: was oben steht, liefert erfahrungsgemaess
 * die ungeschminkteste Sprache.
 */
export function vocQueries(ctx: VocContext): Array<{ source: string; query: string }> {
  const seg = ctx.segmentLabels[0] ?? ctx.industry ?? ''
  const seg2 = ctx.segmentLabels[1] ?? seg
  const term = ctx.productTerms[0] ?? ctx.industry ?? ''
  const term2 = ctx.productTerms[1] ?? term
  const out: Array<{ source: string; query: string }> = [
    { source: 'reddit', query: `site:reddit.com ${seg} ${term} — Beitraege, in denen ueber Probleme, Enttaeuschungen oder Fragen zu ${term} gesprochen wird` },
    { source: 'foren', query: `Forum oder Fachgruppe: ${seg} diskutiert ${term} — Erfahrungsberichte und Beschwerden, keine Anbieterseiten` },
    { source: 'frageportale', query: `site:quora.com OR site:gutefrage.net ${seg} ${term} — die meistgestellten Fragen` },
    { source: 'people-also-ask', query: `Welche Fragen stellen Menschen bei Google zu "${term}" und zu "${term2}"? Nenne die tatsaechlich erscheinenden Folgefragen.` },
    { source: 'bewertungen', query: `Negative Bewertungen (1 und 2 Sterne) zu ${ctx.competitorNames.slice(0, 3).join(', ') || term} auf Trustpilot, ProvenExpert, Google oder Capterra — woran hat es gehakt?` },
    // Die Namen kommen aus compete.their_story, sobald der Wettbewerbs-Schritt gelaufen
    // ist. Vorher bleibt die Anfrage beim Produktbegriff — schwaecher, aber nicht falsch.
    { source: 'linkedin', query: `site:linkedin.com Beitraege von ${seg2} ueber ${term} mit vielen Reaktionen — was beschaeftigt sie` },
    { source: 'youtube', query: `Kommentare unter YouTube-Videos zu ${term} — was fragen und kritisieren die Zuschauer` },
    { source: 'ereignisse', query: `Was hat sich in den letzten 18 Monaten fuer ${seg} geaendert: neue Regelungen, Urteile, Preisentwicklungen, Marktaustritte, Studien — mit Datum` },
  ]
  return out
}

/** Alle Anfragen der Kaskade nacheinander. Fehler einzelner Laeufe brechen nichts ab. */
export async function collectVoc(ctx: VocContext): Promise<SearchFinding[]> {
  const findings: SearchFinding[] = []
  for (const q of vocQueries(ctx)) {
    findings.push(await runSearch(q.source, q.query, COLLECT_INSTRUCTION))
  }
  return findings
}

/** Das gesammelte Material als ein Dokument — so geht es an den Fakten-Agenten. */
export function renderFindings(findings: SearchFinding[]): string {
  return findings
    .map((f) => {
      const head = `### Quelle: ${f.source}\nAnfrage: ${f.query}`
      if (f.error) return `${head}\nFehlgeschlagen: ${f.error}`
      if (!f.text.trim()) return `${head}\nNichts gefunden.`
      const urls = f.citations.map((c) => `- ${c.title || c.url}: ${c.url}`).join('\n')
      return `${head}\n\n${f.text.trim()}\n\nBelegte Quellen:\n${urls || '- keine'}`
    })
    .join('\n\n---\n\n')
}
