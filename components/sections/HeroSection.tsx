'use client'

import { useTranslations } from 'next-intl'
import { Calendar } from 'lucide-react'
import { Link } from '@/lib/i18n/navigation'
import { AnimatedNumber } from '@/components/blocks/AnimatedNumber'

export function HeroSection() {
  const t = useTranslations('hero')

  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-14 sm:pt-24" style={{ backgroundColor: '#FAFAF8' }}>
      {/* Decorative background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full opacity-[0.12] blur-3xl" style={{ backgroundColor: '#F05A1A' }} />
        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full opacity-[0.10] blur-3xl" style={{ backgroundColor: '#1A5FD4' }} />
      </div>

      <div className="relative mx-auto max-w-5xl">
        {/* Tag */}
        <div className="mb-8 flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold" style={{ color: '#F05A1A', backgroundColor: '#FFF1EB', borderColor: '#FECDBB' }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#F05A1A' }} />
            {t('pill1')}
          </span>
        </div>

        {/* H1 */}
        <h1 className="text-center text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-[4rem]" style={{ color: '#0D0D0B' }}>
          {t('headline1')}{' '}
          <span className="font-serif italic" style={{ color: '#F05A1A', fontFamily: 'DM Serif Display, serif' }}>
            {t('headlineAccent')}
          </span>
          <br />
          {t('headline2')}{' '}
          <span style={{ color: '#1A5FD4' }}>
            {t('headlineBlue')}
          </span>
        </h1>

        {/* Subtext */}
        <p className="mx-auto mt-6 max-w-2xl text-center text-base leading-relaxed text-gray-500 sm:text-lg">
          {t('subtext')}
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a
            href="https://calendly.com/eilersfriends"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#F05A1A' }}
          >
            <Calendar size={16} />
            {t('ctaPrimary')}
          </a>
          <Link
            href="/programme"
            className="rounded-full border border-gray-200 bg-white px-7 py-3.5 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
          >
            {t('ctaSecondary')} →
          </Link>
        </div>

        {/* Stats row */}
        <div className="mt-16 grid grid-cols-2 divide-x divide-gray-200 rounded-2xl border border-gray-200 bg-white shadow-sm sm:grid-cols-4">
          {/* Stat 1: Orange */}
          <div className="flex flex-col items-center gap-1 px-4 py-7">
            <span className="text-3xl font-bold sm:text-4xl" style={{ color: '#F05A1A' }}>
              <AnimatedNumber value={867} suffix="+" />
            </span>
            <span className="text-xs text-gray-400 font-medium">{t('stat1Label')}</span>
          </div>

          {/* Stat 2: Blue */}
          <div className="flex flex-col items-center gap-1 px-4 py-7">
            <span className="text-3xl font-bold sm:text-4xl" style={{ color: '#1A5FD4' }}>
              <AnimatedNumber value={48} suffix="%" />
            </span>
            <span className="text-xs text-gray-400 font-medium">{t('stat2Label')}</span>
          </div>

          {/* Stat 3: Red */}
          <div className="flex flex-col items-center gap-1 px-4 py-7">
            <span className="text-3xl font-bold sm:text-4xl" style={{ color: '#D4192B' }}>
              <AnimatedNumber value={90} suffix="%+" />
            </span>
            <span className="text-xs text-gray-400 font-medium">{t('stat3Label')}</span>
          </div>

          {/* Stat 4: Serif */}
          <div className="flex flex-col items-center gap-1 px-4 py-7">
            <span className="inline-flex items-baseline gap-0.5 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              <AnimatedNumber value={15} />
              <span className="font-serif italic" style={{ fontFamily: 'DM Serif Display, serif', fontSize: '2.25rem', lineHeight: 1 }}>
                {' '}{t('stat4Unit')}
              </span>
            </span>
            <span className="text-xs text-gray-400 font-medium">{t('stat4Label')}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
