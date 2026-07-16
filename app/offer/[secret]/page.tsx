import type * as React from 'react'
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
  OfferNewEra,
  OfferIngredients,
  OfferTimeline,
  OfferTrack,
  type UnderstandingData,
  type EmpathyData,
  type EconomicResult,
  type ProgramSummary,
} from '@/components/offer/sections'
import { OfferAcceptCart } from '@/components/offer/OfferAcceptCart'
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
  section_order?: { type: string; enabled: boolean }[] | null
  payment_card_enabled?: boolean | null
  payment_invoice_enabled?: boolean | null
  rhythm_monthly_enabled?: boolean | null
  rhythm_upfront_enabled?: boolean | null
  upfront_discount_pct?: number | string | null
  track?: { name: string; goal?: string; steps?: { title: string; durationH?: number | string; description?: string; teams?: string[]; inputs?: string[]; outputs?: string[] }[] }[] | null
}

export default async function PublicOfferPage({ params, searchParams }: { params: Promise<{ secret: string }>; searchParams: Promise<{ pending?: string; accepted?: string; error?: string }> }) {
  const { secret } = await params
  const sp = await searchParams
  const offer = (await getOfferBySalt(secret)) as unknown as OfferFull | null
  if (!offer) notFound()

  // Best-effort viewed-tracking
  if (offer.status === 'sent') {
    recordOfferEvent(offer.id, 'viewed').catch(() => {})
  }

  // Calendly URLs from DB settings (with hardcoded fallback)
  const [markusCalendly, aljonaCalendly] = await Promise.all([
    getSetting('calendly.markus', '/schedule/markus/kennenlernen-30').catch(() => '/schedule/markus/kennenlernen-30'),
    getSetting('calendly.aljona', '/schedule/aljona').catch(() => '/schedule/aljona'),
  ])

  // Section renderer — mirrors the backend preview. Order + enabled come from
  // offer.section_order (Drag&Drop im Editor); Fallback = Default-Reihenfolge.
  const DEFAULT_ORDER = ['understanding', 'empathy', 'newEra', 'ingredients', 'track', 'timeline', 'economic', 'pricing', 'accept']
  const rawOrder = Array.isArray(offer.section_order) && offer.section_order.length
    ? offer.section_order
    : DEFAULT_ORDER.map((type) => ({ type, enabled: true }))
  const enabled = rawOrder.filter((sec) => sec.enabled).map((sec) => sec.type)
  // Neu hinzugekommene Default-Blöcke (z.B. 'track') ergänzen, wenn sie in einer
  // älteren gespeicherten section_order noch fehlen — an ihrer natürlichen Position.
  const present = new Set(enabled)
  DEFAULT_ORDER.forEach((type, i) => {
    if (present.has(type)) return
    let insertAt = enabled.length
    for (let j = i - 1; j >= 0; j--) { const idx = enabled.indexOf(DEFAULT_ORDER[j]); if (idx >= 0) { insertAt = idx + 1; break } }
    enabled.splice(insertAt, 0, type)
    present.add(type)
  })
  const sectionOrder = enabled.map((type) => ({ type }))
  const timelinePhases = (offer.programs?.[0]?.pricing ?? []).map((o) => ({ title: o.title, description: o.description }))
  const sectionNodes: Record<string, React.ReactNode> = {
    understanding: offer.understanding_section ? <OfferUnderstanding key="understanding" data={offer.understanding_section} /> : null,
    empathy: offer.empathy_section ? <OfferEmpathy key="empathy" data={offer.empathy_section} /> : null,
    newEra: <OfferNewEra key="newEra" text={offer.empathy_section?.successMessage} />,
    ingredients: <OfferIngredients key="ingredients" />,
    track: (offer.track && offer.track.length) ? <OfferTrack key="track" phases={offer.track} /> : null,
    timeline: timelinePhases.length ? <OfferTimeline key="timeline" phases={timelinePhases} /> : null,
    economic: offer.economic_results && offer.economic_results.length > 0 ? <OfferEconomicResults key="economic" results={offer.economic_results} /> : null,
    pricing: (offer.programs && offer.programs.length > 0)
      ? <div key="pricing"><GuaranteeBox text={offer.guarantee_text ?? undefined} /><OfferPricing programs={offer.programs} selectedOption={offer.selected_pricing_option} /></div>
      : null,
    accept: sp?.pending ? (
      <section key="accept" className="px-6 py-20" style={{ backgroundColor: '#0F1E3A' }}>
        <div className="mx-auto max-w-2xl text-center text-white">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(93,219,245,0.15)' }}>
            <span style={{ color: '#5DDBF5', fontSize: 26 }}>✉</span>
          </div>
          <h2 className="mt-5 text-2xl font-bold">Fast geschafft — bitte E-Mail bestätigen.</h2>
          <p className="mt-3 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Wir haben dir eine E-Mail zur Bestätigung der Annahme geschickt. Mit einem Klick darin wird das Angebot verbindlich angenommen.
          </p>
        </div>
      </section>
    ) : (<OfferAcceptCart key="accept"
      offerSecret={offer.access_salt}
      status={offer.status}
      noticeDomain={sp?.error === 'domain'}
      programs={offer.programs ?? []}
      paymentCardEnabled={offer.payment_card_enabled ?? false}
      paymentInvoiceEnabled={offer.payment_invoice_enabled ?? true}
      rhythmUpfrontEnabled={offer.rhythm_upfront_enabled ?? true}
      rhythmMonthlyEnabled={offer.rhythm_monthly_enabled ?? true}
      upfrontDiscountPct={offer.upfront_discount_pct != null ? Number(offer.upfront_discount_pct) : 0}
      customerName={offer.customer_name}
      customerEmail={offer.customer_email}
    />),
  }

  const validUntilDate = new Date(offer.valid_until)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>
      <ReadProgress color="#1A5FD4" />

      {/* Slim Topbar — EF-Logo + Offer-No on right */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Image src="/ef-logo.png" alt="Eilers+Friends" width={200} height={56} className="h-14 md:h-16 w-auto object-contain" priority />
          <div className="text-right">
            <span className="block text-[10px] font-mono text-gray-400">{offer.offer_number}</span>
            <span className="block text-[10px] text-gray-400">
              Gültig bis {validUntilDate.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
      </header>

      {/* Premium offer narrative — driven by section_order (mirrors backend preview) */}
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

        {sectionOrder.map(({ type }) => sectionNodes[type]).filter(Boolean)}

        <AboutUsFooter markusCalendly={markusCalendly} aljonaCalendly={aljonaCalendly} customerName={offer.customer_name} offerLabel={offer.offer_number} />
      </main>

      <footer className="border-t border-gray-100 bg-white py-8 text-center text-xs text-gray-400">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <span>© {new Date().getFullYear()} Eilers+Friends</span>
          <span aria-hidden="true">·</span>
          <a href="/impressum" className="hover:text-gray-600 hover:underline">Impressum</a>
          <span aria-hidden="true">·</span>
          <a href="/datenschutz" className="hover:text-gray-600 hover:underline">Datenschutz</a>
        </div>
        <div className="mt-2">{offer.offer_number} · Vertraulich · {new Date(offer.valid_from).toLocaleDateString('de-DE')}</div>
      </footer>
    </div>
  )
}
