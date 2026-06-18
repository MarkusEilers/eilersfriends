// app/[locale]/checkout/mystery-shopping/page.tsx
import { CheckoutForm } from '@/components/checkout/CheckoutForm'
import Image from 'next/image'
import { Check } from 'lucide-react'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SLUG = 'mystery-shopping'
const PRICE = 1 // Testphase. Live später: 297 (Anker 997) — nur diese Zahl + die TIERS-note ändern.
const INCLUDED = [
  'Ein 14-Seiten-Report: Auswertung über 13 wichtige Skills und 5 Dimensionen',
  'Individuelles Feedback für jede Person in Deinem Team',
  'Das wichtigste Werkzeug, das jetzt den Unterschied macht — gratis dazu',
]
const TIERS = [
  {
    id: 'mystery-onetime',
    label: 'Mystery Shopping',
    price: PRICE,
    currency: 'EUR' as const,
    billing: 'one-time' as const,
    stripe_price_id: '',
    is_highlighted: true,
    is_available: true,
    note: 'Kennenlernangebot · Testphase',
  },
]

export default async function MysteryShoppingCheckout({
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ cancelled?: string }>
}) {
  const sp = await searchParams

  return (
    <div className="bg-white">
      <div className="px-6 py-2.5 text-center text-xs font-medium text-white sm:text-sm" style={{ backgroundColor: '#1A5FD4' }}>
        Dieses Angebot ist nur noch wenige Tage verfügbar. Wenn Du unsicher bist, <a href="/kontakt" className="underline underline-offset-2 hover:opacity-80">sprich mit uns</a>.
      </div>
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <a href="/" className="flex items-center gap-2">
            <Image src="/ef-logo.png" alt="Eilers+Friends" width={200} height={56} className="h-12 md:h-14 w-auto object-contain" priority />
            <span className="text-xs font-medium text-muted">· Checkout</span>
          </a>
          <span className="hidden text-xs text-muted sm:inline">Sichere Zahlung · Stripe</span>
        </div>
      </header>

      {sp.cancelled && (
        <div className="mx-auto max-w-7xl px-6 pt-6">
          <div className="rounded-2xl border border-amber bg-amber-bg p-4 text-sm text-amber">
            Du hast den Vorgang abgebrochen. Du kannst jederzeit neu starten.
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-[2fr_1fr] lg:gap-16">
          <main>
            <div className="mb-10">
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-border bg-blue-bg px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue">
                <span className="h-1.5 w-1.5 rounded-full bg-blue" />
                Mystery Shopping · Kennenlernangebot
              </span>
              <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-ink sm:text-5xl">
                Markus ruft als Kunde bei Deinem <span className="text-blue">Sales-Team</span> an.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted">
                Markus spricht als potenzieller Kunde mit Deinen SDRs und Deinem Sales-Team. Jedes Gespräch wertet er für Dich aus — entlang 13 wichtiger Skills und über 5 Dimensionen.
              </p>
            </div>

            <section className="mb-10 rounded-2xl border border-gray-100 bg-cream p-8">
              <h2 className="text-2xl font-bold text-ink sm:text-3xl">Das bekommst Du.</h2>
              <ul className="mt-5 space-y-3">
                {INCLUDED.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-sm text-gray-700">
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue text-white">
                      <Check size={12} />
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
            </section>

            <p className="text-sm text-muted">
              Testphase: 1 € zum Prüfen des Ablaufs. Regulär als Kennenlernangebot 297 € (statt 997 €).
            </p>
          </main>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <CheckoutForm
              programSlug={SLUG}
              programName="Mystery Shopping"
              tiers={TIERS}
              maxSeats={1}
            />
            <p className="mt-6 text-xs text-muted">
              Probleme? <a href="mailto:team@eilersfriends.com" className="text-blue underline">team@eilersfriends.com</a>
            </p>
          </aside>
        </div>
      </div>

      <footer style={{ backgroundColor: '#0A0D14' }} className="px-6 py-10 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-xs sm:flex-row" style={{ color: 'rgba(255,255,255,0.6)' }}>
          <div className="flex items-center gap-3">
            <Image src="/wing-white.png" alt="Eilers+Friends" width={64} height={64} className="h-16 w-auto" />
            <span className="font-medium">© 2026</span>
          </div>
          <div className="flex gap-4">
            <a href="/impressum" className="hover:text-white">Impressum</a>
            <a href="/datenschutz" className="hover:text-white">Datenschutz</a>
            <a href="/agb" className="hover:text-white">AGB</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
