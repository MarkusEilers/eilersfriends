// app/[locale]/checkout/page.tsx — Übersicht aktueller Angebote (Standard-Chrome)
import type { Metadata } from 'next'
import { Topbar } from '@/components/layout/Topbar'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Link } from '@/lib/i18n/navigation'
import { getTranslations } from 'next-intl/server'
import { GraduationCap, Sparkles, Search, ArrowRight } from 'lucide-react'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('checkout.overview')
  return { title: t('metaTitle'), description: t('metaDesc') }
}

export default async function CheckoutIndex() {
  const t = await getTranslations('checkout.overview')
  const OFFERS = [
    { key: 'academy', title: 'SalesMade Academy · Premium', href: '/checkout/salesmade-academy-premium', icon: 'academy' as const },
    { key: 'workshop', title: 'SalesMade AI Intensive', href: '/checkout/salesmade-ai-intensive', icon: 'workshop' as const },
    { key: 'mystery', title: 'Mystery Shopping', href: '/checkout/mystery-shopping', icon: 'mystery' as const },
  ]
  return (
    <>
      <Topbar />
      <Navbar />
      <main style={{ backgroundColor: '#FAFAF8' }}>
        <section className="px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#1A5FD4' }}>{t('eyebrow')}</p>
              <h1 className="mt-3 text-4xl font-bold sm:text-5xl" style={{ color: '#0D0D0B' }}>{t('title')}</h1>
              <p className="mt-4 text-base leading-relaxed text-gray-600">{t('intro')}</p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              {OFFERS.map((o) => {
                const Icon = o.icon === 'academy' ? GraduationCap : o.icon === 'mystery' ? Search : Sparkles
                return (
                  <Link key={o.href} href={o.href as '/'}
                    className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-7 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: '#EBF1FF' }}>
                        <Icon size={20} style={{ color: '#1A5FD4' }} />
                      </span>
                      <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest" style={{ backgroundColor: '#EBF1FF', color: '#1A5FD4' }}>{t(`${o.key}Tag`)}</span>
                    </div>
                    <h2 className="mt-5 text-xl font-bold" style={{ color: '#0D0D0B' }}>{o.title}</h2>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-gray-600">{t(`${o.key}Desc`)}</p>
                    <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                      <span className="text-sm font-semibold" style={{ color: '#0D0D0B' }}>{t(`${o.key}Price`)}</span>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold transition-colors" style={{ color: '#1A5FD4' }}>
                        {t('toOffer')} <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
