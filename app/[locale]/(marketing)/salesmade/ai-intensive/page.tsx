import type { Metadata } from 'next'
import { Link } from '@/lib/i18n/navigation'
import { Check, MapPin, ArrowRight, Lock, Sparkles } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

const ACCENT = '#1A5FD4'
const NAVY = '#0F1E3A'
const CHECKOUT = '/checkout/salesmade-ai-intensive'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('aiIntensive')
  return {
    title: t('meta.title'),
    description: t('meta.description'),
  }
}

export default async function AiIntensivePage() {
  const t = await getTranslations('aiIntensive')
  const DATES = t.raw('dates') as { city: string; when: string }[]
  const offerBullets = t.raw('offer.bullets') as string[]
  return (
    <div style={{ backgroundColor: '#FAFAF8' }}>
      {/* HERO */}
      <section className="relative overflow-hidden px-6 py-20 sm:py-28" style={{ backgroundColor: NAVY }}>
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-6"
            style={{ backgroundColor: 'rgba(26,95,212,0.25)', color: '#93B8F5' }}>
            <Lock size={12} /> {t('hero.badge')}
          </span>
          <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">
            {t.rich('hero.title', {
              span: (c) => <span style={{ color: '#93B8F5' }}>{c}</span>
            })}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>
            {t('hero.desc')}
          </p>
          <div className="mt-9 flex flex-col items-center gap-3">
            <Link href={CHECKOUT as '/'}
              className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: ACCENT }}>
              {t('hero.cta')} <ArrowRight size={16} />
            </Link>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{t('hero.priceHint')}</span>
          </div>
        </div>
      </section>

      {/* WAS DU MITNIMMST */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-xs font-bold uppercase tracking-widest" style={{ color: ACCENT }}>{t('blocks.badge')}</p>
          <h2 className="mt-3 text-center text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>{t('blocks.title')}</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: ACCENT }}>{t('blocks.block1.badge')}</span>
              <h3 className="mt-2 text-xl font-bold" style={{ color: '#0D0D0B' }}>{t('blocks.block1.title')}</h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                {t('blocks.block1.desc')}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest" style={{ color: ACCENT }}>
                <Sparkles size={12} /> {t('blocks.block2.badge')}
              </span>
              <h3 className="mt-2 text-xl font-bold" style={{ color: '#0D0D0B' }}>{t('blocks.block2.title')}</h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                {t('blocks.block2.desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TERMINE */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>{t('datesTitle')}</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {DATES.map((d) => (
              <div key={d.city} className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: '#EBF1FF' }}>
                  <MapPin size={20} style={{ color: ACCENT }} />
                </div>
                <div>
                  <p className="text-lg font-bold" style={{ color: '#0D0D0B' }}>{d.city}</p>
                  <p className="text-sm text-gray-500">{d.when}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-5 text-center text-sm text-gray-500">{t('datesHint')}</p>
        </div>
      </section>

      {/* ANGEBOT */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-2xl rounded-2xl border p-8 text-center sm:p-10"
          style={{ borderColor: 'rgba(26,95,212,0.2)', backgroundColor: '#EBF1FF' }}>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: ACCENT }}>{t('offer.badge')}</p>
          <div className="mt-3 flex items-baseline justify-center gap-3">
            <span className="text-4xl font-bold" style={{ color: '#0D0D0B' }}>{t('offer.price')}</span>
            <span className="text-lg text-gray-400 line-through">{t('offer.strike')}</span>
          </div>
          <p className="mt-1 text-sm font-semibold" style={{ color: ACCENT }}>{t('offer.priceHint')}</p>
          <ul className="mx-auto mt-6 max-w-md space-y-3 text-left">
            {offerBullets.map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm text-gray-700">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-white" style={{ backgroundColor: ACCENT }}>
                  <Check size={12} />
                </span>
                {b}
              </li>
            ))}
          </ul>
          <Link href={CHECKOUT as '/'}
            className="mt-8 inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90"
            style={{ backgroundColor: ACCENT }}>
            {t('offer.cta')} <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* KNAPPHEIT */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: '#0D0D0B' }}>{t('scarcity.title')}</h2>
          <p className="mt-3 text-base leading-relaxed text-gray-600">
            {t('scarcity.desc')}
          </p>
          <Link href={CHECKOUT as '/'}
            className="mt-7 inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90"
            style={{ backgroundColor: NAVY }}>
            {t('scarcity.cta')} <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  )
}
