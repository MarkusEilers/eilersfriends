import { callModel } from '@/lib/ai/call'
import { parseTranscript, computeMetrics, renderForModel, type CallMetrics } from './transcript'
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

export interface CheckResult {
  summary: string
  criteria: CriterionResult[]
  skills: SkillResult[]
  dimensions: DimensionResult[]
  questions: Array<{ text: string; open: boolean; category: string | null }>
  protocol: { pain_gain: string[]; evidence: string[]; impact: string[] }
  objections: Array<{ objection: string; response?: string | null; status: string }>
  tips: Array<{ title: string; why: string; quote: string; try_next: string }>
  learning: { skill: SkillKey; reason: string }
}

const clamp = (n: unknown): number | null =>
  typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : null

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

  return {
    summary: String(raw.summary ?? ''),
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
  }
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
    maxTokens: 6000,
    anlass: { agentKey: 'call-check', stepKey: input.checkId },
  })

  const fallback = input.locale === 'en' ? 'Not assessed.' : input.locale === 'es' ? 'No evaluado.' : 'Nicht bewertet.'
  const notObservable = input.locale === 'en'
    ? 'Not visible in a single call — measured in simulation and rituals.'
    : input.locale === 'es'
      ? 'No visible en una sola conversación — se mide en simulación y rituales.'
      : 'Aus einem einzelnen Gespräch nicht ablesbar — wird in Simulation und Ritualen gemessen.'
  const result = normalise((res.value ?? {}) as Record<string, unknown>, fallback, notObservable)
  return {
    result, metrics, model: res.model,
    tokensIn: res.tokensIn, tokensOut: res.tokensOut,
    costEur: costEur(res.model, res.tokensIn, res.tokensOut),
  }
}
