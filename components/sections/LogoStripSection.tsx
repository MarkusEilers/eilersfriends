import { useTranslations } from 'next-intl'
import { LogoScrollbar } from '@/components/blocks/LogoScrollbar'

const LOGOS = [
  { name: 'Amazon' },
  { name: 'Microsoft' },
  { name: 'Wall Street Journal' },
  { name: 'Barnes & Noble' },
  { name: 'USA Today' },
  { name: 'IZF' },
  { name: 'Handelsblatt' },
  { name: 'Forbes' },
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
