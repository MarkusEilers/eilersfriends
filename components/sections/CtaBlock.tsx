import { useTranslations } from 'next-intl'
import { Users, ArrowRight } from 'lucide-react'

export function CtaBlock() {
  const t = useTranslations('cta')

  return (
    <section className="px-6 py-20" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="mx-auto max-w-6xl">
        <div
          className="relative overflow-hidden rounded-3xl px-8 py-14 sm:px-16 sm:py-20 text-center"
          style={{
            background: 'linear-gradient(135deg, #F05A1A 0%, #FF8B4D 100%)',
            color: 'white',
          }}
        >
          {/* Eyebrow with icon */}
          <div className="inline-flex items-center gap-2 mb-6">
            <Users size={20} />
            <span className="text-sm font-bold uppercase tracking-widest">
              {t('eyebrow')}
            </span>
          </div>

          {/* Headline */}
          <h2 className="text-2xl font-bold leading-snug sm:text-3xl lg:text-4xl mx-auto max-w-3xl">
            {t('headline')}
          </h2>

          {/* CTA Button */}
          <div className="mt-10">
            <a
              href="https://calendly.com/eilersfriends"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold transition-opacity hover:opacity-90"
              style={{ color: '#F05A1A' }}
            >
              {t('button')} <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
