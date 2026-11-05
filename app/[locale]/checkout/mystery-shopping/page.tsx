// app/[locale]/checkout/mystery-shopping/page.tsx
import { CheckoutForm } from '@/components/checkout/CheckoutForm'
import Image from 'next/image'
import { Footer } from '@/components/layout/Footer'
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher'
import { getTranslations } from 'next-intl/server'
import { Check } from 'lucide-react'
import { loadLpSections, canPreview } from '@/lib/lp/story-loader'
import { StoryPage, loadStoryCtx } from '@/components/lp/story/StoryBlocks'
import { PreviewBanner } from '@/components/lp/PreviewBanner'
import { FooterSlim } from '@/components/layout/FooterSlim'
import { getLead } from '@/lib/mystery-shopping/slots'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Mystery Shopping buchen · Eilers+Friends', robots: { index: false } }

const SLUG = 'mystery-shopping'
const PRICE = 1

export default async function MysteryShoppingCheckout({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ cancelled?: string; lead?: string; preview?: string }> }) {
  const sp = await searchParams
  const { locale } = await params

  // Checkout mit Video aus dem Landingpage-System (Slug „mystery-shopping-checkout“), sonst die eingebaute Fassung.
  const lp = await loadLpSections('mystery-shopping-checkout', locale, await canPreview(sp.preview)).catch(() => null)
  if (lp && lp.sections.some((x) => x.type === 'story_checkout_vsl')) {
    const lead = sp.lead ? await getLead(sp.lead).catch(() => null) : null
    const ctx = await loadStoryCtx(lead ? { email: lead.email, firstName: lead.first_name ?? undefined, lead: sp.lead } : undefined)
    return (
      <>
        {lp.status !== 'published' && <PreviewBanner status={lp.status} editHref={`/admin/landing-pages/${lp.pageId}`} slug="mystery-shopping-checkout" locale={locale} />}
        {sp.cancelled && <div className="bg-amber-50 px-6 py-3 text-center text-sm text-amber-900">Die Zahlung wurde abgebrochen. Euer Platz ist noch kurz reserviert, Ihr könnt es direkt noch einmal versuchen.</div>}
        <StoryPage sections={lp.sections} ctx={ctx} />
        <FooterSlim />
      </>
    )
  }
  const c = await getTranslations('checkout.common')
  const t = await getTranslations('checkout.mystery')
  const TIERS = [{ id: 'mystery-onetime', label: 'Mystery Shopping', price: PRICE, currency: 'EUR' as const, billing: 'one-time' as const, stripe_price_id: '', is_highlighted: true, is_available: true, note: t('badge') }]
  const included = [t('inc1'), t('inc2'), t('inc3')]

  return (
    <div className="bg-white">
      <div className="px-6 py-2.5 text-center text-xs font-medium text-white sm:text-sm" style={{ backgroundColor: '#1A5FD4' }}>
        {c('bannerPre')} <a href="/kontakt" className="underline underline-offset-2 hover:opacity-80">{c('bannerLink')}</a>.
      </div>
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <a href="/" className="flex items-center gap-2">
            <Image src="/ef-logo.png" alt="Eilers+Friends" width={200} height={56} className="h-14 md:h-16 w-auto object-contain" priority />
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
            <div className="mb-10">
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-border bg-blue-bg px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue">
                <span className="h-1.5 w-1.5 rounded-full bg-blue" />{t('badge')}
              </span>
              <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-ink sm:text-5xl">
                {t('h1pre')} <span className="text-blue">{t('h1accent')}</span> {t('h1post')}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted">{t('intro')}</p>
            </div>

            <section className="mb-10 rounded-2xl border border-gray-100 bg-cream p-8">
              <h2 className="text-2xl font-bold text-ink sm:text-3xl">{t('whatYouGet')}</h2>
              <ul className="mt-5 space-y-3">
                {included.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-sm text-gray-700">
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue text-white"><Check size={12} /></span>
                    {b}
                  </li>
                ))}
              </ul>
            </section>

            <p className="text-sm text-muted">{t('note')}</p>
          </main>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <CheckoutForm programSlug={SLUG} programName="Mystery Shopping" tiers={TIERS} maxSeats={1} />
            <p className="mt-6 text-xs text-muted">{c('problems')} <a href="mailto:team@eilersfriends.com" className="text-blue underline">team@eilersfriends.com</a></p>
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  )
}
