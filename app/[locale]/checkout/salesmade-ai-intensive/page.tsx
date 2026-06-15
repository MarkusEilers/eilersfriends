// app/[locale]/checkout/salesmade-ai-intensive/page.tsx
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { ensureProgramsTables } from '@/lib/db/self-heal-programs'
import { ensureAiIntensiveProgram } from '@/lib/db/seed-ai-intensive'
import { CheckoutForm } from '@/components/checkout/CheckoutForm'
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

function rowsOf<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[]
  if (r && typeof r === 'object' && 'rows' in r) {
    const x = (r as { rows: unknown }).rows
    if (Array.isArray(x)) return x as T[]
  }
  return []
}

interface PricingTier {
  id: string; label: string; price: number; currency: 'EUR' | 'USD' | 'GBP'
  billing: 'one-time' | 'monthly' | 'yearly' | 'lifetime'; stripe_price_id: string
  is_highlighted?: boolean; is_available: boolean; note?: string
}

export default async function AiIntensiveCheckout({
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ cancelled?: string }>
}) {
  const sp = await searchParams
  await ensureProgramsTables()
  await ensureAiIntensiveProgram()

  const rows = rowsOf<Record<string, unknown>>(
    await db.execute(sql`SELECT id, slug, name, pricing_tiers FROM programs WHERE slug = ${SLUG} AND is_active = true LIMIT 1`)
  )
  if (rows.length === 0) notFound()
  const program = rows[0]!
  const tiers = (program.pricing_tiers ?? []) as PricingTier[]

  return (
    <div className="bg-white">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2 text-sm font-bold text-ink">
            <span className="inline-block h-6 w-6 rounded-full bg-orange" />
            <span>Eilers+Friends</span>
            <span className="ml-2 text-xs font-medium text-muted">· Checkout</span>
          </div>
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
          {/* LEFT */}
          <main>
            <div className="mb-10">
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-border bg-blue-bg px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue">
                <span className="h-1.5 w-1.5 rounded-full bg-blue" />
                SalesMade AI Intensive · Nur für Alumni
              </span>
              <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-ink sm:text-5xl">
                Gesprächsführung auf den Punkt — plus mein kompletter <span className="text-blue">AI-Sales-Stack.</span>
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
              programName={program.name as string}
              tiers={tiers.filter((t) => t.is_available)}
              cities={CITIES}
              maxSeats={5}
            />
            <p className="mt-6 text-xs text-muted">
              Probleme? <a href="mailto:team@eilersfriends.com" className="text-blue underline">team@eilersfriends.com</a>
            </p>
          </aside>
        </div>
      </div>

      <footer className="border-t border-gray-200 bg-cream px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-xs text-muted sm:flex-row">
          <div className="flex items-center gap-2 font-bold text-ink">
            <span className="inline-block h-6 w-6 rounded-full bg-orange" />
            <span>Eilers+Friends</span>
            <span className="ml-2 font-medium text-muted">© 2026</span>
          </div>
          <div className="flex gap-4">
            <a href="/impressum" className="hover:text-ink">Impressum</a>
            <a href="/datenschutz" className="hover:text-ink">Datenschutz</a>
            <a href="/agb" className="hover:text-ink">AGB</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
