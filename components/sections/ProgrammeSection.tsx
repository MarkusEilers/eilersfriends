import { useTranslations } from 'next-intl'
import { ArrowRight } from 'lucide-react'
import { Link } from '@/lib/i18n/navigation'
import { KaroPatternCorner } from '@/components/blocks/KaroPattern'

export function ProgrammeSection() {
  const t = useTranslations('programme')

  return (
    <section id="programme" className="px-6 py-20" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-12 text-center">
          <span
            className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4"
            style={{ backgroundColor: '#FFF1EB', color: '#F05A1A' }}
          >
            {t('eyebrow')}
          </span>
          <h2 className="text-4xl font-bold sm:text-5xl" style={{ color: '#0D0D0B' }}>
            {t('headline')}
          </h2>
        </div>

        {/* 3-column cards */}
        <div className="grid gap-6 sm:grid-cols-3">

          {/* Card 1: SalesMade Academy — Orange (Most Popular) */}
          <div
            className="relative flex flex-col rounded-3xl p-7 overflow-hidden"
            style={{ backgroundColor: '#FFF1EB', border: '1.5px solid #FECDBB' }}
          >
            {/* Decorative circle */}
            <KaroPatternCorner color="#F05A1A" opacity={0.10} corner="top-right" size={20} />
            <div className="relative flex-1">
              <h3 className="text-xl font-bold mb-3" style={{ color: '#0D0D0B' }}>
                {t('card1Title')}
              </h3>
              <p className="text-sm leading-relaxed text-gray-600">
                {t('card1Text')}
              </p>
            </div>
            <Link
              href="/salesmade"
              className="relative mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white self-start transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#F05A1A' }}
            >
              {t('card1Cta')} <ArrowRight size={14} />
            </Link>
          </div>

          {/* Card 2: Liquid Leadership — Red */}
          <div
            className="relative flex flex-col rounded-3xl p-7 overflow-hidden"
            style={{ backgroundColor: '#FFEBEC', border: '1.5px solid #F5BBBC' }}
          >
            <KaroPatternCorner color="#D4192B" opacity={0.10} corner="top-right" size={20} />
            <div className="relative flex-1">
              <h3 className="text-xl font-bold mb-3" style={{ color: '#0D0D0B' }}>
                {t('card2Title')}
              </h3>
              <p className="text-sm leading-relaxed text-gray-600">
                {t('card2Text')}
              </p>
            </div>
            <Link
              href="/aljona#liquid"
              className="relative mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 self-start"
              style={{ backgroundColor: '#D4192B', color: 'white' }}
            >
              {t('card2Cta')} <ArrowRight size={14} />
            </Link>
          </div>

          {/* Card 3: B2B Framework HVCO — Blue */}
          <div
            className="relative flex flex-col rounded-3xl p-7 overflow-hidden"
            style={{ backgroundColor: '#EBF1FF', border: '1.5px solid #BBCFF5' }}
          >
            <KaroPatternCorner color="#1A5FD4" opacity={0.10} corner="top-right" size={20} />
            <div className="relative flex-1">
              <h3 className="text-xl font-bold mb-3" style={{ color: '#0D0D0B' }}>
                {t('card3Title')}
              </h3>
              <p className="text-sm leading-relaxed text-gray-600">
                {t('card3Text')}
              </p>
            </div>
            <Link
              href="/b2b-offers"
              className="relative mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white self-start transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#1A5FD4' }}
            >
              {t('card3Cta')} <ArrowRight size={14} />
            </Link>
          </div>

        </div>
      </div>
    </section>
  )
}
