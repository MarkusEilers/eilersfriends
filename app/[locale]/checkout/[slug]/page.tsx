// app/[locale]/checkout/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { ensureProgramsTables } from '@/lib/db/self-heal-programs'
import { CheckoutForm } from '@/components/checkout/CheckoutForm'
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

interface CheckoutContent {
  promise?: { headline: string; bullets: Array<{ num?: string; check?: boolean; title: string; body: string }> }
  outcomes?: { headline: string; eyebrow: string; items: string[] }
  typical_effects?: { headline: string; eyebrow: string; stats: Array<{ value: string; label: string; color: string }>; note?: string }
  testimonials?: { headline: string; eyebrow: string; items: Array<{ quote: string; author: string }> }
  why_now?: { headline: string; bullets: string[] }
  faqs?: Array<{ q: string; a: string }>
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
  await ensureProgramsTables()

  const rows = rowsOf<Record<string, unknown>>(
    await db.execute(sql`SELECT id, slug, name, tagline, pricing_tiers, checkout_content, enrollment_limit, enrollment_deadline FROM programs WHERE slug = ${slug} AND is_active = true LIMIT 1`)
  )
  if (rows.length === 0) notFound()
  const program = rows[0]!
  const tiers = (program.pricing_tiers ?? []) as PricingTier[]
  const content = (program.checkout_content ?? {}) as CheckoutContent

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
          {/* LEFT — Content */}
          <main>
            <div className="mb-10">
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-border bg-blue-bg px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue">
                <span className="h-1.5 w-1.5 rounded-full bg-blue" />
                {program.name as string}
              </span>
              <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-ink sm:text-5xl">
                {program.tagline as string}
              </h1>
            </div>

            {content.promise && (
              <section className="mb-12 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
                <h2 className="mb-6 font-serif text-3xl text-ink">{content.promise.headline}</h2>
                <ul className="grid gap-4 sm:grid-cols-2">
                  {content.promise.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-3">
                      {b.num ? (
                        <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue text-[10px] font-bold text-white">{b.num}</span>
                      ) : (
                        <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-bg text-[10px] font-bold text-blue">✓</span>
                      )}
                      <div>
                        <p className="font-semibold text-ink">{b.title}</p>
                        <p className="text-sm text-muted">{b.body}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {content.outcomes && (
              <section className="mb-12">
                <span className="mb-3 inline-block rounded-full bg-orange-bg px-3 py-1 text-xs font-bold uppercase tracking-widest text-orange">{content.outcomes.eyebrow}</span>
                <h2 className="font-serif text-3xl text-ink">{content.outcomes.headline}</h2>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {content.outcomes.items.map((item, i) => (
                    <div key={i} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-blue">{String(i + 1).padStart(2, '0')}</span>
                      <p className="mt-1 font-semibold text-ink">{item}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {content.typical_effects && (
              <section className="mb-12 rounded-2xl border border-gray-100 bg-cream p-8">
                <span className="mb-3 inline-block rounded-full bg-orange-bg px-3 py-1 text-xs font-bold uppercase tracking-widest text-orange">{content.typical_effects.eyebrow}</span>
                <h2 className="font-serif text-3xl text-ink">{content.typical_effects.headline}</h2>
                <div className="mt-6 grid grid-cols-2 divide-x divide-gray-200 rounded-2xl border border-gray-200 bg-white sm:grid-cols-4">
                  {content.typical_effects.stats.map((s, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 px-4 py-7">
                      <span className="text-3xl font-bold sm:text-4xl" style={{ color: s.color }}>{s.value}</span>
                      <span className="text-xs font-medium text-gray-400">{s.label}</span>
                    </div>
                  ))}
                </div>
                {content.typical_effects.note && <p className="mt-4 text-xs italic text-muted">{content.typical_effects.note}</p>}
              </section>
            )}

            {content.testimonials && (
              <section className="mb-12">
                <span className="mb-3 inline-block rounded-full bg-blue-bg px-3 py-1 text-xs font-bold uppercase tracking-widest text-blue">{content.testimonials.eyebrow}</span>
                <h2 className="font-serif text-3xl text-ink">{content.testimonials.headline}</h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {content.testimonials.items.map((t, i) => (
                    <div key={i} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                      <p className="font-serif text-base italic leading-relaxed text-gray-800">„{t.quote}"</p>
                      <p className="mt-4 text-xs text-muted">— {t.author}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Coach — Markus · Bio wortwörtlich aus salesmadePage.coach */}
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

            {content.why_now && (
              <section className="mb-12 rounded-2xl border p-8" style={{ borderColor: 'var(--color-orange-border)', backgroundColor: 'var(--color-orange-bg)' }}>
                <h2 className="font-serif text-3xl text-ink">{content.why_now.headline}</h2>
                <ul className="mt-4 space-y-3 text-base leading-relaxed text-gray-700">
                  {content.why_now.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-orange" />
                      <span dangerouslySetInnerHTML={{ __html: b }} />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {content.faqs && (
              <section className="mb-12">
                <h2 className="mb-4 font-serif text-2xl text-ink">Häufige Fragen.</h2>
                {content.faqs.map((f, i) => (
                  <details key={i} className="border-b border-gray-200 py-4">
                    <summary className="cursor-pointer font-semibold text-ink">{f.q}</summary>
                    <p className="mt-3 text-sm text-gray-600">{f.a}</p>
                  </details>
                ))}
              </section>
            )}
          </main>

          {/* RIGHT — Form */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <CheckoutForm
              programSlug={slug}
              programName={program.name as string}
              tiers={tiers.filter((t) => t.is_available)}
              enrollmentLimit={program.enrollment_limit as number | null}
              enrollmentDeadline={program.enrollment_deadline as string | null}
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
