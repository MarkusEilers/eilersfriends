import { useTranslations } from 'next-intl'
import { ArrowRight, CheckCircle } from 'lucide-react'
import { Link } from '@/lib/i18n/navigation'

export function SalesMadeAcademySection() {
  const t = useTranslations('academy')

  return (
    <section className="px-6 py-20 bg-white">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">

          {/* Left: Content */}
          <div>
            {/* Pill */}
            <span
              className="inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-6"
              style={{ backgroundColor: '#EBF1FF', color: '#1A5FD4' }}
            >
              {t('pill')}
            </span>

            {/* Eyebrow */}
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#1A5FD4' }}>
              {t('eyebrow')}
            </p>

            {/* Headline */}
            <h2 className="text-4xl font-bold leading-tight sm:text-5xl mb-4" style={{ color: '#0D0D0B' }}>
              {t('headline')}
            </h2>

            {/* Tagline */}
            <p className="text-lg font-semibold italic mb-8" style={{ color: '#1A5FD4' }}>
              {t('tagline')}
            </p>

            {/* Steps */}
            <div className="space-y-4 mb-8">
              {/* Step 1 */}
              <div
                className="rounded-2xl p-5 border"
                style={{ backgroundColor: '#EBF1FF', borderColor: '#BBCFF5' }}
              >
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#1A5FD4' }}>
                  {t('step1Label')}
                </p>
                <h3 className="text-base font-bold mb-1" style={{ color: '#0D0D0B' }}>
                  {t('step1Title')}
                </h3>
                <p className="text-sm text-gray-600">
                  {t('step1Text')}
                </p>
              </div>

              {/* Step 2 */}
              <div
                className="rounded-2xl p-5 border"
                style={{ backgroundColor: '#EDFAF3', borderColor: '#A7E9C4' }}
              >
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#157A45' }}>
                  {t('step2Label')}
                </p>
                <h3 className="text-base font-bold mb-1" style={{ color: '#0D0D0B' }}>
                  {t('step2Title')}
                </h3>
                <p className="text-sm text-gray-600">
                  {t('step2Text')}
                </p>
              </div>
            </div>

            {/* CTA */}
            <Link
              href="/salesmade"
              className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#1A5FD4' }}
            >
              {t('cta')} <ArrowRight size={15} />
            </Link>
          </div>

          {/* Right: Stats + Trust */}
          <div className="flex flex-col gap-6">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: t('stat1Value'), label: t('stat1Label') },
                { value: t('stat2Value'), label: t('stat2Label') },
                { value: t('stat3Value'), label: t('stat3Label') },
              ].map(({ value, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center justify-center rounded-2xl py-8 text-center"
                  style={{ backgroundColor: '#EBF1FF' }}
                >
                  <span className="text-4xl font-bold" style={{ color: '#1A5FD4' }}>{value}</span>
                  <span className="mt-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
                </div>
              ))}
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-3">
              {[t('trust1'), t('trust2'), t('trust3')].map((badge) => (
                <div
                  key={badge}
                  className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold"
                  style={{ borderColor: '#BBCFF5', color: '#1A5FD4', backgroundColor: 'white' }}
                >
                  <CheckCircle size={14} style={{ color: '#1A5FD4' }} />
                  {badge}
                </div>
              ))}
            </div>

            {/* Visual accent card */}
            <div
              className="relative overflow-hidden rounded-3xl p-8"
              style={{ backgroundColor: '#0F1E3A' }}
            >
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-20" style={{ backgroundColor: '#1A5FD4' }} />
              <p className="relative text-sm font-medium leading-relaxed text-white/70">
                &ldquo;Nach 12 Monaten SalesMade Academy hatte unser Team eine Closing-Rate von 67% â das Doppelte von vorher.&rdquo;
              </p>
              <p className="relative mt-4 text-xs font-semibold text-white/50">â Teilnehmer, SalesMade Academy 2025</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
