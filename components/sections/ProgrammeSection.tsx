import { useTranslations } from 'next-intl'
import { Check, ArrowRight, TrendingUp, Sparkles, Users } from 'lucide-react'
import { Link } from '@/lib/i18n/navigation'

const PROGRAMS = [
  {
    key: 'card1',
    icon: TrendingUp,
    accent: '#F05A1A',
    accentBg: '#FFF1EB',
    href: '/salesmade',
    popular: true,
    features: ['card1F1', 'card1F2', 'card1F3', 'card1F4'],
  },
  {
    key: 'card2',
    icon: Sparkles,
    accent: '#D4192B',
    accentBg: '#FFEBEC',
    href: '/aljona#liquid',
    popular: false,
    features: ['card2F1', 'card2F2', 'card2F3', 'card2F4'],
  },
  {
    key: 'card3',
    icon: Users,
    accent: '#1A5FD4',
    accentBg: '#EBF1FF',
    href: '/kontakt',
    popular: false,
    features: ['card3F1', 'card3F2', 'card3F3', 'card3F4'],
  },
] as const

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

        {/* 3 cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {PROGRAMS.map((p) => {
            const Icon = p.icon
            const isPopular = p.popular
            return (
              <div
                key={p.key}
                className="relative flex flex-col rounded-3xl bg-white p-7"
                style={{
                  border: isPopular ? `2px solid ${p.accent}` : '1px solid #E5E7EB',
                  boxShadow: isPopular ? `0 12px 32px -16px ${p.accent}40` : undefined,
                }}
              >
                {/* Popular badge */}
                {isPopular && (
                  <span
                    className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest text-white"
                    style={{ backgroundColor: p.accent }}
                  >
                    {t('card1Badge')}
                  </span>
                )}

                {/* Icon tile */}
                <div
                  className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: p.accentBg }}
                >
                  <Icon size={20} style={{ color: p.accent }} />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold mb-3" style={{ color: '#0D0D0B' }}>
                  {t(`${p.key}Title`)}
                </h3>

                {/* Description */}
                <p className="text-sm leading-relaxed text-gray-600 mb-6 flex-1">
                  {t(`${p.key}Text`)}
                </p>

                {/* Feature list */}
                <ul className="space-y-2.5 mb-8">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-gray-700">
                      <Check size={16} className="mt-0.5 flex-shrink-0" style={{ color: p.accent }} />
                      <span>{t(f)}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href={p.href as '/'}
                  className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-colors"
                  style={
                    isPopular
                      ? { backgroundColor: '#0F1E3A', color: 'white' }
                      : { color: p.accent, border: `1.5px solid ${p.accent}40`, backgroundColor: 'white' }
                  }
                >
                  {t(`${p.key}Cta`)} <ArrowRight size={14} />
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
