import { callModel } from '@/lib/ai/call'
import { parseTranscript, computeMetrics, renderForModel, computeTimeline, locateQuote, type CallMetrics, type ParsedTranscript } from './transcript'
import { systemPrompt, outputSchema, CRITERIA, SKILLS, DIMENSIONS, NOT_OBSERVABLE, MAX_GRADE, type SkillKey, type CriterionKey, type DimensionKey } from './rubric'

/**
 * One pass over the whole transcript.
 *
 * The live coach this comes from analysed every single message — fine while
 * someone is on a call, far too expensive for a free check: a 45-minute call
 * is around 200 messages, each one a model call. Here it is one call, with the
 * countable facts computed in code beforehand.
 */

export const LIMITS = {
  minWords: 250,
  maxWords: Number(process.env.CALL_CHECK_MAX_WORDS ?? 12_000),
}

export const MODEL = process.env.CALL_CHECK_MODEL ?? 'gpt-4.1'

/** USD per million tokens, input / output. Unknown models count as the dearest. */
const PRICE_USD: Record<string, [number, number]> = {
  'gpt-4.1': [2, 8],
  'gpt-4.1-mini': [0.4, 1.6],
  'claude-sonnet-5': [3, 15],
  'claude-haiku-4-5-20251001': [1, 5],
}
const USD_TO_EUR = 0.925

export function costEur(model: string, tokensIn: number, tokensOut: number): number {
  const [pin, pout] = PRICE_USD[model] ?? [3, 15]
  return ((tokensIn / 1e6) * pin + (tokensOut / 1e6) * pout) * USD_TO_EUR
}

export interface SkillResult { key: SkillKey; measurable: boolean; grade: number | null; basis: string; note: string; observable: boolean }
export interface CriterionResult { key: CriterionKey; score: number | null; finding: string; evidence: string[] }
export interface DimensionResult { key: DimensionKey; grade: number | null; measured: number; total: number }

export interface TurningPoint { customer_quote: string; seller_reaction: string; effect: string; better: string; turn?: number | null }
export interface Phase { from_turn: number; to_turn: number; label: string; rating: 'good' | 'mixed' | 'weak'; note: string }
export interface Moment { turn: number; kind: 'strength' | 'feedback'; label: string; note: string }

export interface CheckResult {
  summary: string
  turning_point: TurningPoint | null
  criteria: CriterionResult[]
  skills: SkillResult[]
  dimensions: DimensionResult[]
  questions: Array<{ text: string; open: boolean; category: string | null }>
  protocol: { pain_gain: string[]; evidence: string[]; impact: string[] }
  objections: Array<{ objection: string; response?: string | null; status: string; turn?: number | null }>
  tips: Array<{ title: string; why: string; quote: string; try_next: string; turn?: number | null }>
  learning: { skill: SkillKey; reason: string }
  /** Ab 17.10.2026 — ältere Checks haben die Felder nicht */
  buying_signals?: Array<{ type: 'positive' | 'negative'; signal: string; quote: string; turn?: number | null }>
  purchase?: { probability: number | null; value_aligned: boolean; reasoning: string } | null
  offer_draft?: OfferDraft | null
  depth?: Depth
  /** Ab 18.10.2026 — Etappen und Feedback-Stellen für die Verlaufsgrafik */
  phases?: Phase[]
  moments?: Moment[]
}

export interface OfferDraft {
  headline: string; results: string[]; challenges: string[]; empathy: string; steps: string[]
  cost_of_inaction: string; risk_reversal: string; next_step: string; missing: string[]
}

/** Wie weit kam das Gespräch: Schmerz/Ziel → Beleg → Folge. Gezählt, nicht geschätzt. */
export interface Depth { level: 0 | 1 | 2 | 3; pain_gain: boolean; evidence: boolean; impact: boolean }
export function computeDepth(questions: Array<{ category: string | null; open: boolean }>, protocol: { pain_gain: string[]; evidence: string[]; impact: string[] }): Depth {
  const asked = (c: string) => questions.some((q) => q.open && q.category === c)
  const pain_gain = protocol.pain_gain.length > 0 || asked('P/G')
  const evidence = protocol.evidence.length > 0 || asked('E')
  const impact = protocol.impact.length > 0 || asked('I')
  const level = (pain_gain ? (evidence ? (impact ? 3 : 2) : 1) : 0) as Depth['level']
  return { level, pain_gain, evidence, impact }
}

const clamp = (n: unknown): number | null =>
  typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : null

const intOrNull = (n: unknown): number | null =>
  typeof n === 'number' && Number.isFinite(n) && n >= 1 ? Math.round(n) : null

const list = <T,>(x: unknown): T[] => (Array.isArray(x) ? (x as T[]) : x && typeof x === 'object' ? [x as T] : [])

/**
 * Whatever the model returns, the page gets the same shape: every criterion
 * and every skill exactly once, in a fixed order. A missing skill is not
 * silently dropped — it shows up as "not assessed".
 */
function normalise(raw: Record<string, unknown>, fallbackNote: string, notObservableNote: string): CheckResult {
  const crit = new Map(list<CriterionResult>(raw.criteria).map((c) => [c.key, c]))
  const criteria = CRITERIA.map((key) => {
    const c = crit.get(key)
    return {
      key,
      score: clamp(c?.score),
      finding: String(c?.finding ?? fallbackNote),
      evidence: list<string>(c?.evidence).map(String).slice(0, 3),
    }
  })

  const sk = new Map(list<Record<string, unknown>>(raw.skills).map((s) => [String(s.key), s]))
  const skills: SkillResult[] = SKILLS.map((key) => {
    if (NOT_OBSERVABLE.includes(key)) {
      return { key, observable: false, measurable: false, grade: null, basis: notObservableNote, note: '' }
    }
    const s = sk.get(key)
    const g = typeof s?.grade === 'number' && Number.isFinite(s.grade)
      ? Math.max(1, Math.min(MAX_GRADE, Math.round(s.grade as number))) : null
    const measurable = Boolean(s?.measurable) && g !== null
    return {
      key, observable: true, measurable,
      grade: measurable ? g : null,
      basis: String(s?.basis ?? fallbackNote),
      note: String(s?.note ?? ''),
    }
  })

  const byKey = new Map(skills.map((s) => [s.key, s]))
  const dimensions = DIMENSIONS.map((d) => {
    const measured = d.skills.map((k) => byKey.get(k)).filter((s): s is SkillResult => !!s && s.measurable)
    // One decimal: with two or three skills per dimension, rounding to whole
    // grades would hide the difference between "almost 3" and "barely 2".
    const grade = measured.length
      ? Math.round((measured.reduce((n, s) => n + (s.grade ?? 0), 0) / measured.length) * 10) / 10
      : null
    return { key: d.key, grade, measured: measured.length, total: d.skills.length }
  })

  const p = (raw.protocol ?? {}) as Record<string, unknown>
  const learningRaw = (raw.learning ?? {}) as { skill?: string; reason?: string }
  const measuredKeys = skills.filter((s) => s.measurable).map((s) => s.key)
  const learningSkill = (SKILLS as readonly string[]).includes(learningRaw.skill ?? '') &&
    measuredKeys.includes(learningRaw.skill as SkillKey)
    ? (learningRaw.skill as SkillKey)
    // Fallback: the weakest measured skill.
    : ([...skills].filter((s) => s.measurable).sort((a, b) => (a.grade ?? 0) - (b.grade ?? 0))[0]?.key ?? 'S06')

  const tp = raw.turning_point as Partial<TurningPoint> | undefined
  const turning_point = tp && tp.customer_quote && tp.seller_reaction
    ? { customer_quote: String(tp.customer_quote), seller_reaction: String(tp.seller_reaction),
        effect: String(tp.effect ?? ''), better: String(tp.better ?? ''), turn: intOrNull(tp.turn) }
    : null

  return {
    summary: String(raw.summary ?? ''),
    turning_point,
    criteria,
    skills,
    dimensions,
    questions: list<{ text: string; open: boolean; category: string | null }>(raw.questions).slice(0, 80),
    protocol: {
      pain_gain: list<string>(p.pain_gain).map(String).slice(0, 12),
      evidence: list<string>(p.evidence).map(String).slice(0, 12),
      impact: list<string>(p.impact).map(String).slice(0, 12),
    },
    objections: list<{ objection: string; response?: string | null; status: string }>(raw.objections).slice(0, 20),
    tips: list<{ title: string; why: string; quote: string; try_next: string }>(raw.tips).slice(0, 3),
    learning: { skill: learningSkill, reason: String(learningRaw.reason ?? '') },
    buying_signals: list<{ type: string; signal: string; quote: string }>(raw.buying_signals)
      .filter((b) => b && (b.type === 'positive' || b.type === 'negative') && b.signal)
      .map((b) => ({ type: b.type as 'positive' | 'negative', signal: String(b.signal), quote: String(b.quote ?? ''), turn: intOrNull((b as { turn?: unknown }).turn) })).slice(0, 12),
    purchase: raw.purchase && typeof raw.purchase === 'object'
      ? { probability: clamp((raw.purchase as Record<string, unknown>).probability), value_aligned: Boolean((raw.purchase as Record<string, unknown>).value_aligned), reasoning: String((raw.purchase as Record<string, unknown>).reasoning ?? '') }
      : null,
    offer_draft: normaliseOffer(raw.offer_draft),
    phases: list<Record<string, unknown>>(raw.phases)
      .map((p) => ({
        from_turn: intOrNull(p.from_turn) ?? 0, to_turn: intOrNull(p.to_turn) ?? 0, label: String(p.label ?? ''),
        rating: (['good', 'mixed', 'weak'].includes(String(p.rating)) ? p.rating : 'mixed') as Phase['rating'],
        note: String(p.note ?? ''),
      }))
      .filter((p) => p.from_turn >= 1 && p.to_turn >= p.from_turn && p.label).slice(0, 8),
    moments: list<Record<string, unknown>>(raw.moments)
      .map((m) => ({
        turn: intOrNull(m.turn) ?? 0, kind: (m.kind === 'strength' ? 'strength' : 'feedback') as Moment['kind'],
        label: String(m.label ?? ''), note: String(m.note ?? ''),
      }))
      .filter((m) => m.turn >= 1 && m.label).slice(0, 12),
    depth: computeDepth(
      list<{ category: string | null; open: boolean }>(raw.questions),
      { pain_gain: list<string>(p.pain_gain), evidence: list<string>(p.evidence), impact: list<string>(p.impact) },
    ),
  }
}

function normaliseOffer(x: unknown): OfferDraft | null {
  if (!x || typeof x !== 'object') return null
  const o = x as Record<string, unknown>
  const strs = (v: unknown, n: number) => list<unknown>(v).map(String).filter(Boolean).slice(0, n)
  const d: OfferDraft = {
    headline: String(o.headline ?? ''), results: strs(o.results, 5), challenges: strs(o.challenges, 5),
    empathy: String(o.empathy ?? ''), steps: strs(o.steps, 5), cost_of_inaction: String(o.cost_of_inaction ?? ''),
    risk_reversal: String(o.risk_reversal ?? ''), next_step: String(o.next_step ?? ''), missing: strs(o.missing, 6),
  }
  return d.headline || d.results.length || d.challenges.length ? d : null
}

export async function analyseTranscript(input: {
  transcript: string; seller: string | null; locale: string; checkId: string
}): Promise<{ result: CheckResult; metrics: CallMetrics; model: string; tokensIn: number; tokensOut: number; costEur: number }> {
  const parsed = parseTranscript(input.transcript)
  const seller = input.seller && parsed.speakers.some((s) => s.name === input.seller) ? input.seller : null
  const metrics = computeMetrics(parsed, seller)

  const facts = [
    `Wörter gesamt: ${metrics.words}`,
    seller ? `Verkäufer im Transkript: ${seller}` : 'Verkäufer: vom Nutzer nicht angegeben — bestimme ihn selbst aus dem Verlauf.',
    metrics.sellerShare !== null ? `Redeanteil Verkäufer: ${metrics.sellerShare} %` : null,
    seller ? `Fragezeichen in Beiträgen des Verkäufers: ${metrics.sellerQuestions}` : null,
    seller ? `Beiträge des Verkäufers mit zwei oder mehr Fragen (Serienfragen): ${metrics.serialQuestionTurns} von ${metrics.sellerTurns}` : null,
    seller ? `Längster Monolog des Verkäufers: ${metrics.longestSellerMonologue} Wörter` : null,
  ].filter(Boolean).join('\n')

  const res = await callModel({
    model: MODEL,
    system: systemPrompt(input.locale),
    user: `## Kennzahlen (gezählt)\n${facts}\n\n## Transkript\n${renderForModel(parsed, seller)}`,
    schema: outputSchema(),
    temperature: 0.2,
    maxTokens: 8000,
    anlass: { agentKey: 'call-check', stepKey: input.checkId },
  })

  const fallback = input.locale === 'en' ? 'Not assessed.' : input.locale === 'es' ? 'No evaluado.' : 'Nicht bewertet.'
  const notObservable = input.locale === 'en'
    ? 'Not visible in a single call — measured in simulation and rituals.'
    : input.locale === 'es'
      ? 'No visible en una sola conversación — se mide en simulación y rituales.'
      : 'Aus einem einzelnen Gespräch nicht ablesbar — wird in Simulation und Ritualen gemessen.'
  const raw = (res.value ?? {}) as Record<string, unknown>
  const result = normalise(raw, fallback, notObservable)
  // Without a seller from the user, take the one the model identified.
  const rs = typeof raw.seller === 'string' ? raw.seller : null
  const effectiveSeller = seller ?? (rs && parsed.speakers.some((s) => s.name === rs) ? rs : null)
  placeOnTimeline(result, parsed)
  metrics.timeline = computeTimeline(parsed, effectiveSeller)
  return {
    result, metrics, model: res.model,
    tokensIn: res.tokensIn, tokensOut: res.tokensOut,
    costEur: costEur(res.model, res.tokensIn, res.tokensOut),
  }
}


/**
 * Every quoted item gets the number of the turn it belongs to, so the page can
 * pin it on the timeline. The model's own number is checked against the
 * transcript; if it is off or missing, the quote is looked up. Runs while the
 * transcript is still in memory — afterwards it is gone.
 */
function placeOnTimeline(r: CheckResult, p: ParsedTranscript) {
  const n = p.turns.length
  const valid = (t: number | null | undefined) => (t && t >= 1 && t <= n ? t : null)
  const place = (quote: string | null | undefined, given: number | null | undefined) =>
    locateQuote(p, quote) ?? valid(given)
  if (r.turning_point) r.turning_point.turn = place(r.turning_point.customer_quote, r.turning_point.turn)
  r.tips = r.tips.map((t) => ({ ...t, turn: place(t.quote, t.turn) }))
  r.objections = r.objections.map((o) => ({ ...o, turn: place(o.objection, o.turn) }))
  r.buying_signals = (r.buying_signals ?? []).map((b) => ({ ...b, turn: place(b.quote, b.turn) }))
  r.phases = (r.phases ?? []).map((ph) => ({ ...ph, from_turn: Math.min(ph.from_turn, n), to_turn: Math.min(ph.to_turn, n) }))
    .filter((ph) => ph.from_turn >= 1)
  r.moments = (r.moments ?? []).filter((m) => m.turn <= n)
}
