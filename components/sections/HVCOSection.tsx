import { useTranslations } from 'next-intl'
import { FileText, ClipboardCheck, Play, ArrowRight } from 'lucide-react'
import { Link } from '@/lib/i18n/navigation'
import { SectionHeader } from '@/components/blocks/SectionHeader'

export function HVCOSection() {
  const t = useTranslations('hvco')

  const resources = [
    {
      Icon: FileText,
      titleKey: 'resource1Title',
      textKey: 'resource1Text',
      ctaKey: 'resource1Cta',
      href: '/b2b-offers',
      featured: true,
      color: '#1A5FD4',
      bg: '#EBF1FF',
    },
    {
      Icon: ClipboardCheck,
      titleKey: 'resource2Title',
      textKey: 'resource2Text',
      ctaKey: 'resource2Cta',
      href: '/salesmade#pricing',
      featured: false,
      color: '#F05A1A',
      bg: '#FFF1EB',
    },
    {
      Icon: Play,
      titleKey: 'resource3Title',
      textKey: 'resource3Text',
      ctaKey: 'resource3Cta',
      href: '/kontakt',
      featured: false,
      color: '#6B5CE7',
      bg: '#F0EEFF',
    },
  ] as const

  return (
    <section className="bg-white px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow={t('eyebrow')}
          headline={t('headline')}
          color="blue"
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {resources.map(({ Icon, titleKey, textKey, ctaKey, href, featured, color, bg }) => (
            <div
              key={titleKey}
              className={`rounded-2xl p-7 flex flex-col gap-4 ${featured ? 'border-2 shadow-md' : 'border border-gray-200'}`}
              style={featured ? { borderColor: color, backgroundColor: bg } : {}}
            >
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ backgroundColor: featured ? color + '20' : bg }}
              >
                <Icon size={22} style={{ color }} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-ink" style={{ color: '#0D0D0B' }}>
                  {t(titleKey)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{t(textKey)}</p>
              </div>
              <Link
                href={href as '/'}
                className="inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-80"
                style={{ color }}
              >
                {t(ctaKey)} <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
