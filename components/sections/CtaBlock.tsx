import { useTranslations } from 'next-intl'
import { Calendar } from 'lucide-react'

export function CtaBlock() {
  const t = useTranslations('cta')

  return (
    <section
      className="relative overflow-hidden px-6 py-20 bg-grid-texture"
      style={{ backgroundColor: '#0F1E3A' }}
    >
      <div className="relative mx-auto max-w-3xl text-center">
        {/* Eyebrow */}
        <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest" style={{ backgroundColor: '#F05A1A20', color: '#F05A1A', border: '1px solid #F05A1A40' }}>
          {t('eyebrow')}
        </span>

        {/* Headline */}
        <h2 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
          {t('headline')}
        </h2>

        {/* Subtext */}
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/60">
          {t('subtext')}
        </p>

        {/* CTA Button */}
        <div className="mt-8 flex flex-col items-center gap-2">
          <a
            href="https://calendly.com/eilersfriends"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 rounded-full px-8 py-4 text-base font-bold text-white shadow-lg transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#F05A1A' }}
          >
            <Calendar size={18} />
            {t('button')}
          </a>
          <span className="text-xs text-white/40">{t('note')}</span>
        </div>
      </div>
    </section>
  )
}
