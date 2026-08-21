import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { getOfferById, listSigners } from '@/lib/db/queries/offers'
import { listBlocks as listOfferBlocks } from '@/lib/db/queries/offer-blocks'
import { OfferEditor, type OfferEditorState, type ProgramOption } from '@/components/admin/OfferEditor'

export const dynamic = 'force-dynamic'

interface JsonRow {
  understanding_section: unknown
  empathy_section: unknown
  economic_results: unknown
  programs: unknown
  section_order: unknown
  recipient_role: string | null
  meeting_notes: string | null
  program_id: string | null
  ai_prompt: string | null
  sweat_equity_enabled: boolean | null
  sweat_equity_percent: number | null
}

async function listProgramsForSelect(): Promise<ProgramOption[]> {
  try {
    const res = await db.execute(sql`
      SELECT p.id, p.name, p.slug, p.is_published,
        COALESCE(
          (SELECT jsonb_agg(jsonb_build_object(
              'name', ph.name, 'goal', ph.goal,
              'steps', COALESCE((SELECT jsonb_agg(jsonb_build_object(
                    'title', st.title, 'description', st.description, 'durationH', st.duration_h,
                    'teams', COALESCE(st.meta->'teams','[]'::jsonb),
                    'inputs', COALESCE(st.meta->'inputs','[]'::jsonb),
                    'outputs', COALESCE(st.meta->'outputs','[]'::jsonb)
                  ) ORDER BY st.sort_order) FROM program_steps st WHERE st.phase_id = ph.id), '[]'::jsonb)
            ) ORDER BY ph.sort_order) FROM program_phases ph WHERE ph.program_id = p.id),
          NULLIF(p.track, '[]'::jsonb), '[]'::jsonb
        ) AS track
      FROM programs p ORDER BY p.name
    `)
    return (res as unknown as Array<{ id: string; name: string; slug: string; is_published: boolean; track: unknown }>).map((p) => ({
      id: p.id, name: p.name, slug: p.slug, status: p.is_published ? 'published' : 'draft',
      track: (Array.isArray(p.track) ? p.track : []) as ProgramOption['track'],
    }))
  } catch {
    return []
  }
}

export default async function AdminOfferEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [offer, programs, signers, blocks] = await Promise.all([
    getOfferById(id),
    listProgramsForSelect(),
    listSigners(id).catch(() => []),
    listOfferBlocks(id).catch(() => []),
  ])
  if (!offer) notFound()
  const full = offer as Awaited<ReturnType<typeof getOfferById>> & JsonRow

  const initial: OfferEditorState = {
    id: full.id,
    title: full.title,
    subtitle: full.subtitle ?? '',
    tagline: full.tagline ?? '',
    customerName: full.customer_name,
    customerCompany: full.customer_company ?? '',
    customerEmail: full.customer_email ?? '',
    understanding: (full.understanding_section as OfferEditorState['understanding']) ?? {},
    empathy: (full.empathy_section as OfferEditorState['empathy']) ?? {},
    economic: (full.economic_results as OfferEditorState['economic']) ?? [],
    programs: (full.programs as OfferEditorState['programs']) ?? [],
    sectionOrder: (full.section_order as OfferEditorState['sectionOrder']) ?? [],
    status: full.status,
    recipientRole: full.recipient_role ?? '',
    meetingNotes: full.meeting_notes ?? '',
    programId: full.program_id ?? null,
    aiPrompt: full.ai_prompt ?? '',
    sweatEquityEnabled: full.sweat_equity_enabled ?? false,
    sweatEquityPercent: full.sweat_equity_percent ?? null,
    customerLogoUrl: (full.customer_logo_url as string | null) ?? null,
    guaranteeText: (full.guarantee_text as string | null) ?? null,
    paymentCardEnabled: (full.payment_card_enabled as boolean | null) ?? false,
    paymentInvoiceEnabled: (full.payment_invoice_enabled as boolean | null) ?? true,
    rhythmMonthlyEnabled: (full.rhythm_monthly_enabled as boolean | null) ?? true,
    rhythmUpfrontEnabled: (full.rhythm_upfront_enabled as boolean | null) ?? true,
    upfrontDiscountPct: (full.upfront_discount_pct != null ? Number(full.upfront_discount_pct) : 0),
    track: (full.track as OfferEditorState['track']) ?? [],
    teamMembers: (full.team_members as string[] | null) ?? ['markus', 'aljona'],
    teamHeading: (full.team_heading as string | null) ?? null,
    heroImageUrl: (full.hero_image_url as string | null) ?? null,
    validUntil: full.valid_until ? new Date(full.valid_until as string).toISOString().slice(0, 10) : '',
    signingOrder: ((full.signing_order as string) === 'sequential' ? 'sequential' : 'parallel'),
    signers: signers as unknown as OfferEditorState['signers'],
    blocks: blocks as unknown as OfferEditorState['blocks'],
    guaranteeTiers: (full.guarantee_tiers as OfferEditorState['guaranteeTiers']) ?? [],
  }

  return <OfferEditor initial={initial} accessSalt={full.access_salt} offerNumber={full.offer_number} programOptions={programs} />
}
