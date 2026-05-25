import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { ensureBauplanV2Tables } from '@/lib/db/self-heal-v2'
import { ensureCompanyProfile } from '@/lib/db/self-heal'
import { WizardV2Layout } from '@/components/wizard-v2/WizardV2Layout'
import { WelcomeStepV2 } from '@/components/wizard-v2/WelcomeStepV2'

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

  // Count completed steps (stub: only welcome counts for now)
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
      {/* Stubs für Step 01-12 kommen in den nächsten Commits */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="mb-4 inline-block rounded-full bg-amber-bg px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber">
            v2-Preview · Welcome live · 12 weitere Steps in Arbeit
          </span>
          <p className="mt-4 text-base leading-relaxed text-muted">
            Welcome ist funktional (URL → Scan → Profile speichern). Step 01–12 kommen in den nächsten Commits. Bis dahin nutze v1 unter /dashboard/frameworks/b2b-angebote/wizard.
          </p>
        </div>
      </section>
    </WizardV2Layout>
  )
}
