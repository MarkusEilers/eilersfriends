// app/[locale]/checkout/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { ensureProgramsTables } from '@/lib/db/self-heal-programs'
import { CheckoutForm } from '@/components/checkout/CheckoutForm'
import { SalesFlywheel } from '@/components/sections/salesmade/SalesFlywheel'
import Image from 'next/image'
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher'
import { getTranslations } from 'next-intl/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function rowsOf<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[]
  if (r && typeof r === 'object' && 'rows' in r) { const x = (r as { rows: unknown }).rows; if (Array.isArray(x)) return x as T[] }
  return []
}

interface PricingTier {
  id: string; label: string; price: number; currency: 'EUR' | 'USD' | 'GBP'
  billing: 'one-time' | 'monthly' | 'yearly' | 'lifetime'; stripe_price_id: string
  is_highlighted?: boolean; is_available: boolean; note?: string
}

export default async function CheckoutPage({ params, searchParams }: { params: Promise<{ slug: string; locale: string }>; searchParams: Promise<{ cancelled?: string }> }) {
  const { slug } = await params
  const sp = await searchParams
  const tCoach = await getTranslations('salesmadePage.coach')
  const tHero = await getTranslations('salesmadePage.hero')
  const c = await getTranslations('checkout.common')
  const t = await getTranslations('checkout.program')
  await ensureProgramsTables()

  const rows = rowsOf<Record<string, unknown>>(
    await db.execute(sql`SELECT id, slug, name, pricing_tiers, enrollment_limit, enrollment_deadline FROM programs WHERE slug = ${slug} AND is_active = true LIMIT 1`)
  )
  if (rows.length === 0) notFound()
  const program = rows[0]!

  const presentTiers = (tiers: PricingTier[]): PricingTier[] => {
    const mapped = tiers.map((ti) => {
      if (ti.billing === 'yearly') return { ...ti, label: t('tierYearly'), note: t('tierYearlyNote'), is_highlighted: true }
      if (ti.billing === 'monthly') return { ...ti, label: t('tierMonthly'), note: t('tierMonthlyNote'), is_highlighted: false }
      return ti
    })
    const order = (b: string) => (b === 'yearly' ? 0 : b === 'monthly' ? 1 : 2)
    return mapped.sort((a, b) => order(a.billing) - order(b.billing))
  }
  const tiers = presentTiers((program.pricing_tiers ?? []) as PricingTier[])
  const RESULTS = [
    { v: '28 % → 60 %', l: t('result1l') }, { v: '−38 %', l: t('result2l') }, { v: '+48 %', l: t('result3l') },
  ]
  const FAQS = [1, 2, 3, 4, 5, 6].map((n) => ({ q: t(`faq${n}q`), a: t(`faq${n}a`) }))
  const bold = { b: (ch: React.ReactNode) => <strong>{ch}</strong> }

  return (
    <div className="bg-white">
      <div className="px-6 py-2.5 text-center text-xs font-medium text-white sm:text-sm" style={{ backgroundColor: '#1A5FD4' }}>
        {c('bannerPre')} <a href="/kontakt" className="underline underline-offset-2 hover:opacity-80">{c('bannerLink')}</a>.
      </div>
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <a href="/" className="flex items-center gap-2">
            <Image src="/ef-logo.png" alt="Eilers+Friends" width={200} height={56} className="h-12 md:h-14 w-auto object-contain" priority />
            <span className="text-xs font-medium text-muted">{c('checkoutBadge')}</span>
          </a>
          <div className="flex items-center gap-3"><span className="hidden text-xs text-muted sm:inline">{c('securePayment')}</span><LocaleSwitcher /></div>
        </div>
      </header>

      {sp.cancelled && (
        <div className="mx-auto max-w-7xl px-6 pt-6">
          <div className="rounded-2xl border border-amber bg-amber-bg p-4 text-sm text-amber">{c('cancelled')}</div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-[2fr_1fr] lg:gap-16">
          <main>
            <div className="mb-12">
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-border bg-blue-bg px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue">
                <span className="h-1.5 w-1.5 rounded-full bg-blue" />{program.name as string}
              </span>
              <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-ink sm:text-5xl">
                {tHero('headline1')} <span className="text-blue">{tHero('headlineAccent')}</span>
              </h1>
              {tHero.has('subheadline') && <p className="mt-4 text-xl font-semibold text-ink sm:text-2xl">{tHero('subheadline')}</p>}
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted">{tHero('subtext')}</p>
            </div>

            <section className="mb-12">
              <h2 className="text-3xl font-bold sm:text-4xl text-ink">{t('problemH2')}</h2>
              <p className="mt-4 text-xl font-semibold text-ink sm:text-2xl">{t('problemLead')}</p>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">{t('problemBody')}</p>
            </section>

            <section className="mb-12 rounded-2xl border border-gray-100 bg-cream p-8">
              <span className="mb-3 inline-block rounded-full bg-blue-bg px-3 py-1 text-xs font-bold uppercase tracking-widest text-blue">{t('chanceBadge')}</span>
              <h2 className="text-3xl font-bold sm:text-4xl text-ink">{t('chanceH2')}</h2>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-700">{t('chanceBody')}</p>
            </section>

            <section className="mb-4 overflow-hidden rounded-2xl border border-gray-100">
              <SalesFlywheel eyebrow={t('flywheelEyebrow')} compact />
            </section>
            <p className="mb-12 text-sm text-muted">
              <span className="font-semibold text-ink">{t('includedLabel')}</span> {t('includedText')}
            </p>

            <section className="mb-12">
              <h2 className="text-3xl font-bold sm:text-4xl text-ink">{t('resultsH2')}</h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {RESULTS.map((s, i) => (
                  <div key={i} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="text-2xl font-bold text-blue sm:text-3xl">{s.v}</div>
                    <div className="mt-1 text-xs text-muted">{s.l}</div>
                  </div>
                ))}
              </div>
            </section>

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

            <section className="mb-12 rounded-2xl border p-8" style={{ borderColor: 'var(--color-orange-border)', backgroundColor: 'var(--color-orange-bg)' }}>
              <h2 className="text-3xl font-bold sm:text-4xl text-ink">{t('foundingH2')}</h2>
              <p className="mt-4 text-base leading-relaxed text-gray-700">{t('foundingBody')}</p>
              <ul className="mt-5 space-y-3 text-base leading-relaxed text-gray-700">
                {(['founding1', 'founding2', 'founding3'] as const).map((k) => (
                  <li key={k} className="flex items-start gap-3"><span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-orange" /><span>{t.rich(k, bold)}</span></li>
                ))}
              </ul>
            </section>

            <section className="mb-12">
              <p className="text-base leading-relaxed text-gray-700">{t('pushText')}</p>
            </section>

            <section className="mb-12">
              <h2 className="mb-4 text-2xl font-bold sm:text-3xl text-ink">{t('faqH2')}</h2>
              {FAQS.map((f, i) => (
                <details key={i} className="border-b border-gray-200 py-4">
                  <summary className="cursor-pointer font-semibold text-ink">{f.q}</summary>
                  <p className="mt-3 text-sm text-gray-600">{f.a}</p>
                </details>
              ))}
            </section>
          </main>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <CheckoutForm
              programSlug={slug}
              programName={program.name as string}
              tiers={tiers.filter((ti) => ti.is_available)}
              enrollmentLimit={program.enrollment_limit as number | null}
              enrollmentDeadline={program.enrollment_deadline as string | null}
              guaranteeText={t('guaranteeText')}
              guaranteeBadge={t('guaranteeBadge')}
              freeSeatPer={5}
              bonusTiers={[
                { threshold: 10, label: t('bonus10') },
                { threshold: 15, label: t('bonus15') },
                { threshold: 30, label: t('bonus30') },
              ]}
            />
            <p className="mt-6 text-xs text-muted">{c('problems')} <a href="mailto:team@eilersfriends.com" className="text-blue underline">team@eilersfriends.com</a></p>
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
            <a href="/impressum" className="hover:text-white">{c('imprint')}</a>
            <a href="/datenschutz" className="hover:text-white">{c('privacy')}</a>
            <a href="/agb" className="hover:text-white">{c('terms')}</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
