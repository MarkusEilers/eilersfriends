import { useTranslations } from 'next-intl'
import { TrendingDown, BrainCircuit, Shuffle } from 'lucide-react'
import { SectionHeader } from '@/components/blocks/SectionHeader'

const ICONS = [TrendingDown, BrainCircuit, Shuffle]

export function ProblemSection() {
  const t = useTranslations('problem')

  const cards = [
    { titleKey: 'card1Title', textKey: 'card1Text', Icon: ICONS[0] },
    { titleKey: 'card2Title', textKey: 'card2Text', Icon: ICONS[1] },
    { titleKey: 'card3Title', textKey: 'card3Text', Icon: ICONS[2] },
  ] as const

  return (
    <section className="bg-white px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow={t('eyebrow')}
          headline={t('headline')}
          color="orange"
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {cards.map(({ titleKey, textKey, Icon }) => (
            <div
              key={titleKey}
              className="rounded-2xl border border-gray-200 bg-white p-7 transition-shadow hover:shadow-md"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-orange-bg" style={{ backgroundColor: '#FFF1EB' }}>
                <Icon size={22} style={{ color: '#F05A1A' }} />
              </div>
              <h3 className="mb-2 text-base font-bold text-ink" style={{ color: '#0D0D0B' }}>
                {t(titleKey)}
              </h3>
              <p className="text-sm leading-relaxed text-gray-600">
                {t(textKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
