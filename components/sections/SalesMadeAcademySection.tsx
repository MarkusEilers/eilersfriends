import { useTranslations } from 'next-intl'
import { Sparkles, Target, Zap, Users, Shield, Award, ArrowRight } from 'lucide-react'
import { Link } from '@/lib/i18n/navigation'

export function SalesMadeAcademySection() {
  const t = useTranslations('academy')

  return (
    <section className="px-6 py-20 bg-white">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="text-center mb-12">
          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-6"
            style={{ backgroundColor: '#EBF1FF', color: '#1A5FD4' }}
          >
            <Sparkles size={12} />
            {t('pill')}
          </span>
          <h2 className="text-4xl font-bold sm:text-5xl mb-4" style={{ color: '#0D0D0B' }}>
            {t('headline')}
          </h2>
          <p className="text-xl font-semibold mb-6" style={{ color: '#1A5FD4' }}>
            {t('tagline')}
          </p>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-gray-600">
            {t('subtext')}
          </p>
        </div>

        {/* Two Step Cards */}
        <div className="grid gap-6 md:grid-cols-2 mb-12">
          {/* Step 1 */}
          <div
            className="rounded-3xl p-8"
            style={{ backgroundColor: '#EBF1FF', border: '1.5px solid #BBCFF5' }}
          >
            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4"
              style={{ backgroundColor: 'white', color: '#1A5FD4' }}
            >
              <Target size={12} /> Step 1
            </span>
            <h3 className="text-xl font-bold mb-3" style={{ color: '#0D0D0B' }}>
              {t('step1Title')}
            </h3>
            <p className="text-sm leading-relaxed text-gray-600">
              {t('step1Desc')}
            </p>
          </div>

          {/* Step 2 */}
          <div
            className="rounded-3xl p-8"
            style={{ backgroundColor: '#EDFAF3', border: '1.5px solid #A7E9C4' }}
          >
            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4"
              style={{ backgroundColor: 'white', color: '#157A45' }}
            >
              <Zap size={12} /> Step 2
            </span>
            <h3 className="text-xl font-bold mb-3" style={{ color: '#0D0D0B' }}>
              {t('step2Title')}
            </h3>
            <p className="text-sm leading-relaxed text-gray-600">
              {t('step2Desc')}
            </p>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-4 sm:gap-8 mb-10">
          {[
            { v: t('stat1Value'), l: t('stat1Label') },
            { v: t('stat2Value'), l: t('stat2Label') },
            { v: t('stat3Value'), l: t('stat3Label') },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <div className="text-3xl sm:text-4xl font-bold" style={{ color: '#1A5FD4' }}>
                {s.v}
              </div>
              <div className="mt-1 text-xs sm:text-sm text-gray-500">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Trust pills */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mb-10 text-sm text-gray-600">
          <span className="inline-flex items-center gap-2">
            <Users size={16} style={{ color: '#1A5FD4' }} />
            {t('trust1')}
          </span>
          <span className="inline-flex items-center gap-2">
            <Shield size={16} style={{ color: '#1A5FD4' }} />
            {t('trust2')}
          </span>
          <span className="inline-flex items-center gap-2">
            <Award size={16} style={{ color: '#1A5FD4' }} />
            {t('trust3')}
          </span>
        </div>

        {/* Single CTA */}
        <div className="text-center">
          <Link
            href={'/salesmade' as '/'}
            className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#1A5FD4' }}
          >
            {t('cta')} <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  )
}
