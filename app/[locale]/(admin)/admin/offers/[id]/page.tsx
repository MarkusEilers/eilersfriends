import { notFound } from 'next/navigation'
import { getOfferById } from '@/lib/db/queries/offers'
import { OfferEditor, type OfferEditorState } from '@/components/admin/OfferEditor'

export const dynamic = 'force-dynamic'

interface JsonRow {
  understanding_section: unknown
  empathy_section: unknown
  economic_results: unknown
  programs: unknown
}

export default async function AdminOfferEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const offer = (await getOfferById(id)) as (Awaited<ReturnType<typeof getOfferById>> & JsonRow) | null
  if (!offer) notFound()

  const initial: OfferEditorState = {
    id: offer.id,
    title: offer.title,
    subtitle: offer.subtitle ?? '',
    tagline: offer.tagline ?? '',
    customerName: offer.customer_name,
    customerCompany: offer.customer_company ?? '',
    customerEmail: offer.customer_email ?? '',
    understanding: (offer.understanding_section as OfferEditorState['understanding']) ?? {},
    empathy: (offer.empathy_section as OfferEditorState['empathy']) ?? {},
    economic: (offer.economic_results as OfferEditorState['economic']) ?? [],
    programs: (offer.programs as OfferEditorState['programs']) ?? [],
    status: offer.status,
  }

  return <OfferEditor initial={initial} accessSalt={offer.access_salt} offerNumber={offer.offer_number} />
}
