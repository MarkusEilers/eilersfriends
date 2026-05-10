import { useTranslations } from 'next-intl'
import { LogoScrollbar } from '@/components/blocks/LogoScrollbar'

/**
 * Trust-Logo-Strip — partner / press logos.
 *
 * Each logo lives in /public/logos/<slug>.{svg,png} as an "on-white" version
 * (i.e. the dark version designed to render on a light background). Files
 * still missing fall through to the text label so the strip never breaks.
 */
// TODO: re-add `src: '/logos/<slug>.svg'` once on-white logo files are
// uploaded to /public/logos/. Until then we show text labels.
const LOGOS = [
  { name: 'Wall Street Journal' },
  { name: 'Forbes' },
  { name: 'Handelsblatt' },
  { name: 'USA Today' },
  { name: 'Microsoft' },
  { name: 'Amazon' },
  { name: 'Sonia.so' },
  { name: 'Celero One' },
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
