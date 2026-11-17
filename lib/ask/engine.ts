import type { AskCalibration, AskFunnelDef, AskResult, Lang, StageResult } from './types'

export const LANGS: Lang[] = ['de', 'en', 'es']
export const asLang = (l: string | null | undefined): Lang => (l === 'en' || l === 'es' ? l : 'de')

export function defaultCalibration(def: AskFunnelDef): AskCalibration {
  return { benchmarks: Object.fromEntries(def.stages.map((s) => [s.key, { red: 40, green: 66 }])) }
}

/** Antworten = Index der gewählten Option je Frage-ID. Unvollständig → null. */
export function validateAnswers(def: AskFunnelDef, raw: unknown): Record<string, number> | null {
  if (!raw || typeof raw !== 'object') return null
  const a = raw as Record<string, unknown>
  const out: Record<string, number> = {}
  for (const s of def.stages) for (const q of s.questions) {
    const v = a[q.id]
    if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v >= q.options.length) return null
    out[q.id] = v
  }
  return out
}

/**
 * Theory of Constraints: Stufen von oben nach unten, die erste rote ist der
 * bindende Engpass. Alles dahinter verpufft, solange sie nicht gelöst ist.
 */
export function compute(def: AskFunnelDef, cal: AskCalibration | null, answers: Record<string, number>): AskResult {
  const base = defaultCalibration(def)
  let calibrated = true
  const stages: StageResult[] = def.stages.map((s) => {
    const scores = s.questions.map((q) => q.options[answers[q.id]]?.score ?? 0)
    const score = Math.round(scores.reduce((x, y) => x + y, 0) / Math.max(1, scores.length))
    const b = cal?.benchmarks?.[s.key]
    if (!b) calibrated = false
    const { red, green } = b ?? base.benchmarks[s.key]
    const status = score < red ? 'red' : score < green ? 'yellow' : 'green'
    return { key: s.key, score, status, red, green }
  })
  const reds = stages.filter((s) => s.status === 'red').map((s) => s.key)
  const yellows = stages.filter((s) => s.status === 'yellow').map((s) => s.key)
  const first = reds[0] ?? yellows[0] ?? null
  const firstKind = reds[0] ? 'red' : yellows[0] ? 'yellow' : null
  const areas = new Set(reds.map((k) => def.stages.find((s) => s.key === k)!.area))
  let cta: string
  if (reds.length >= def.multiRed.min && areas.size >= 2) cta = def.multiRed.cta
  else if (first) cta = def.stages.find((s) => s.key === first)!.cta
  else cta = def.allGreenCta
  const secondary = Object.keys(def.ctas).filter((k) => k !== cta)
  return { stages, constraints: reds.slice(0, 3), first, firstKind, redCount: reds.length, cta, secondary, calibrated }
}

/** Funnel ohne Punktwerte für den Browser — gerechnet wird auf dem Server. */
export function publicDef(def: AskFunnelDef, lang: Lang) {
  return {
    slug: def.slug,
    title: def.title[lang], kicker: def.kicker[lang], intro: def.intro[lang], duration: def.duration[lang],
    promise: def.promise.map((p) => p[lang]),
    phone: def.contact.phone,
    stages: def.stages.map((s) => ({
      key: s.key, name: s.name[lang], insightAfter: s.insightAfter?.[lang] ?? null,
      questions: s.questions.map((q) => ({ id: q.id, prompt: q.prompt[lang], hint: q.hint?.[lang] ?? null, options: q.options.map((o) => o.label[lang]) })),
    })),
  }
}
export type PublicDef = ReturnType<typeof publicDef>

/** Kurzergebnis — sofort, ohne Kontaktdaten. Der volle Report kommt nach der Bestätigung. */
export function shortResult(def: AskFunnelDef, r: AskResult, lang: Lang) {
  const st = r.first ? def.stages.find((s) => s.key === r.first)! : null
  return {
    stages: r.stages.map((s) => ({ key: s.key, name: def.stages.find((x) => x.key === s.key)!.name[lang], status: s.status })),
    first: st ? { key: st.key, name: st.name[lang], kind: r.firstKind, diagnosis: firstSentence(st.diagnosis[lang]) } : null,
    redCount: r.redCount,
  }
}
export type ShortResult = ReturnType<typeof shortResult>

function firstSentence(t: string) {
  const m = t.match(/^.*?[.!?](\s|$)/)
  return (m ? m[0] : t).trim()
}
