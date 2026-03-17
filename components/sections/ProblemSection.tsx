import { useTranslations } from 'next-intl'
import { Target, Zap, GraduationCap, Users } from 'lucide-react'

const CARDS = [
  { titleKey: 'card1Title', textKey: 'card1Text', Icon: Target },
  { titleKey: 'card2Title', textKey: 'card2Text', Icon: Zap },
  { titleKey: 'card3Title', textKey: 'card3Text', Icon: GraduationCap },
  { titleKey: 'card4Title', textKey: 'card4Text', Icon: Users },
] as const

export function ProblemSection() {
  const t = useTranslations('problem')

  return (
    <section className="px-6 py-20" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="mx-auto max-w-7xl">
        {/* Left-aligned headline block */}
        <div className="mb-12">
          <span
            className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4"
            style={{ backgroundColor: '#FFF1EB', color: '#F05A1A' }}
          >
            {t('eyebrow')}
          </span>
          <h2 className="text-4xl font-bold leading-tight sm:text-5xl" style={{ color: '#0D0D0B' }}>
            {t('headline').split('\n').map((line, i) => (
              <span key={i}>
                {line}
                {i === 0 && <br />}
              </span>
            ))}
          </h2>
        </div>

        {/* 2×2 grid */}
        <div className="grid gap-6 sm:grid-cols-2">
          {CARDS.map(({ titleKey, textKey, Icon }) => (
            <div
              key={titleKey}
              className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100"
            >
              <div
                className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ backgroundColor: '#FFF1EB' }}
              >
                <Icon size={22} style={{ color: '#F05A1A' }} />
              </div>
              <h3 className="mb-2 text-lg font-bold" style={{ color: '#0D0D0B' }}>
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
