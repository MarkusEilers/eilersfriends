import { notFound } from 'next/navigation'
import Image from 'next/image'
import { getOfferBySalt, recordOfferEvent } from '@/lib/db/queries/offers'
import {
  OfferHero,
  OfferUnderstanding,
  OfferEmpathy,
  OfferEconomicResults,
  OfferPricing,
  OfferAcceptCta,
  type UnderstandingData,
  type EmpathyData,
  type EconomicResult,
  type ProgramSummary,
} from '@/components/offer/sections'

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
  section_order: Array<{ id: string; type: string; enabled: boolean }> | null
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

  const validUntil = new Date(offer.valid_until)
  const understanding: UnderstandingData = offer.understanding_section ?? {}
  const empathy: EmpathyData = offer.empathy_section ?? {}
  const programs: ProgramSummary[] = offer.programs ?? []
  const economic: EconomicResult[] = offer.economic_results ?? []

  // Default section order — admin can override via offer.section_order later
  const sectionOrder = offer.section_order && offer.section_order.length > 0
    ? offer.section_order.filter((s) => s.enabled).map((s) => s.type)
    : ['understanding', 'empathy', 'economic_results', 'pricing', 'accept']

  const sectionMap: Record<string, React.ReactNode> = {
    understanding:     <OfferUnderstanding data={understanding} />,
    empathy:           <OfferEmpathy data={empathy} />,
    economic_results:  <OfferEconomicResults results={economic} />,
    pricing:           <OfferPricing programs={programs} selectedOption={offer.selected_pricing_option} />,
    accept:            <OfferAcceptCta offerSecret={offer.access_salt} status={offer.status} />,
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>
      {/* Slim header — no marketing nav */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Image src="/ef-logo.png" alt="Eilers+Friends" width={160} height={40} className="h-10 w-auto object-contain" priority />
          <span className="text-[10px] font-mono text-gray-400">{offer.offer_number}</span>
        </div>
      </header>

      <OfferHero
        offerNumber={offer.offer_number}
        title={offer.title}
        subtitle={offer.subtitle}
        tagline={offer.tagline}
        customerName={offer.customer_name}
        validUntil={validUntil}
      />

      {sectionOrder.map((key) => (
        <div key={key}>{sectionMap[key]}</div>
      ))}

      <footer className="border-t border-gray-100 bg-white py-8 text-center text-xs text-gray-400">
        Eilers+Friends · {offer.offer_number} · Vertraulich · {new Date(offer.valid_from).toLocaleDateString('de-DE')}
      </footer>
    </div>
  )
}
