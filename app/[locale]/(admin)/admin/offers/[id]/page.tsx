import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { getOfferById } from '@/lib/db/queries/offers'
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
    const res = await db.execute<{ id: string; name: string; slug: string; status: string }>(
      sql`SELECT id, name, slug, status FROM programs WHERE status IN ('published', 'draft') ORDER BY name`,
    )
    return (res as unknown as Array<{ id: string; name: string; slug: string; status: string }>).map((p) => ({
      id: p.id, name: p.name, slug: p.slug, status: p.status,
    }))
  } catch {
    return []
  }
}

export default async function AdminOfferEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [offer, programs] = await Promise.all([
    getOfferById(id),
    listProgramsForSelect(),
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
  }

  return <OfferEditor initial={initial} accessSalt={full.access_salt} offerNumber={full.offer_number} programOptions={programs} />
}
