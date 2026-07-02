import { notFound } from 'next/navigation'
import Image from 'next/image'
import { getOfferBySalt, recordOfferEvent } from '@/lib/db/queries/offers'
import { getSetting } from '@/lib/db/queries/settings'
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
import { ReadProgress } from '@/components/offer/output/ReadProgress'
import { GuaranteeBox } from '@/components/offer/output/GuaranteeBox'
import { AboutUsFooter } from '@/components/offer/output/AboutUsFooter'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface OfferFull {
  id: string
  offer_number: string
  customer_name: string
  customer_company: string | null
  customer_email: string | null
  customer_logo_url?: string | null
  access_salt: string
  title: string
  subtitle: string | null
  tagline: string | null
  understanding_section: UnderstandingData | null
  empathy_section: EmpathyData | null
  programs: ProgramSummary[] | null
  economic_results: EconomicResult[] | null
  guarantee_text?: string | null
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

  // Calendly URLs from DB settings (with hardcoded fallback)
  const [markusCalendly, aljonaCalendly] = await Promise.all([
    getSetting('calendly.markus', '/schedule/markus/kennenlernen-45').catch(() => '/schedule/markus/kennenlernen-45'),
    getSetting('calendly.aljona', '/schedule/aljona/kennenlernen-45').catch(() => '/schedule/aljona/kennenlernen-45'),
  ])

  const validUntilDate = new Date(offer.valid_until)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>
      <ReadProgress color="#1A5FD4" />

      {/* Slim Topbar — EF-Logo + Offer-No on right */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Image src="/ef-logo.png" alt="Eilers+Friends" width={160} height={40} className="h-9 w-auto object-contain" priority />
          <div className="text-right">
            <span className="block text-[10px] font-mono text-gray-400">{offer.offer_number}</span>
            <span className="block text-[10px] text-gray-400">
              Gültig bis {validUntilDate.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
      </header>

      {/* Premium offer narrative — same components as before, now used end-to-end */}
      <main>
        <OfferHero
          offerNumber={offer.offer_number}
          title={offer.title}
          subtitle={offer.subtitle}
          tagline={offer.tagline}
          customerName={offer.customer_name}
          customerCompany={offer.customer_company}
          customerLogoUrl={offer.customer_logo_url}
          validUntil={validUntilDate}
        />

        {offer.understanding_section && (
          <OfferUnderstanding data={offer.understanding_section} />
        )}

        {offer.empathy_section && (
          <OfferEmpathy data={offer.empathy_section} />
        )}

        {offer.economic_results && offer.economic_results.length > 0 && (
          <OfferEconomicResults results={offer.economic_results} />
        )}

        <GuaranteeBox text={offer.guarantee_text ?? undefined} />

        {offer.programs && offer.programs.length > 0 && (
          <OfferPricing programs={offer.programs} selectedOption={offer.selected_pricing_option} />
        )}

        <OfferAcceptCta offerSecret={offer.access_salt} status={offer.status} />

        <AboutUsFooter markusCalendly={markusCalendly} aljonaCalendly={aljonaCalendly} />
      </main>

      <footer className="border-t border-gray-100 bg-white py-8 text-center text-xs text-gray-400">
        Eilers+Friends · {offer.offer_number} · Vertraulich · {new Date(offer.valid_from).toLocaleDateString('de-DE')}
      </footer>
    </div>
  )
}
