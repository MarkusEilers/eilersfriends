import { notFound } from 'next/navigation'
import { getOfferBySalt, recordOfferEvent } from '@/lib/db/queries/offers'
import Image from 'next/image'
import { Sparkles, CalendarCheck } from 'lucide-react'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default async function PublicOfferPage({ params }: { params: Promise<{ secret: string }> }) {
  const { secret } = await params
  const offer = await getOfferBySalt(secret)
  if (!offer) notFound()

  // Mark as viewed on first GET (best-effort — does not block render)
  if (offer.status === 'sent') {
    recordOfferEvent(offer.id, 'viewed').catch(() => {})
  }

  const valid = new Date(offer.valid_until)
  const validStr = valid.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>
      {/* Slim header — no full marketing nav */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Image src="/ef-logo.png" alt="Eilers+Friends" width={160} height={40} className="h-10 w-auto object-contain" priority />
          <span className="text-[10px] font-mono text-gray-400">{offer.offer_number}</span>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-20" style={{ background: 'linear-gradient(180deg, #0F1E3A 0%, #15315E 100%)' }}>
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em]"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#FFC93C', border: '1px solid rgba(255,201,60,0.35)' }}>
            <Sparkles size={12} /> Persönliches Angebot für {offer.customer_name}
          </span>
          <h1 className="mt-6 text-4xl font-bold text-white sm:text-5xl">{offer.title}</h1>
          {offer.subtitle && (
            <p className="mt-4 text-lg" style={{ color: 'rgba(255,255,255,0.8)' }}>{offer.subtitle}</p>
          )}
          {offer.tagline && (
            <p className="mt-2 text-base italic" style={{ color: 'rgba(255,255,255,0.6)' }}>{offer.tagline}</p>
          )}
          <p className="mt-6 inline-flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <CalendarCheck size={12} /> Gültig bis {validStr}
          </p>
        </div>
      </section>

      {/* Placeholder body — Wave 2 Phase 2 brings the full section composition */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
            <p className="text-base font-semibold text-gray-700">
              Das vollständige Angebot wird gerade fertiggestellt.
            </p>
            <p className="mt-3 text-sm text-gray-500">
              {offer.customer_name}, in den nächsten Tagen findest Du hier den kompletten Vorschlag inkl. Programmen, Phasen, Timeline und Investment.
              Markus oder Aljona melden sich persönlich.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-8 text-center text-xs text-gray-400">
        Eilers+Friends · {offer.offer_number} · Vertraulich
      </footer>
    </div>
  )
}
