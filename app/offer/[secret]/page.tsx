import { notFound } from 'next/navigation'
import Image from 'next/image'
import { getOfferBySalt, recordOfferEvent } from '@/lib/db/queries/offers'
import { OfferPreview } from '@/components/admin/OfferPreview'
import { OfferAcceptCta, type UnderstandingData, type EmpathyData, type EconomicResult, type ProgramSummary } from '@/components/offer/sections'
import type { OfferEditorState } from '@/components/admin/OfferEditor'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface OfferFull {
  id: string
  offer_number: string
  customer_name: string
  customer_company: string | null
  customer_email: string | null
  access_salt: string
  title: string
  subtitle: string | null
  tagline: string | null
  understanding_section: UnderstandingData | null
  empathy_section: EmpathyData | null
  programs: ProgramSummary[] | null
  economic_results: EconomicResult[] | null
  valid_from: string
  valid_until: string
  status: string
  selected_pricing_option: string | null
}

export default async function PublicOfferPage({ params }: { params: Promise<{ secret: string }> }) {
  const { secret } = await params
  const offer = (await getOfferBySalt(secret)) as unknown as OfferFull | null
  if (!offer) notFound()

  // Best-effort viewed-tracking
  if (offer.status === 'sent') {
    recordOfferEvent(offer.id, 'viewed').catch(() => {})
  }

  const validUntil = new Date(offer.valid_until).toLocaleDateString('de-DE', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  // Map OfferFull → OfferEditorState shape for OfferPreview
  const state: OfferEditorState = {
    id: offer.id,
    title: offer.title,
    subtitle: offer.subtitle ?? '',
    tagline: offer.tagline ?? '',
    customerName: offer.customer_name,
    customerCompany: offer.customer_company ?? '',
    customerEmail: offer.customer_email ?? '',
    understanding: (offer.understanding_section as OfferEditorState['understanding']) ?? {},
    empathy: (offer.empathy_section as OfferEditorState['empathy']) ?? {},
    economic: ((offer.economic_results as unknown as OfferEditorState['economic']) ?? []),
    programs: ((offer.programs as unknown as OfferEditorState['programs']) ?? []),
    status: offer.status,
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>
      {/* Slim header */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Image src="/ef-logo.png" alt="Eilers+Friends" width={160} height={40} className="h-10 w-auto object-contain" priority />
          <div className="text-right">
            <span className="block text-[10px] font-mono text-gray-400">{offer.offer_number}</span>
            <span className="block text-[10px] text-gray-400">Gültig bis {validUntil}</span>
          </div>
        </div>
      </header>

      {/* Main offer preview — same component as the admin live-preview to keep
          the WYSIWYG promise. */}
      <main className="mx-auto max-w-5xl px-6 py-10">
        <OfferPreview s={state} />

        <div className="mt-10">
          <OfferAcceptCta offerSecret={offer.access_salt} status={offer.status} />
        </div>
      </main>

      <footer className="border-t border-gray-100 bg-white py-8 text-center text-xs text-gray-400">
        Eilers+Friends · {offer.offer_number} · Vertraulich · {new Date(offer.valid_from).toLocaleDateString('de-DE')}
      </footer>
    </div>
  )
}
