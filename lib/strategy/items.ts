/**
 * Listen-Fakten auf Eintragsebene.
 *
 * Pains, Gains, Trigger und Anti-Personas sind Listen. Der Kunde ergänzt eigene
 * Einträge, bestätigt und verwirft. Ein zweiter Agent-Lauf darf diese Arbeit
 * nicht wegwischen — deshalb wird zusammengeführt statt ersetzt.
 *
 * Drei Regeln:
 *   1. Was vom Kunden kommt, bleibt. Immer.
 *   2. Was bestätigt ist, bleibt. Der Agent darf es nicht neu formulieren.
 *   3. Was verworfen wurde, bleibt als Grabstein liegen und geht als Negativliste
 *      in den nächsten Prompt. Sonst schlägt der Agent bei jedem Lauf dasselbe vor.
 */

import { createHash } from 'crypto'

export type ItemOrigin = 'agent' | 'user' | 'research' | 'import'
export type ItemStatus = 'draft' | 'confirmed' | 'rejected'

export interface FactItem extends Record<string, unknown> {
  item_id?: string
  origin?: ItemOrigin
  status?: ItemStatus
  confidence?: number
}

/** Die Felder, in denen die Kernaussage eines Eintrags steht — je nach Fakt-Typ. */
const TITLE_FIELDS = ['topic', 'label', 'event', 'name', 'title', 'text', 'desired_state', 'reality']

export function titleOf(item: FactItem): string {
  for (const f of TITLE_FIELDS) {
    const v = item[f]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return JSON.stringify(item).slice(0, 120)
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-zà-ÿ0-9äöüß ]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const STOP = new Set([
  'der','die','das','und','oder','ein','eine','einen','einem','einer','den','dem','des',
  'für','von','mit','bei','durch','ohne','auf','aus','im','in','zu','zum','zur','als','ist',
  'sind','wird','werden','nicht','kein','keine','sich','ihre','ihrer','ihren','eigene','eigenen',
])

function tokens(s: string): Set<string> {
  return new Set(normalize(s).split(' ').filter((w) => w.length > 3 && !STOP.has(w)))
}

function wordOverlap(a: string, b: string): number {
  const ta = tokens(a), tb = tokens(b)
  if (!ta.size || !tb.size) return 0
  let shared = 0
  for (const t of ta) if (tb.has(t)) shared++
  return shared / Math.min(ta.size, tb.size)
}

/**
 * Zeichen-Dreiergruppen. Nötig wegen der deutschen Komposita: „standardisierter"
 * und „Standardlösungen" teilen kein Wort, aber viele Dreiergruppen.
 */
function trigramOverlap(a: string, b: string): number {
  const g = (s: string) => {
    const t = ` ${normalize(s)} `
    const m = new Map<string, number>()
    for (let i = 0; i <= t.length - 3; i++) {
      const k = t.slice(i, i + 3)
      m.set(k, (m.get(k) ?? 0) + 1)
    }
    return m
  }
  const ga = g(a), gb = g(b)
  let inter = 0, sa = 0, sb = 0
  for (const [k, v] of ga) { sa += v; if (gb.has(k)) inter += Math.min(v, gb.get(k) as number) }
  for (const [, v] of gb) sb += v
  return sa + sb === 0 ? 0 : (2 * inter) / (sa + sb)
}

/** Wie stark überlappen zwei Aussagen? 0 = nichts gemeinsam, 1 = deckungsgleich. */
export function similarity(a: string, b: string): number {
  return Math.max(wordOverlap(a, b), trigramOverlap(a, b))
}

/**
 * Ab hier gelten zwei Einträge als dieselbe Aussage, nur anders formuliert.
 *
 * Gemessen an echten Läufen: Umformulierungen liegen bei 0,53 bis 0,61,
 * inhaltlich verschiedene Einträge bei höchstens 0,27. 0,45 trennt sauber.
 *
 * Was diese Stufe nicht kann, ist die Sinn-Dublette ohne gemeinsame Wörter
 * („Begrenzte wissenschaftliche Fundierung" gegen „stützt sich auf
 * Erfahrungswerte"). Dafür ist der Entschieden-Block im Prompt zuständig:
 * die Zeichenkette hier, der Sinn dort.
 */
export const SAME_ITEM_THRESHOLD = 0.45

export function itemId(item: FactItem): string {
  if (typeof item.item_id === 'string' && item.item_id) return item.item_id
  return createHash('sha1').update(normalize(titleOf(item))).digest('hex').slice(0, 12)
}

/** Jedem Eintrag Kennung, Herkunft und Status geben — einmal beim Schreiben. */
export function normalizeItems(value: unknown, origin: ItemOrigin): FactItem[] {
  if (!Array.isArray(value)) return []
  return (value as FactItem[]).map((raw) => {
    const item: FactItem = { ...raw }
    item.origin = (item.origin as ItemOrigin) ?? origin
    item.item_id = itemId(item)
    if (item.status !== 'confirmed' && item.status !== 'rejected') item.status = 'draft'
    if (origin === 'user') {
      item.status = 'confirmed'
      item.confidence = 1
      item.evidence_type = item.evidence_type ?? 'kundenwissen'
    }
    if (typeof item.confidence !== 'number') item.confidence = origin === 'user' ? 1 : 0.6
    return item
  })
}

export interface MergeReport {
  kept: number
  added: number
  skipped: number
  skippedTitles: string[]
}

/**
 * Bestehende Liste und neuen Agent-Vorschlag zusammenführen.
 *
 * Geschützt ist alles, was der Kunde angefasst hat: eigene Einträge, bestätigte
 * und verworfene. Ein neuer Vorschlag, der einem geschützten Eintrag zu ähnlich
 * ist, fällt weg — der Kunde hat dazu bereits entschieden.
 */
export function mergeItems(previous: unknown, incoming: unknown, origin: ItemOrigin = 'agent'): {
  items: FactItem[]
  report: MergeReport
} {
  const prev = normalizeItems(previous, 'agent')
  const next = normalizeItems(incoming, origin)

  const protectedItems = prev.filter(
    (i) => i.origin === 'user' || i.status === 'confirmed' || i.status === 'rejected',
  )
  const protectedTitles = protectedItems.map(titleOf)
  const byId = new Map(protectedItems.map((i) => [i.item_id as string, i]))

  const added: FactItem[] = []
  const skippedTitles: string[] = []

  for (const cand of next) {
    if (byId.has(cand.item_id as string)) { skippedTitles.push(titleOf(cand)); continue }
    const t = titleOf(cand)
    if (protectedTitles.some((p) => similarity(p, t) >= SAME_ITEM_THRESHOLD)) {
      skippedTitles.push(t)
      continue
    }
    added.push(cand)
  }

  // Reihenfolge: erst was der Kunde gesetzt hat, dann Bestätigtes, dann Neues.
  // Verworfenes wandert ans Ende — es bleibt als Grabstein und Negativliste.
  const rank = (i: FactItem) =>
    i.status === 'rejected' ? 3 : i.origin === 'user' ? 0 : i.status === 'confirmed' ? 1 : 2
  const items = [...protectedItems, ...added].sort((a, b) => rank(a) - rank(b))

  return {
    items,
    report: { kept: protectedItems.length, added: added.length, skipped: skippedTitles.length, skippedTitles },
  }
}

/** Was der Agent im nächsten Lauf sehen soll: gesetzt, und was er nicht wiederholen darf. */
export function splitForPrompt(value: unknown): { settled: FactItem[]; rejected: FactItem[]; open: FactItem[] } {
  const items = normalizeItems(value, 'agent')
  return {
    settled: items.filter((i) => i.origin === 'user' || i.status === 'confirmed'),
    rejected: items.filter((i) => i.status === 'rejected'),
    open: items.filter((i) => i.status === 'draft' && i.origin !== 'user'),
  }
}

/** Die Einträge, die der Kunde sieht — Grabsteine bleiben draußen. */
export function visibleItems(value: unknown): FactItem[] {
  return normalizeItems(value, 'agent').filter((i) => i.status !== 'rejected')
}
