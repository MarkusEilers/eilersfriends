// app/[locale]/checkout/salesmade-ai-intensive/page.tsx
import { CheckoutForm } from '@/components/checkout/CheckoutForm'
import Image from 'next/image'
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher'
import { getTranslations } from 'next-intl/server'
import { Check, MapPin } from 'lucide-react'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SLUG = 'salesmade-ai-intensive'

export default async function AiIntensiveCheckout({ searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ cancelled?: string }> }) {
  const sp = await searchParams
  const c = await getTranslations('checkout.common')
  const t = await getTranslations('checkout.aiIntensive')
  const CITIES = [`Stuttgart · ${t('stuttgartWhen')}`, `Berlin · ${t('berlinWhen')}`]
  const included = [t('inc1'), t('inc2'), t('inc3'), t('inc4')]
  const TIERS = [{ id: 'ai-intensive-onetime', label: t('tierLabel'), price: 897, currency: 'EUR' as const, billing: 'one-time' as const, stripe_price_id: '', is_highlighted: true, is_available: true, note: t('tierNote') }]

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
            <div className="mb-10">
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-border bg-blue-bg px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue">
                <span className="h-1.5 w-1.5 rounded-full bg-blue" />{t('badge')}
              </span>
              <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-ink sm:text-5xl">
                {t('h1pre')} <span className="text-blue">{t('h1accent')}</span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted">{t('intro')}</p>
            </div>

            <section className="mb-10 rounded-2xl border border-gray-100 bg-cream p-8">
              <h2 className="text-2xl font-bold text-ink sm:text-3xl">{t('whatsIn')}</h2>
              <ul className="mt-5 space-y-3">
                {included.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-sm text-gray-700">
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue text-white"><Check size={12} /></span>
                    {b}
                  </li>
                ))}
              </ul>
            </section>

            <section className="mb-4">
              <h2 className="text-2xl font-bold text-ink sm:text-3xl">{t('twoCities')}</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[{ c: 'Stuttgart', w: t('stuttgartWhen') }, { c: 'Berlin', w: t('berlinWhen') }].map((d) => (
                  <div key={d.c} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                    <MapPin size={18} className="text-blue" />
                    <div><p className="font-bold text-ink">{d.c}</p><p className="text-xs text-muted">{d.w}</p></div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-muted">{t('smallCircle')}</p>
            </section>
          </main>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <CheckoutForm programSlug={SLUG} programName="SalesMade AI Intensive" tiers={TIERS} cities={CITIES} maxSeats={5} />
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
