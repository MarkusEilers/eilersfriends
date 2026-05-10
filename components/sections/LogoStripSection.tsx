import { useTranslations } from 'next-intl'
import { LogoScrollbar } from '@/components/blocks/LogoScrollbar'

/**
 * Trust-Logo-Strip — partner / press logos.
 *
 * Each logo lives in /public/logos/<slug>.{svg,png} as an "on-white" version
 * (i.e. the dark version designed to render on a light background). Files
 * still missing fall through to the text label so the strip never breaks.
 */
const LOGOS = [
  { name: 'Wall Street Journal', src: '/logos/wsj.svg' },
  { name: 'Forbes', src: '/logos/forbes.svg' },
  { name: 'Handelsblatt', src: '/logos/handelsblatt.svg' },
  { name: 'USA Today', src: '/logos/usa-today.svg' },
  { name: 'Microsoft', src: '/logos/microsoft.svg' },
  { name: 'Amazon', src: '/logos/amazon.svg' },
  { name: 'Sonia.so', src: '/logos/sonia-so.svg' },
  { name: 'Celero One', src: '/logos/celero-one.svg' },
]

export function LogoStripSection() {
  const t = useTranslations('logos')

  return (
    <section className="border-y border-gray-100 bg-gray-50 py-10">
      <div className="mx-auto mb-6 max-w-7xl px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-gray-400">
          {t('title')}
        </p>
      </div>
      <LogoScrollbar logos={LOGOS} speed="normal" />
    </section>
  )
}
