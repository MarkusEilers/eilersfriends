import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { ensureBauplanV2Tables } from '@/lib/db/self-heal-v2'
import { ensureCompanyProfile } from '@/lib/db/self-heal'
import { WizardV2Layout } from '@/components/wizard-v2/WizardV2Layout'
import { WelcomeStepV2 } from '@/components/wizard-v2/WelcomeStepV2'
import { Step01BusinessProductBlocks } from '@/components/wizard-v2/Step01BusinessProductBlocks'
import type { BusinessContext, ProductOrService, BuildingBlock } from '@/lib/wizard-v2/types'

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

  // Get or create draft
  let drafts = rowsOf<Record<string, unknown>>(
    await db.execute(sql`
      SELECT id, current_step_key FROM bauplan_drafts
      WHERE user_id = ${session.user.id} AND product_slug = 'b2b-angebote'
      ORDER BY created_at DESC LIMIT 1
    `)
  )
  if (drafts.length === 0) {
    drafts = rowsOf<Record<string, unknown>>(
      await db.execute(sql`
        INSERT INTO bauplan_drafts (user_id) VALUES (${session.user.id})
        RETURNING id, current_step_key
      `)
    )
  }
  const draft = drafts[0]!
  const draftId = draft.id as string

  // Get welcome profile if exists
  const profileRows = rowsOf<Record<string, unknown>>(
    await db.execute(sql`
      SELECT organisation_name, website FROM company_profile
      WHERE user_id = ${session.user.id} LIMIT 1
    `)
  )
  const profile = profileRows[0] ?? null

  // Load Step 01 data
  const bcRows = rowsOf<Record<string, unknown>>(
    await db.execute(sql`
      SELECT market_position, target_market, business_model, business_model_free_text, competitive_positioning
      FROM bauplan_business_context WHERE bauplan_id = ${draftId} LIMIT 1
    `)
  )
  const productRows = rowsOf<Record<string, unknown>>(
    await db.execute(sql`
      SELECT product_name, product_type, product_summary, product_url, product_stage
      FROM bauplan_product WHERE bauplan_id = ${draftId} LIMIT 1
    `)
  )
  const blockRows = rowsOf<Record<string, unknown>>(
    await db.execute(sql`
      SELECT id, name, description, is_bonus, "order"
      FROM bauplan_building_blocks WHERE bauplan_id = ${draftId}
      ORDER BY is_bonus ASC, "order" ASC
    `)
  )

  const businessContext: BusinessContext | null = bcRows[0]
    ? {
        marketPosition: (bcRows[0].market_position as string) ?? '',
        targetMarket: (bcRows[0].target_market as string) ?? '',
        businessModel: ((bcRows[0].business_model as BusinessContext['businessModel']) ?? 'hybrid'),
        businessModelFreeText: (bcRows[0].business_model_free_text as string) ?? '',
        competitivePositioning: (bcRows[0].competitive_positioning as string) ?? '',
      }
    : null

  const product: ProductOrService | null = productRows[0]
    ? {
        productName: (productRows[0].product_name as string) ?? '',
        productType: ((productRows[0].product_type as ProductOrService['productType']) ?? 'programm'),
        productSummary: (productRows[0].product_summary as string) ?? '',
        productUrl: (productRows[0].product_url as string) ?? '',
        productStage: ((productRows[0].product_stage as ProductOrService['productStage']) ?? 'pilot'),
      }
    : null

  const blocks: BuildingBlock[] = blockRows.map((r) => ({
    id: r.id as string,
    name: r.name as string,
    description: (r.description as string) ?? '',
    isBonus: Boolean(r.is_bonus),
    order: (r.order as number) ?? 0,
  }))

  // Count completed steps
  const stepsCompletedRows = rowsOf<{ count: string }>(
    await db.execute(sql`
      SELECT COUNT(*)::text as count FROM bauplan_step_states
      WHERE bauplan_id = ${draftId} AND status = 'completed'
    `)
  )
  const stepsCompleted = parseInt(stepsCompletedRows[0]?.count ?? '0', 10)

  return (
    <WizardV2Layout stepsCompleted={stepsCompleted} currentStepKey={draft.current_step_key as string}>
      <WelcomeStepV2
        draftId={draftId}
        initialOrgName={(profile?.organisation_name as string) ?? ''}
        initialWebsite={(profile?.website as string) ?? ''}
      />

      <Step01BusinessProductBlocks
        draftId={draftId}
        initialBusinessContext={businessContext}
        initialProduct={product}
        initialBlocks={blocks}
      />

      {/* Stubs für Step 02-12 kommen in den nächsten Commits */}
      <section className="bg-cream px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="mb-4 inline-block rounded-full bg-amber-bg px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber">
            v2-Preview · Welcome + Step 01 live · 11 weitere Steps in Arbeit
          </span>
          <p className="mt-4 text-base leading-relaxed text-muted">
            Step 02 (ICP), 03 (Herausforderungen + Ergebnisse), 04 (Beef-Radar), 05 (Future Problems), 06 (Wirtschaftliche Bewertung), 07 (Bulletproof Plan), 08 (Currencies pro Phase), 09 (Preis), 10 (Scarcity), 11 (Risk-Reversal), 12 (Name + Headline) — kommen in den nächsten Commits.
          </p>
        </div>
      </section>
    </WizardV2Layout>
  )
}
