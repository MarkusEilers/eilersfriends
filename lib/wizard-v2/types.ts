// ============================================================
// Wizard v2 · B2B-Angebote Bauplan — Types
// ============================================================
// Quelle: docs/framework-b2b-angebote-v2-data-model.ts (canonical)
// Hier nur die TS-Typen, ohne Kommentare/DB-Mapping. Für DB-Tabellen siehe lib/db/self-heal-v2.ts.

// ─── Step 01 ───────────────────────────────────────────────

export type BusinessModel = 'saas' | 'service' | 'consulting' | 'hybrid' | 'marketplace' | 'course' | 'membership' | 'lizenz'

export interface BusinessContext {
  marketPosition: string
  targetMarket: string
  businessModel: BusinessModel
  businessModelFreeText?: string
  competitivePositioning: string
}

export type ProductType = 'programm' | 'coaching' | 'software' | 'lizenz' | 'membership' | 'workshop' | 'service' | 'beratung'
export type ProductStage = 'idee' | 'pilot' | 'live' | 'skalierung'

export interface ProductOrService {
  productName: string
  productType: ProductType
  productSummary: string
  productUrl?: string
  productStage: ProductStage
}

export interface BuildingBlock {
  id: string
  name: string
  description: string
  isBonus: boolean
  order: number
}

// ─── Step 02 · ICP ─────────────────────────────────────────

export interface ICPDemographics {
  name?: string
  /** Liste von Rollen, die dieses Angebot adressiert. Erste = Hauptrolle. */
  roles: string[]
  /** @deprecated use roles[] */
  role?: string
  responsibilities: string
  companySizeMin?: number
  companySizeMax?: number
  whereToMeet: string[]
}

export interface ICPCurrency {
  id: string
  metric: string
  unit?: string
  rangeLabel: string
}

export interface ICPPainGain {
  id: string
  type: 'pain' | 'gain'
  topic: string
  reality: string
  economicImpact: string
  kpi: string
  linkedCurrencyId?: string
  order: number
}

export interface ICPInterviewContact {
  id: string
  name: string
  reason: string
  category: 'for' | 'against' | 'neutral'
}

export interface ICP {
  demographics: ICPDemographics
  currencies: ICPCurrency[]
  painsGains: ICPPainGain[]
  interviewContacts: ICPInterviewContact[]
}

// ─── Step 03 · Herausforderungen + Outcomes ────────────────

export interface ChallengeOrOutcome {
  id: string
  type: 'challenge' | 'outcome'
  topic: string
  reality: string
  economicImpact: string
  kpi: string
  order: number
}

// ─── Step 04 · Beef-Radar ──────────────────────────────────

export interface BeefRadarCard {
  id: string
  buildingBlockId: string
  column: 'what' | 'how' | 'why'
  text: string
}

// ─── Step 05 · Future Problems ─────────────────────────────

export interface FutureProblem {
  id: string
  problem: string
  trigger: string
  solvedThrough?: string  // FK auf BuildingBlock.id
  solvedThroughFreeText?: string
  marginalCost?: string
  order: number
}

// ─── Step 06 · Wirtschaftliche Bewertung ───────────────────

export type EconomicUnit =
  | 'user/quarter' | 'user/year'
  | 'department/quarter' | 'department/year'
  | 'company/quarter' | 'company/year'

export interface ClusterCard {
  id: string
  source: 'beef-why' | 'future-solved' | 'challenge' | 'outcome' | 'icp-pain'
  sourceId: string
  text: string
}

export interface EconomicCluster {
  id: string
  clusterName: string
  economicValuePerUnit: number
  unit: EconomicUnit
  confidenceLevel: 'belegt' | 'hypothese' | 'branchen-anker'
  methodology: string
  containedCards: ClusterCard[]
  order: number
}

export interface MaximumBudget {
  primaryUnit: EconomicUnit
  primaryValue: number
  byUnit: Partial<Record<EconomicUnit, number>>
}

// ─── Step 07 · Bulletproof Plan ────────────────────────────

export interface BulletproofStep {
  id: string
  title: string
  fromState: string
  toState: string
  linkedBuildingBlockIds: string[]
  order: number
}

export interface BulletproofPhase {
  id: string
  name: string
  theme?: string
  fromState: string
  toState: string
  description: string
  steps: BulletproofStep[]
  order: number
}

export interface BulletproofPlan {
  name: string
  startingPain: string
  startSymptoms: string[]
  endGoal: string
  endProofPoints: string[]
  headlinePromise: string
  phases: BulletproofPhase[]
  roadmapSvgPath?: string
}

// ─── Step 08 · Phase Currencies ────────────────────────────

export interface PhaseCurrency {
  id: string
  phaseId: string
  metric: string
  unit: string
  baseline: string
  pessimistic: string
  realistic: string
  optimistic: string
  measuredAt: string
  isPrimary: boolean
}

// ─── Step 09 · Preis ───────────────────────────────────────

export type BillingFrequency = 'einmalig' | 'monatlich' | 'jährlich' | 'lifetime'

export interface PricingTier {
  id: string
  label: string
  price: number
  currency: 'EUR' | 'USD' | 'GBP'
  billingFrequency: BillingFrequency
  order: number
}

export interface PricingSummary {
  tiers: PricingTier[]
  marktestReasoning: string
  antiGlattCheck: boolean
}

// ─── Step 10 · Scarcity ────────────────────────────────────

export type ScarcityType =
  | 'cohort-size' | 'deadline' | 'lifetime-lock' | 'geographic'
  | 'industry-exclusive' | 'personal-delivery-cap' | 'bonus-slot'
  | 'co-investment' | 'seasonal-window'

export interface ScarcityElement {
  scarcityType: ScarcityType
  scarcityReason: string
  scarcityProof: {
    cohortSize?: number
    deadline?: string
    region?: string
    industry?: string
    bonusSlots?: number
  }
  isReal: boolean
}

// ─── Step 11 · Risk-Reversal ───────────────────────────────

export type ReversalType =
  | 'result-or-action' | 'conditional-refund' | 'unconditional-refund'
  | 'time-extension' | 'result-plus-bonus' | 'pay-on-results'

export interface RiskReversal {
  reversalType: ReversalType
  triggerCondition: string
  consequence: string
  anchorPhaseId?: string
  anchorCurrencyId?: string
  espressoTest: boolean
  refundDeadline?: number
}

// ─── Step 12 · Offer Identity ──────────────────────────────

export interface OfferIdentityVariant {
  pattern: 'mechanism' | 'outcome' | 'time' | 'anti-pattern' | 'inside-joke'
  name: string
  headline: string
  cta: string
  espressoTestPassed: boolean
}

export interface OfferIdentity {
  name: string
  subheadline?: string
  headline: string
  cta: string
  ctaSecondary?: string
  generatedVariants?: OfferIdentityVariant[]
}

// ─── Wrapper ───────────────────────────────────────────────

export type BauplanStepKey =
  | '00-welcome'
  | '01-business-product-blocks'
  | '02-icp'
  | '03-challenges-outcomes'
  | '04-beef-radar'
  | '05-future-problems'
  | '06-economic-cluster'
  | '07-bulletproof'
  | '08-phase-currencies'
  | '09-preis'
  | '10-scarcity'
  | '11-risk-reversal'
  | '12-name-headline'

export type StepStatus = 'locked' | 'active' | 'started' | 'completed' | 'skipped'

export interface BauplanStepState {
  stepKey: BauplanStepKey
  status: StepStatus
  startedAt?: string
  completedAt?: string
  skippedAt?: string
  pointsAwarded: number
}

export interface BauplanDraft {
  id: string
  userId: string
  productSlug: string
  title: string
  language: 'de' | 'en' | 'es'

  steps: BauplanStepState[]
  currentStepKey: BauplanStepKey
  totalPoints: number

  businessContext?: BusinessContext
  productOrService?: ProductOrService
  buildingBlocks: BuildingBlock[]
  icp?: ICP
  challengesAndOutcomes: ChallengeOrOutcome[]
  beefRadarCards: BeefRadarCard[]
  futureProblems: FutureProblem[]
  economicClusters: EconomicCluster[]
  maximumBudget?: MaximumBudget
  bulletproofPlan?: BulletproofPlan
  phaseCurrencies: PhaseCurrency[]
  pricing?: PricingSummary
  scarcity?: ScarcityElement
  riskReversal?: RiskReversal
  offerIdentity?: OfferIdentity

  createdAt: string
  updatedAt: string
  publishedAt?: string
  pdfBauplanUrl?: string
  pdfOnePagerUrl?: string
}

export const POINTS = {
  STEP_STARTED: 10,
  STEP_COMPLETED: 250,
  AI_ACCEPTED: 25,
  ITEM_ADDED: 15,
  CLUSTER_CREATED: 50,
  ROADMAP_RENDERED: 100,
  PDF_EXPORTED: 200,
  DAILY_BONUS: 10,
} as const
