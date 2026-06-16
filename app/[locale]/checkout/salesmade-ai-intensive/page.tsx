// app/[locale]/checkout/salesmade-ai-intensive/page.tsx
import { CheckoutForm } from '@/components/checkout/CheckoutForm'
import { Topbar } from '@/components/layout/Topbar'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { getSetting } from '@/lib/db/queries/settings'
import { Check, MapPin } from 'lucide-react'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SLUG = 'salesmade-ai-intensive'
const CITIES = ['Stuttgart · Fr 10. – Sa 11. Juli', 'Berlin · Fr 24. – Sa 25. Juli']
const INCLUDED = [
  'Zwei Tage live mit Markus',
  'Gesprächsführung, geschärft — an Deinen Fällen',
  'Der komplette AI-Sales-Stack: alle Frameworks und Prompts',
  'Alles zum Mitnehmen, sofort einsetzbar',
]
const TIERS = [
  {
    id: 'ai-intensive-onetime',
    label: 'AI Intensive · 2 Tage',
    price: 897,
    currency: 'EUR' as const,
    billing: 'one-time' as const,
    stripe_price_id: '',
    is_highlighted: true,
    is_available: true,
    note: 'Alumni-Preis · Vorkasse',
  },
]

export default async function AiIntensiveCheckout({
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ cancelled?: string }>
}) {
  const sp = await searchParams
  const calendlyUrl = await getSetting('calendly.markus')

  return (
    <div className="bg-white">
      <Topbar />
      <Navbar calendlyUrl={calendlyUrl} />

      {sp.cancelled && (
        <div className="mx-auto max-w-7xl px-6 pt-6">
          <div className="rounded-2xl border border-amber bg-amber-bg p-4 text-sm text-amber">
            Du hast den Vorgang abgebrochen. Du kannst jederzeit neu starten.
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-[2fr_1fr] lg:gap-16">
          {/* LEFT */}
          <main>
            <div className="mb-10">
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-border bg-blue-bg px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue">
                <span className="h-1.5 w-1.5 rounded-full bg-blue" />
                SalesMade AI Intensive · Nur für Alumni
              </span>
              <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-ink sm:text-5xl">
                Wirksam Überzeugen auf den Punkt — plus mein kompletter <span className="text-blue">AI-Sales-Stack.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted">
                Zwei Tage mit Markus, maximal 20 Teilnehmer pro Termin. Wähle Deine Stadt, sichere Deinen Platz per Vorkasse.
              </p>
            </div>

            <section className="mb-10 rounded-2xl border border-gray-100 bg-cream p-8">
              <h2 className="text-2xl font-bold text-ink sm:text-3xl">Das ist drin.</h2>
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

            <section className="mb-4">
              <h2 className="text-2xl font-bold text-ink sm:text-3xl">Zwei Städte. Zwei Termine.</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[{ c: 'Stuttgart', w: 'Fr 10. – Sa 11. Juli' }, { c: 'Berlin', w: 'Fr 24. – Sa 25. Juli' }].map((d) => (
                  <div key={d.c} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                    <MapPin size={18} className="text-blue" />
                    <div>
                      <p className="font-bold text-ink">{d.c}</p>
                      <p className="text-xs text-muted">{d.w}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-muted">Maximal 20 Teilnehmer pro Termin. Das Format lebt vom kleinen Kreis.</p>
            </section>
          </main>

          {/* RIGHT — Form */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <CheckoutForm
              programSlug={SLUG}
              programName="SalesMade AI Intensive"
              tiers={TIERS}
              cities={CITIES}
              maxSeats={5}
            />
            <p className="mt-6 text-xs text-muted">
              Probleme? <a href="mailto:team@eilersfriends.com" className="text-blue underline">team@eilersfriends.com</a>
            </p>
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  )
}
