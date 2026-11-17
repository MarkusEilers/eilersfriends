/**
 * ASK-Engine: ein Rechenkern, jeder Funnel ist Konfiguration.
 *
 * Struktur (Fragen, Stufen, Texte, Angebote) liegt versioniert im Repo,
 * Kalibrierung (Schwellen je Stufe) in der Datenbank und ist im Admin
 * ohne Deploy änderbar. Gerechnet wird nur auf dem Server.
 */

export type Lang = 'de' | 'en' | 'es'
export type L3 = Record<Lang, string>

export interface AskOption { label: L3; score: number }
export interface AskQuestion { id: string; prompt: L3; hint?: L3; options: AskOption[] }

export interface AskStage {
  key: string
  name: L3
  /** Bereich — „mehrere rote Bereiche“ routet ins Strategiegespräch */
  area: 'marketing' | 'sales' | 'customer'
  questions: AskQuestion[]
  /** Kurz-Diagnose, wenn diese Stufe der Engpass ist */
  diagnosis: L3
  /** „Zuerst: …“ — der erste Schritt */
  fixFirst: L3
  /** Bestätigung, wenn die Stufe grün ist */
  strength: L3
  /** Angebot, wenn diese Stufe Engpass Nr. 1 ist */
  cta: string
  /** Erkenntnis unterwegs, nach der letzten Frage dieser Stufe */
  insightAfter?: L3
}

export interface AskCta { title: L3; text: L3; button: L3; href: string }

export interface AskFunnelDef {
  slug: string
  template: 'constraint'
  title: L3
  kicker: L3
  intro: L3
  promise: L3[]
  duration: L3
  stages: AskStage[]
  ctas: Record<string, AskCta>
  /** Ab so vielen roten Stufen über mindestens zwei Bereiche gilt dieses Angebot */
  multiRed: { min: number; cta: string }
  /** Angebot, wenn keine Stufe rot oder gelb ist */
  allGreenCta: string
  contact: { phone: 'optional' | 'required' | 'off' }
  teaser: { headline: L3; sub: L3; questionIds: string[]; button: L3 }
}

export interface AskCalibration { benchmarks: Record<string, { red: number; green: number }> }

export type StageStatus = 'red' | 'yellow' | 'green'
export interface StageResult { key: string; score: number; status: StageStatus; red: number; green: number }
export interface AskResult {
  stages: StageResult[]
  /** rote Stufen in Funnel-Reihenfolge (max. 3) — „zuerst, danach, dann“ */
  constraints: string[]
  /** Stufe Nr. 1: erste rote, sonst erste gelbe, sonst null */
  first: string | null
  firstKind: 'red' | 'yellow' | null
  redCount: number
  cta: string
  secondary: string[]
  calibrated: boolean
}
