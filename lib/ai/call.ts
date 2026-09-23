import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

/**
 * Ein Modellaufruf — die einzige Stelle, die weiss, welche Anbieter es gibt.
 *
 * Vorher hatten der Agenten-Kern und die Strategie-Schicht je einen eigenen
 * Aufruf. Solange beide nur OpenAI kannten, fiel das nicht auf; sobald eine
 * Rolle auf Claude zeigt, schickt die andere Stelle den Namen an den falschen
 * Anbieter und bekommt einen Fehler, den niemand mit dem Modellwechsel in
 * Verbindung bringt.
 *
 * Deshalb hier: Der Anbieter steckt im Namen. Was mit „claude" anfaengt, geht
 * zu Anthropic, alles andere zu OpenAI. Ein Wechsel ist eine Zeile in der
 * Rollentabelle.
 */

export interface ModelCall {
  model: string
  system: string
  user: string
  /** Ist es gesetzt, wird strukturiert geantwortet — sonst freier JSON-Text. */
  schema?: Record<string, unknown> | null
  temperature?: number
  maxTokens?: number
}

export interface ModelResult {
  value: unknown
  model: string
  tokensIn: number
  tokensOut: number
}

/* ────────────────────────── Die Minutenbremse ────────────────────────── */

/**
 * Konten haben ein Token-Limit je Minute. Wer es nur im Speicher fuehrt, fuehrt
 * es je Lambda-Instanz — und zwei Instanzen, die sich beide fuer allein halten,
 * verbrauchen zusammen das Doppelte. Also steht das Fenster in der Datenbank.
 */
const TPM = Number(process.env.MODEL_TPM ?? 26_000)
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

let windowTableReady = false
async function ensureWindowTable() {
  if (windowTableReady) return
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS model_window (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      model TEXT NOT NULL, tokens INT NOT NULL,
      at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS model_window_idx ON model_window (model, at DESC)`)
  windowTableReady = true
}

async function spentInWindow(model: string): Promise<{ summe: number; freiIn: number }> {
  await ensureWindowTable()
  const rows = (await db.execute(sql`
    SELECT COALESCE(SUM(tokens), 0)::int AS summe,
           COALESCE(EXTRACT(EPOCH FROM (MIN(at) + interval '61 seconds' - now())), 0)::float AS frei_in
    FROM model_window WHERE model = ${model} AND at > now() - interval '60 seconds'`)) as unknown as
    Array<{ summe: number; frei_in: number }>
  return { summe: rows[0]?.summe ?? 0, freiIn: Math.max(0, rows[0]?.frei_in ?? 0) }
}

async function throttle(model: string, geschaetzt: number): Promise<void> {
  for (let i = 0; i < 10; i++) {
    const { summe, freiIn } = await spentInWindow(model)
    if (geschaetzt + summe <= TPM || summe === 0) return
    await sleep(Math.min(Math.max(1_500, Math.ceil(freiIn * 1000) + 500), 20_000))
  }
}

async function recordSpend(model: string, tokens: number) {
  await ensureWindowTable()
  await db.execute(sql`INSERT INTO model_window (model, tokens) VALUES (${model}, ${tokens})`)
  if (Math.random() < 0.05) {
    await db.execute(sql`DELETE FROM model_window WHERE at < now() - interval '10 minutes'`)
  }
}

/**
 * Wie lange wir warten, bevor wir es nochmal versuchen.
 *
 * Beide Anbieter sagen es selbst — OpenAI im Text, Anthropic im Header. Wer
 * stur verdoppelt, wartet entweder zu kurz und verbrennt einen Versuch oder zu
 * lang und verliert die Laufzeit.
 */
function backoffMs(versuch: number, res: Response | null, text: string): number {
  const header = res?.headers.get('retry-after')
  if (header) {
    const sek = Number(header)
    if (Number.isFinite(sek)) return Math.ceil(sek * 1000) + 500
  }
  const hint = /try again in ([\d.]+)s/i.exec(text)
  if (hint) return Math.ceil(Number(hint[1]) * 1000) + 800
  return 2500 * (versuch + 1)
}

/* ─────────────────────────────── Aufruf ─────────────────────────────── */

export async function callModel(c: ModelCall): Promise<ModelResult> {
  const erste = await callOnce(c)

  /**
   * Nachfordern, was fehlt.
   *
   * `required` im Schema ist eine Bitte, keine Garantie — beide Anbieter
   * behandeln es als Hinweis. Beobachtet: ein Schritt mit neun Feldern, drei
   * davon als Pflicht deklariert, lieferte sechs. Das Feld, das fehlte, war
   * ausgerechnet eines der drei.
   *
   * Der Schaden entsteht nicht hier, sondern zwei Schritte spaeter: Ein
   * spaeterer Prompt zieht das leere Feld, bekommt nichts, und der Lauf
   * arbeitet ohne es weiter, als waere es nie verlangt worden.
   *
   * Also wird nachgefragt — einmal, gezielt, mit der bisherigen Antwort im
   * Kontext. Nur fuer die fehlenden Felder, nicht fuer den ganzen Schritt.
   */
  erste.value = sanitize(erste.value)

  const fehlend = missingRequired(c.schema, erste.value)
  if (!fehlend.length) return erste

  const nach = await callOnce({
    ...c,
    maxTokens: Math.min(c.maxTokens ?? 4000, 2000),
    user: `${c.user}

────────────────────────────────────────
Du hast bereits geantwortet, aber ${fehlend.length === 1 ? 'ein Pflichtfeld fehlt' : `${fehlend.length} Pflichtfelder fehlen`}: ${fehlend.join(', ')}.

Das hier hast Du schon geliefert — uebernimm es unveraendert und ergaenze nur das Fehlende:
${JSON.stringify(erste.value, null, 2).slice(0, 6000)}`,
  })

  // Zusammenfuehren: Was schon dastand, gewinnt — der zweite Aufruf soll
  // ergaenzen, nicht ueberschreiben.
  const zusammen = { ...(sanitize(nach.value) as object), ...(erste.value as object) }
  return {
    value: zusammen,
    model: erste.model,
    tokensIn: erste.tokensIn + nach.tokensIn,
    tokensOut: erste.tokensOut + nach.tokensOut,
  }
}

async function callOnce(c: ModelCall): Promise<ModelResult> {
  const anbieter = c.model.startsWith('claude') ? 'claude' : 'openai'
  const body = anbieter === 'claude' ? claudeBody(c) : openAIBody(c)
  // Grob geschaetzt: gut drei Zeichen je Token, plus was die Antwort kosten darf.
  const geschaetzt = Math.ceil(body.length / 3.2) + (c.maxTokens ?? 4000)

  await throttle(c.model, geschaetzt)
  const r = anbieter === 'claude' ? await postClaude(c, body) : await postOpenAI(c, body)
  await recordSpend(c.model, r.tokensIn + r.tokensOut)
  return r
}

/**
 * Leckgeschlagene Werkzeug-Syntax aufraeumen.
 *
 * Beobachtet: Ein Feld, das eine Liste von Fragen enthalten sollte, kam als
 * Zeichenkette zurueck, und darin stand `<parameter name="fragen">["…` — das
 * Modell hatte mitten in der Antwort angefangen, den Werkzeugaufruf als Text
 * zu schreiben.
 *
 * Das faellt nicht auf, weil das Feld gefuellt ist. Es faellt erst auf, wenn
 * jemand die Liste durchgeht und einzelne Zeichen bekommt.
 *
 * Also: Wo eine Zeichenkette nach eingebettetem JSON aussieht, holen wir das
 * JSON heraus. Wo sie nach Werkzeug-Syntax aussieht, schneiden wir sie weg.
 */
function sanitize(x: unknown, tiefe = 0): unknown {
  if (tiefe > 6) return x
  if (Array.isArray(x)) return x.map((y) => sanitize(y, tiefe + 1))
  if (x && typeof x === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(x as Record<string, unknown>)) out[k] = sanitize(v, tiefe + 1)
    return out
  }
  if (typeof x !== 'string') return x

  let t = x
  // Ein angefangener Werkzeugaufruf im Text: alles ab da ist Muell.
  const leck = /<(?:\/)?(?:antml:)?(?:parameter|invoke|function_calls)\b/i.exec(t)
  if (leck) {
    const davor = t.slice(0, leck.index).trim()
    // Was hinter dem Leck steht, ist oft der eigentliche Wert — meistens JSON.
    const dahinter = t.slice(leck.index)
    const arr = /\[[\s\S]*\]/.exec(dahinter)
    const obj = /\{[\s\S]*\}/.exec(dahinter)
    const roh = arr?.[0] ?? obj?.[0]
    if (roh) {
      try { return sanitize(JSON.parse(roh), tiefe + 1) } catch { /* dann eben nicht */ }
    }
    t = davor
  }

  // Eine Zeichenkette, die vollstaendig aus JSON besteht, ist keine.
  const gestutzt = t.trim()
  if ((gestutzt.startsWith('[') && gestutzt.endsWith(']'))
    || (gestutzt.startsWith('{') && gestutzt.endsWith('}'))) {
    try { return sanitize(JSON.parse(gestutzt), tiefe + 1) } catch { /* war doch Text */ }
  }
  return t
}

/**
 * Welche Pflichtfelder in der Antwort fehlen.
 *
 * Leer zaehlt als fehlend: Ein Feld mit "" oder [] ist genauso wenig eine
 * Antwort wie gar keines, und im Prompt danach sieht man den Unterschied nicht.
 */
function missingRequired(schema: ModelCall['schema'], value: unknown): string[] {
  if (!schema || typeof value !== 'object' || value === null) return []
  const pflicht = (schema as { required?: unknown }).required
  if (!Array.isArray(pflicht) || !pflicht.length) return []
  const v = value as Record<string, unknown>
  return pflicht
    .map(String)
    .filter((k) => {
      const x = v[k]
      if (x === undefined || x === null) return true
      if (typeof x === 'string') return x.trim() === ''
      if (Array.isArray(x)) return x.length === 0
      return false
    })
}

function openAIBody(c: ModelCall): string {
  return JSON.stringify({
    model: c.model,
    temperature: c.temperature ?? 0.5,
    max_tokens: c.maxTokens ?? 4000,
    messages: [{ role: 'system', content: c.system }, { role: 'user', content: c.user }],
    response_format: c.schema && Object.keys(c.schema).length
      ? { type: 'json_schema', json_schema: { name: 'ergebnis', schema: c.schema, strict: false } }
      : { type: 'json_object' },
  })
}

/**
 * Bei Claude gibt es kein `response_format`. Der verlaesslichste Weg zu einer
 * strukturierten Antwort ist ein erzwungenes Werkzeug mit dem gewuenschten
 * Schema: Dann ist die Antwort keine Prosa, die zufaellig wie JSON aussieht,
 * sondern ein Aufruf mit geprueften Feldern.
 */
function claudeBody(c: ModelCall): string {
  const payload: Record<string, unknown> = {
    model: c.model,
    max_tokens: c.maxTokens ?? 4000,
    system: c.system,
    messages: [{ role: 'user', content: c.user }],
  }
  /**
   * Temperatur nur, wo sie noch erlaubt ist.
   *
   * Die neueren Claude-Modelle lehnen den Parameter ab („`temperature` is
   * deprecated for this model") und antworten mit 400 — der Lauf stirbt dann
   * am ersten Schritt. Die Steuerung, die wir wollten, steckt ohnehin
   * zuverlaessiger im Prompt als in einer Zahl.
   */
  const ohneTemperatur = /^claude-(opus-5|sonnet-5|fable-5|haiku-5)/.test(c.model)
  if (!ohneTemperatur && c.temperature !== undefined) payload.temperature = c.temperature
  if (c.schema && Object.keys(c.schema).length) {
    payload.tools = [{
      name: 'ergebnis',
      description: 'Das Ergebnis dieses Schritts, in der vorgegebenen Form.',
      input_schema: c.schema,
    }]
    payload.tool_choice = { type: 'tool', name: 'ergebnis' }
  }
  return JSON.stringify(payload)
}

async function postOpenAI(c: ModelCall, body: string): Promise<ModelResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY fehlt')
  let res: Response | null = null
  let lastText = ''
  for (let versuch = 0; versuch < 4; versuch++) {
    res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body,
    })
    if (res.ok) break
    lastText = await res.text()
    if (res.status !== 429 && res.status < 500) break
    await sleep(Math.min(backoffMs(versuch, res, lastText), 30_000))
  }
  if (!res || !res.ok) throw new Error(`Modell ${res?.status ?? 0}: ${lastText.slice(0, 200)}`)
  const data = await res.json()
  return {
    value: JSON.parse(data.choices?.[0]?.message?.content ?? '{}'),
    model: c.model,
    tokensIn: data.usage?.prompt_tokens ?? 0,
    tokensOut: data.usage?.completion_tokens ?? 0,
  }
}

async function postClaude(c: ModelCall, body: string): Promise<ModelResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY fehlt')
  let res: Response | null = null
  let lastText = ''
  for (let versuch = 0; versuch < 4; versuch++) {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body,
    })
    if (res.ok) break
    lastText = await res.text()
    // 529 heisst „ueberlastet" und ist ein Fall fuer Geduld, kein Fehler.
    if (res.status !== 429 && res.status !== 529 && res.status < 500) break
    await sleep(Math.min(backoffMs(versuch, res, lastText), 30_000))
  }
  if (!res || !res.ok) throw new Error(`Modell ${res?.status ?? 0}: ${lastText.slice(0, 200)}`)

  const data = await res.json() as {
    content?: Array<{ type?: string; text?: string; name?: string; input?: unknown }>
    usage?: { input_tokens?: number; output_tokens?: number }
  }

  let value: unknown = {}
  const werkzeug = (data.content ?? []).find((b) => b.type === 'tool_use' && b.name === 'ergebnis')
  if (werkzeug?.input) {
    value = werkzeug.input
  } else {
    // Kein Werkzeug benutzt: Text einsammeln und das JSON darin suchen. Ein
    // Modell, das erklaert, bevor es antwortet, soll den Lauf nicht kosten.
    const text = (data.content ?? []).filter((b) => b.type === 'text').map((b) => b.text ?? '').join('')
    const roh = /```(?:json)?\s*([\s\S]*?)```/.exec(text)?.[1] ?? text
    const von = roh.indexOf('{')
    const bis = roh.lastIndexOf('}')
    try { value = von >= 0 && bis > von ? JSON.parse(roh.slice(von, bis + 1)) : {} } catch { value = {} }
  }

  return {
    value, model: c.model,
    tokensIn: data.usage?.input_tokens ?? 0,
    tokensOut: data.usage?.output_tokens ?? 0,
  }
}
