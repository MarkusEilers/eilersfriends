import { useTranslations } from 'next-intl'
import { Linkedin, ArrowRight } from 'lucide-react'
import { Link } from '@/lib/i18n/navigation'
import { SectionHeader } from '@/components/blocks/SectionHeader'

export function CoachesSection() {
  const t = useTranslations('coaches')

  return (
    <section id="coaches" className="bg-gray-50 px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow={t('eyebrow')}
          headline={t('headline')}
          color="blue"
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {/* Markus Card — blue top border */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white" style={{ borderTopColor: '#1A5FD4', borderTopWidth: '3px' }}>
            <div className="flex gap-5 p-7">
              {/* S/W Photo placeholder */}
              <div
                className="h-20 w-20 flex-shrink-0 rounded-xl bg-gray-200 overflow-hidden"
                style={{ filter: 'grayscale(100%)' }}
              >
                <div className="h-full w-full bg-gradient-to-br from-gray-300 to-gray-400" />
              </div>
              <div className="flex-1">
                {/* Stat chip — blue */}
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold" style={{ backgroundColor: '#EBF1FF', color: '#1A5FD4' }}>
                  {t('markus.stat')}
                </div>
                <h3 className="text-lg font-bold text-ink" style={{ color: '#0D0D0B' }}>{t('markus.name')}</h3>
                <p className="text-xs text-gray-500">{t('markus.role')}</p>
              </div>
            </div>
            <div className="px-7 pb-7">
              <p className="text-sm leading-relaxed text-gray-600">{t('markus.bio')}</p>
              <div className="mt-5 flex items-center gap-3">
                <a
                  href="https://linkedin.com/in/markuseilers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-full border border-blue-border px-4 py-2 text-xs font-semibold transition-colors hover:bg-blue-bg"
                  style={{ color: '#1A5FD4', borderColor: '#BBCFF5' }}
                >
                  <Linkedin size={13} />
                  {t('markus.linkedin')}
                </a>
                <Link
                  href="/markus"
                  className="flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900"
                >
                  {t('markus.cta')} <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>

          {/* Aljona Card — red top border */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white" style={{ borderTopColor: '#D4192B', borderTopWidth: '3px' }}>
            <div className="flex gap-5 p-7">
              <div
                className="h-20 w-20 flex-shrink-0 rounded-xl bg-gray-200 overflow-hidden"
                style={{ filter: 'grayscale(100%)' }}
              >
                <div className="h-full w-full bg-gradient-to-br from-gray-300 to-gray-400" />
              </div>
              <div className="flex-1">
                {/* Stat chip — amber */}
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold" style={{ backgroundColor: '#FFF8E6', color: '#B07C0A' }}>
                  {t('aljona.stat')}
                </div>
                <h3 className="text-lg font-bold text-ink" style={{ color: '#0D0D0B' }}>{t('aljona.name')}</h3>
                <p className="text-xs text-gray-500">{t('aljona.role')}</p>
              </div>
            </div>
            <div className="px-7 pb-7">
              <p className="text-sm leading-relaxed text-gray-600">{t('aljona.bio')}</p>
              <div className="mt-5 flex items-center gap-3">
                <a
                  href="https://linkedin.com/in/aljonaeilers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-full border border-red-border px-4 py-2 text-xs font-semibold transition-colors hover:bg-red-bg"
                  style={{ color: '#D4192B', borderColor: '#F5BBBC' }}
                >
                  <Linkedin size={13} />
                  {t('aljona.linkedin')}
                </a>
                <Link
                  href="/aljona"
                  className="flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900"
                >
                  {t('aljona.cta')} <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
