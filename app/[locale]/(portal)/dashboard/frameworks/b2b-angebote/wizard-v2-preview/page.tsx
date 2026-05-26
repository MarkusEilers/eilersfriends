import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { ensureBauplanV2Tables } from '@/lib/db/self-heal-v2'
import { ensureCompanyProfile } from '@/lib/db/self-heal'
import { WizardV2Layout } from '@/components/wizard-v2/WizardV2Layout'
import { WelcomeStepV2 } from '@/components/wizard-v2/WelcomeStepV2'
import { Step01BusinessProductBlocks } from '@/components/wizard-v2/Step01BusinessProductBlocks'
import { Step02ICP } from '@/components/wizard-v2/Step02ICP'
import { Step03ChallengesOutcomes } from '@/components/wizard-v2/Step03ChallengesOutcomes'
import { Step04BeefRadar } from '@/components/wizard-v2/Step04BeefRadar'
import { Step05FutureProblems } from '@/components/wizard-v2/Step05FutureProblems'
import { Step06EconomicCluster } from '@/components/wizard-v2/Step06EconomicCluster'
import { Step07BulletproofPlan, Step08PhaseCurrencies, Step09Preis, Step10Scarcity, Step11RiskReversal, Step12NameHeadline } from '@/components/wizard-v2/Steps07to12'
import type {
  BusinessContext, ProductOrService, BuildingBlock, BeefRadarCard, ICP, ChallengeOrOutcome,
  FutureProblem, EconomicCluster, MaximumBudget, BulletproofPlan, BulletproofPhase, PhaseCurrency,
  PricingSummary, ScarcityElement, RiskReversal, OfferIdentity,
} from '@/lib/wizard-v2/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function rowsOf<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[]
  if (r && typeof r === 'object' && 'rows' in r) {
    const x = (r as { rows: unknown }).rows
    if (Array.isArray(x)) return x as T[]
  }
  return []
}

export default async function WizardV2PreviewPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/auth/login?next=/dashboard/frameworks/b2b-angebote/wizard-v2-preview')
  }

  await ensureBauplanV2Tables()
  await ensureCompanyProfile()

  let drafts = rowsOf<Record<string, unknown>>(
    await db.execute(sql`SELECT id, current_step_key, maximum_budget FROM bauplan_drafts WHERE user_id = ${session.user.id} AND product_slug = 'b2b-angebote' ORDER BY created_at DESC LIMIT 1`)
  )
  if (drafts.length === 0) {
    drafts = rowsOf<Record<string, unknown>>(
      await db.execute(sql`INSERT INTO bauplan_drafts (user_id) VALUES (${session.user.id}) RETURNING id, current_step_key, maximum_budget`)
    )
  }
  const draft = drafts[0]!
  const draftId = draft.id as string

  // Parallel data loading
  const [profileRows, bcRows, productRows, blockRows, icpRows, challengeRows, cardRows, futureRows, clusterRows, planRows, phaseCurrencyRows, pricingRows, scarcityRows, reversalRows, identityRows, stepCountRows] = await Promise.all([
    db.execute(sql`SELECT organisation_name, website FROM company_profile WHERE user_id = ${session.user.id} LIMIT 1`),
    db.execute(sql`SELECT market_position, target_market, business_model, business_model_free_text, competitive_positioning FROM bauplan_business_context WHERE bauplan_id = ${draftId} LIMIT 1`),
    db.execute(sql`SELECT product_name, product_type, product_summary, product_url, product_stage FROM bauplan_product WHERE bauplan_id = ${draftId} LIMIT 1`),
    db.execute(sql`SELECT id, name, description, is_bonus, "order" FROM bauplan_building_blocks WHERE bauplan_id = ${draftId} ORDER BY is_bonus ASC, "order" ASC`),
    db.execute(sql`SELECT demographics, currencies, pains_gains, interview_contacts FROM bauplan_icp WHERE bauplan_id = ${draftId} LIMIT 1`),
    db.execute(sql`SELECT id, type, topic, reality, economic_impact, kpi, "order" FROM bauplan_challenges WHERE bauplan_id = ${draftId} ORDER BY type ASC, "order" ASC`),
    db.execute(sql`SELECT id, building_block_id, "column", text FROM bauplan_beef_radar_cards WHERE bauplan_id = ${draftId}`),
    db.execute(sql`SELECT id, problem, trigger, solved_through, solved_through_free_text, marginal_cost, "order" FROM bauplan_future_problems WHERE bauplan_id = ${draftId} ORDER BY "order" ASC`),
    db.execute(sql`SELECT id, cluster_name, economic_value_per_unit, unit, confidence_level, methodology, contained_cards, "order" FROM bauplan_economic_clusters WHERE bauplan_id = ${draftId} ORDER BY "order" ASC`),
    db.execute(sql`SELECT name, starting_pain, start_symptoms, end_goal, end_proof_points, headline_promise, phases FROM bauplan_bulletproof_plans WHERE bauplan_id = ${draftId} LIMIT 1`),
    db.execute(sql`SELECT id, phase_id, metric, unit, baseline, pessimistic, realistic, optimistic, measured_at, is_primary FROM bauplan_phase_currencies WHERE bauplan_id = ${draftId}`),
    db.execute(sql`SELECT tiers, marktest_reasoning, anti_glatt_check FROM bauplan_pricing WHERE bauplan_id = ${draftId} LIMIT 1`),
    db.execute(sql`SELECT scarcity_type, scarcity_reason, scarcity_proof, is_real FROM bauplan_scarcity WHERE bauplan_id = ${draftId} LIMIT 1`),
    db.execute(sql`SELECT reversal_type, trigger_condition, consequence, anchor_phase_id, anchor_currency_id, espresso_test, refund_deadline FROM bauplan_risk_reversal WHERE bauplan_id = ${draftId} LIMIT 1`),
    db.execute(sql`SELECT name, subheadline, headline, cta, cta_secondary, generated_variants FROM bauplan_offer_identity WHERE bauplan_id = ${draftId} LIMIT 1`),
    db.execute(sql`SELECT COUNT(*)::text as count FROM bauplan_step_states WHERE bauplan_id = ${draftId} AND status = 'completed'`),
  ])

  const profile = rowsOf<Record<string, unknown>>(profileRows)[0] ?? null
  const bcRow = rowsOf<Record<string, unknown>>(bcRows)[0]
  const productRow = rowsOf<Record<string, unknown>>(productRows)[0]
  const icpRow = rowsOf<Record<string, unknown>>(icpRows)[0]
  const planRow = rowsOf<Record<string, unknown>>(planRows)[0]
  const pricingRow = rowsOf<Record<string, unknown>>(pricingRows)[0]
  const scarcityRow = rowsOf<Record<string, unknown>>(scarcityRows)[0]
  const reversalRow = rowsOf<Record<string, unknown>>(reversalRows)[0]
  const identityRow = rowsOf<Record<string, unknown>>(identityRows)[0]

  const businessContext: BusinessContext | null = bcRow ? {
    marketPosition: (bcRow.market_position as string) ?? '',
    targetMarket: (bcRow.target_market as string) ?? '',
    businessModel: ((bcRow.business_model as BusinessContext['businessModel']) ?? 'hybrid'),
    businessModelFreeText: (bcRow.business_model_free_text as string) ?? '',
    competitivePositioning: (bcRow.competitive_positioning as string) ?? '',
  } : null

  const product: ProductOrService | null = productRow ? {
    productName: (productRow.product_name as string) ?? '',
    productType: ((productRow.product_type as ProductOrService['productType']) ?? 'programm'),
    productSummary: (productRow.product_summary as string) ?? '',
    productUrl: (productRow.product_url as string) ?? '',
    productStage: ((productRow.product_stage as ProductOrService['productStage']) ?? 'pilot'),
  } : null

  const blocks: BuildingBlock[] = rowsOf<Record<string, unknown>>(blockRows).map((r) => ({
    id: r.id as string, name: r.name as string, description: (r.description as string) ?? '',
    isBonus: Boolean(r.is_bonus), order: (r.order as number) ?? 0,
  }))

  const icp: ICP | null = icpRow ? {
    demographics: (icpRow.demographics ?? {}) as ICP['demographics'],
    currencies: (icpRow.currencies ?? []) as ICP['currencies'],
    painsGains: (icpRow.pains_gains ?? []) as ICP['painsGains'],
    interviewContacts: (icpRow.interview_contacts ?? []) as ICP['interviewContacts'],
  } : null

  const challengesOutcomes: ChallengeOrOutcome[] = rowsOf<Record<string, unknown>>(challengeRows).map((r) => ({
    id: r.id as string, type: r.type as ChallengeOrOutcome['type'], topic: r.topic as string,
    reality: (r.reality as string) ?? '', economicImpact: (r.economic_impact as string) ?? '',
    kpi: (r.kpi as string) ?? '', order: (r.order as number) ?? 0, createdBy: 'user' as const,
  }))

  const beefCards: BeefRadarCard[] = rowsOf<Record<string, unknown>>(cardRows).map((r) => ({
    id: r.id as string, buildingBlockId: r.building_block_id as string,
    column: r.column as 'what' | 'how' | 'why', text: (r.text as string) ?? '',
  }))

  const futureProblems: FutureProblem[] = rowsOf<Record<string, unknown>>(futureRows).map((r) => ({
    id: r.id as string, problem: r.problem as string, trigger: (r.trigger as string) ?? '',
    solvedThrough: (r.solved_through as string) ?? undefined,
    solvedThroughFreeText: (r.solved_through_free_text as string) ?? undefined,
    marginalCost: (r.marginal_cost as string) ?? undefined, order: (r.order as number) ?? 0,
  }))

  const clusters: EconomicCluster[] = rowsOf<Record<string, unknown>>(clusterRows).map((r) => ({
    id: r.id as string, clusterName: r.cluster_name as string,
    economicValuePerUnit: Number(r.economic_value_per_unit ?? 0),
    unit: r.unit as EconomicCluster['unit'],
    confidenceLevel: r.confidence_level as EconomicCluster['confidenceLevel'],
    methodology: (r.methodology as string) ?? '',
    containedCards: (r.contained_cards ?? []) as EconomicCluster['containedCards'],
    order: (r.order as number) ?? 0,
  }))

  const maximumBudget: MaximumBudget | null = (draft.maximum_budget as MaximumBudget) ?? null

  const plan: BulletproofPlan | null = planRow ? {
    name: (planRow.name as string) ?? '',
    startingPain: (planRow.starting_pain as string) ?? '',
    startSymptoms: (planRow.start_symptoms ?? []) as string[],
    endGoal: (planRow.end_goal as string) ?? '',
    endProofPoints: (planRow.end_proof_points ?? []) as string[],
    headlinePromise: (planRow.headline_promise as string) ?? '',
    phases: (planRow.phases ?? []) as BulletproofPhase[],
  } : null

  const phaseCurrencies: PhaseCurrency[] = rowsOf<Record<string, unknown>>(phaseCurrencyRows).map((r) => ({
    id: r.id as string, phaseId: r.phase_id as string, metric: r.metric as string,
    unit: (r.unit as string) ?? '', baseline: (r.baseline as string) ?? '',
    pessimistic: (r.pessimistic as string) ?? '', realistic: (r.realistic as string) ?? '',
    optimistic: (r.optimistic as string) ?? '', measuredAt: (r.measured_at as string) ?? '',
    isPrimary: Boolean(r.is_primary),
  }))

  const pricing: PricingSummary | null = pricingRow ? {
    tiers: (pricingRow.tiers ?? []) as PricingSummary['tiers'],
    marktestReasoning: (pricingRow.marktest_reasoning as string) ?? '',
    antiGlattCheck: Boolean(pricingRow.anti_glatt_check),
  } : null

  const scarcity: ScarcityElement | null = scarcityRow ? {
    scarcityType: scarcityRow.scarcity_type as ScarcityElement['scarcityType'],
    scarcityReason: (scarcityRow.scarcity_reason as string) ?? '',
    scarcityProof: (scarcityRow.scarcity_proof ?? {}) as ScarcityElement['scarcityProof'],
    isReal: Boolean(scarcityRow.is_real),
  } : null

  const riskReversal: RiskReversal | null = reversalRow ? {
    reversalType: reversalRow.reversal_type as RiskReversal['reversalType'],
    triggerCondition: (reversalRow.trigger_condition as string) ?? '',
    consequence: (reversalRow.consequence as string) ?? '',
    anchorPhaseId: (reversalRow.anchor_phase_id as string) ?? undefined,
    anchorCurrencyId: (reversalRow.anchor_currency_id as string) ?? undefined,
    espressoTest: Boolean(reversalRow.espresso_test),
    refundDeadline: (reversalRow.refund_deadline as number) ?? undefined,
  } : null

  const identity: OfferIdentity | null = identityRow ? {
    name: (identityRow.name as string) ?? '',
    subheadline: (identityRow.subheadline as string) ?? undefined,
    headline: (identityRow.headline as string) ?? '',
    cta: (identityRow.cta as string) ?? '',
    ctaSecondary: (identityRow.cta_secondary as string) ?? undefined,
    generatedVariants: (identityRow.generated_variants ?? []) as OfferIdentity['generatedVariants'],
  } : null

  const stepsCompleted = parseInt(rowsOf<{ count: string }>(stepCountRows)[0]?.count ?? '0', 10)

  return (
    <WizardV2Layout stepsCompleted={stepsCompleted} currentStepKey={draft.current_step_key as string}>
      <WelcomeStepV2 draftId={draftId} initialOrgName={(profile?.organisation_name as string) ?? ''} initialWebsite={(profile?.website as string) ?? ''} />
      <Step01BusinessProductBlocks draftId={draftId} initialBusinessContext={businessContext} initialProduct={product} initialBlocks={blocks} />
      <Step02ICP draftId={draftId} initialICP={icp} />
      <Step03ChallengesOutcomes draftId={draftId} initialItems={challengesOutcomes} />
      <Step04BeefRadar draftId={draftId} buildingBlocks={blocks} initialCards={beefCards} />
      <Step05FutureProblems draftId={draftId} buildingBlocks={blocks} initialProblems={futureProblems} />
      <Step06EconomicCluster draftId={draftId} initialClusters={clusters} initialMaximumBudget={maximumBudget} />
      <Step07BulletproofPlan draftId={draftId} initialPlan={plan} />
      <Step08PhaseCurrencies draftId={draftId} phases={plan?.phases ?? []} initialCurrencies={phaseCurrencies} />
      <Step09Preis draftId={draftId} initialPricing={pricing} maximumBudget={maximumBudget?.primaryValue} />
      <Step10Scarcity draftId={draftId} initialScarcity={scarcity} />
      <Step11RiskReversal draftId={draftId} initialReversal={riskReversal} />
      <Step12NameHeadline draftId={draftId} initialIdentity={identity} />

      <section className="bg-[#0A0D14] px-6 py-20 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-4xl">Bauplan komplett.</h2>
          <p className="mt-4 text-base opacity-80">Du hast alle 13 Schritte durchgespielt. PDF-Export + Offer-OnePager kommen als nächste Welle.</p>
        </div>
      </section>
    </WizardV2Layout>
  )
}
