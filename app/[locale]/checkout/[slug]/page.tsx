// app/[locale]/checkout/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { ensureProgramsTables } from '@/lib/db/self-heal-programs'
import { CheckoutForm } from '@/components/checkout/CheckoutForm'
import { SalesFlywheel } from '@/components/sections/salesmade/SalesFlywheel'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function rowsOf<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[]
  if (r && typeof r === 'object' && 'rows' in r) {
    const x = (r as { rows: unknown }).rows
    if (Array.isArray(x)) return x as T[]
  }
  return []
}

interface PricingTier {
  id: string
  label: string
  price: number
  currency: 'EUR' | 'USD' | 'GBP'
  billing: 'one-time' | 'monthly' | 'yearly' | 'lifetime'
  stripe_price_id: string
  is_highlighted?: boolean
  is_available: boolean
  note?: string
}

const RESULTS = [
  { v: '28 % → 60 %', l: 'Erfolgsquote in Discovery Calls' },
  { v: '−38 %', l: 'kürzere Verkaufszyklen' },
  { v: '+48 %', l: 'mehr Umsatz in zwölf Monaten' },
]

const FAQS = [
  { q: 'Was kostet ein Platz?', a: '549 € pro Monat. Wer den Jahresbeitrag vorab zahlt, bekommt zwei Monate gratis (5.485 € im Jahr). Ein Platz bildet eine Person zwölf Monate aus — Du kannst selbst teilnehmen.' },
  { q: 'Wie funktionieren die Mengen-Vorteile?', a: 'Ab 5 Plätzen ist einer frei. Ab 10 kommt monatliches Team-Training dazu. Ab 15 schneiden wir Inhalte auf Euren Service zu und richten eine eigene Community ein. Ab 30 bekommt Ihr Training, Frameworks und Backend unter Eurer Marke.' },
  { q: 'Was, wenn es nicht passt?', a: '90 Tage Geld zurück. Siehst Du nach 90 Tagen keine messbare Verbesserung in Deinen Sales-KPIs, erstatten wir die volle Investition. Eine Mail an team@eilersfriends.com genügt.' },
  { q: 'Was bleibt eingefroren?', a: 'Dein Preis, solange Du dabei bist — auch wenn die Academy später teurer wird.' },
  { q: 'Was passiert nach dem Kauf?', a: 'Innerhalb von 24 Stunden: Account-Setup und der Link zum ersten Onboarding-Call.' },
  { q: 'Wie funktioniert die Umsatzsteuer?', a: 'Mit gültiger UStID außerhalb DE stellen wir steuerfrei (Reverse-Charge §13b UStG). Bei DE-UStID gilt 19 % MwSt.' },
]

/** Offer-spezifische Aufbereitung der Tiers (pro Monat zuerst, jargon-frei). */
function presentTiers(tiers: PricingTier[]): PricingTier[] {
  const mapped = tiers.map((t) => {
    if (t.billing === 'yearly') {
      return { ...t, label: 'Jährlich vorab', note: 'Zwei Monate gratis gegenüber monatlich.', is_highlighted: true }
    }
    if (t.billing === 'monthly') {
      return { ...t, label: 'Pro Platz', note: 'Founding-Preis · bleibt eingefroren, solange Du dabei bist.', is_highlighted: false }
    }
    return t
  })
  const order = (b: string) => (b === 'yearly' ? 0 : b === 'monthly' ? 1 : 2)
  return mapped.sort((a, b) => order(a.billing) - order(b.billing))
}

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; locale: string }>
  searchParams: Promise<{ cancelled?: string }>
}) {
  const { slug } = await params
  const sp = await searchParams
  const tCoach = await getTranslations('salesmadePage.coach')
  const tHero = await getTranslations('salesmadePage.hero')
  await ensureProgramsTables()

  const rows = rowsOf<Record<string, unknown>>(
    await db.execute(sql`SELECT id, slug, name, pricing_tiers, enrollment_limit, enrollment_deadline FROM programs WHERE slug = ${slug} AND is_active = true LIMIT 1`)
  )
  if (rows.length === 0) notFound()
  const program = rows[0]!
  const tiers = presentTiers((program.pricing_tiers ?? []) as PricingTier[])

  return (
    <div className="bg-white">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <a href="/" className="flex items-center gap-2">
            <Image src="/ef-logo.png" alt="Eilers+Friends" width={150} height={42} className="h-7 w-auto object-contain" priority />
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
          {/* LEFT — Content */}
          <main>
            {/* HERO */}
            <div className="mb-12">
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-border bg-blue-bg px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue">
                <span className="h-1.5 w-1.5 rounded-full bg-blue" />
                {program.name as string}
              </span>
              <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-ink sm:text-5xl">
                {tHero('headline1')} <span className="text-blue">{tHero('headlineAccent')}</span>
              </h1>
              {tHero.has('subheadline') && (
                <p className="mt-4 text-xl font-semibold text-ink sm:text-2xl">{tHero('subheadline')}</p>
              )}
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted">{tHero('subtext')}</p>
            </div>

            {/* PROBLEM */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold sm:text-4xl text-ink">84 % der B2B-Verkäufer wurden nie richtig ausgebildet.</h2>
              <p className="mt-4 text-xl font-semibold text-ink sm:text-2xl">
                87 % der CEOs glauben, dass Verkaufen der wichtigste Skill für den Erfolg ist, finden aber selbst die Zeit nicht, ihr Team auszubilden.
              </p>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
                Im Kundengespräch entscheidet, wie souverän jemand führt, fragt, Einwände hält und abschließt. Dafür hatte fast niemand je eine Ausbildung. Die Folge: Abschlüsse schwanken, Zyklen ziehen sich, und am Ende verkauft der Rabatt.
              </p>
            </section>

            {/* DIE NEUE CHANCE */}
            <section className="mb-12 rounded-2xl border border-gray-100 bg-cream p-8">
              <span className="mb-3 inline-block rounded-full bg-blue-bg px-3 py-1 text-xs font-bold uppercase tracking-widest text-blue">Die neue Chance</span>
              <h2 className="text-3xl font-bold sm:text-4xl text-ink">Gemeinsam bauen wir das Können auf und bringen Dein Team ins Machen.</h2>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-700">
                Können entsteht durch wiederholtes Training und Mikro-Erfolge. Die Academy beginnt mit einem Assessment über 13 Skills, baut daraus einen Plan individuell für jeden Teilnehmer und trainiert gezielt jeden Monat eine spezifische Fähigkeit — mit Sparring in mehreren Schwierigkeitsstufen und Re-Assessment jedes Quartal. Sichtbarer und spürbarer Fortschritt jeden Monat, der Selbstsicherheit und Ergebnisse produziert.
              </p>
            </section>

            {/* DAS PROGRAMM — Flywheel */}
            <section className="mb-4 overflow-hidden rounded-2xl border border-gray-100">
              <SalesFlywheel eyebrow="12 Monate Transformation durch Training On The Job." compact />
            </section>
            <p className="mb-12 text-sm text-muted">
              <span className="font-semibold text-ink">Enthalten:</span> monatliches 1:1-Coaching mit Markus, individuelle Frameworks, Playbook-Library, monatliches Group-Training.
            </p>

            {/* BEWEIS */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold sm:text-4xl text-ink">Typische Ergebnisse unserer Teilnehmer.</h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {RESULTS.map((s, i) => (
                  <div key={i} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="text-2xl font-bold text-blue sm:text-3xl">{s.v}</div>
                    <div className="mt-1 text-xs text-muted">{s.l}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* COACH — Markus · Bio wortwörtlich aus salesmadePage.coach */}
            <section className="mb-12 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
              <p className="mb-6 text-xs font-bold uppercase tracking-widest text-blue">{tCoach('eyebrow')}</p>
              <div className="flex flex-col items-start gap-6 sm:flex-row">
                <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl">
                  <Image src="/markus-photo.jpg" alt="Markus Eilers" fill sizes="128px" className="object-cover grayscale" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-ink">{tCoach('name')}</h3>
                  <p className="text-sm text-muted">{tCoach('roleTag')}</p>
                  <p className="mt-3 text-sm leading-relaxed text-gray-700">{tCoach('bio1')}</p>
                  <p className="mt-3 text-sm leading-relaxed text-gray-700">{tCoach('bio2')}</p>
                  <p className="mt-4 font-serif text-base italic text-gray-800">{tCoach('quote')}</p>
                </div>
              </div>
            </section>

            {/* ANGEBOT / FOUNDING */}
            <section className="mb-12 rounded-2xl border p-8" style={{ borderColor: 'var(--color-orange-border)', backgroundColor: 'var(--color-orange-bg)' }}>
              <h2 className="text-3xl font-bold sm:text-4xl text-ink">Die ersten 30 Plätze.</h2>
              <p className="mt-4 text-base leading-relaxed text-gray-700">
                Ein Ausbildungsplatz kostet 549 € pro Monat. Ein Platz bildet eine Person über zwölf Monate aus — Du kannst selbst einer davon sein. Wer den Jahresbeitrag vorab zahlt, bekommt zwei Monate gratis.
              </p>
              <ul className="mt-5 space-y-3 text-base leading-relaxed text-gray-700">
                <li className="flex items-start gap-3"><span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-orange" /><span><strong>Founding-Vorteil.</strong> Die ersten 30 Plätze sind Founding-Plätze. Dein Preis bleibt eingefroren, solange Du dabei bist.</span></li>
                <li className="flex items-start gap-3"><span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-orange" /><span><strong>Je mehr Plätze, desto mehr drin.</strong> Ab 5 ist einer frei, ab 10 monatliches Team-Training, ab 15 zugeschnittene Inhalte und eine eigene Community, ab 30 alles unter Eurer Marke.</span></li>
                <li className="flex items-start gap-3"><span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-orange" /><span><strong>90 Tage Garantie.</strong> Siehst Du nach 90 Tagen keine messbare Verbesserung in Deinen Sales-KPIs, bekommst Du die volle Investition zurück.</span></li>
              </ul>
            </section>

            {/* PUSH */}
            <section className="mb-12">
              <p className="text-base leading-relaxed text-gray-700">
                Sind die ersten 30 Plätze vergeben, gilt der reguläre Preis — und die monatliche Zeit mit Markus läuft über eine Warteliste. Wer jetzt nicht startet, geht mit demselben Team ins nächste Quartal, das er heute hat. Die ersten 30 enden am 31. Juli 2026.
              </p>
            </section>

            {/* FAQ */}
            <section className="mb-12">
              <h2 className="mb-4 text-2xl font-bold sm:text-3xl text-ink">Häufige Fragen.</h2>
              {FAQS.map((f, i) => (
                <details key={i} className="border-b border-gray-200 py-4">
                  <summary className="cursor-pointer font-semibold text-ink">{f.q}</summary>
                  <p className="mt-3 text-sm text-gray-600">{f.a}</p>
                </details>
              ))}
            </section>
          </main>

          {/* RIGHT — Form */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <CheckoutForm
              programSlug={slug}
              programName={program.name as string}
              tiers={tiers.filter((t) => t.is_available)}
              enrollmentLimit={program.enrollment_limit as number | null}
              enrollmentDeadline={program.enrollment_deadline as string | null}
              guaranteeText="90-Tage-Zufriedenheitsgarantie"
              guaranteeBadge="90 Tage Geld zurück"
              freeSeatPer={5}
              bonusTiers={[
                { threshold: 10, label: 'Monatliches Team-Training' },
                { threshold: 15, label: 'Inhalte auf Euren Service zugeschnitten + eigene Community' },
                { threshold: 30, label: 'Training, Frameworks & Backend unter Eurer Marke' },
              ]}
            />
            <p className="mt-6 text-xs text-muted">
              Probleme? <a href="mailto:team@eilersfriends.com" className="text-blue underline">team@eilersfriends.com</a>
            </p>
          </aside>
        </div>
      </div>

      <footer className="border-t border-gray-200 bg-cream px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-xs text-muted sm:flex-row">
          <div className="flex items-center gap-2 text-ink">
            <Image src="/wing-white.png" alt="Eilers+Friends" width={40} height={40} className="h-8 w-auto" style={{ filter: 'brightness(0)' }} />
            <span className="font-medium text-muted">© 2026</span>
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
