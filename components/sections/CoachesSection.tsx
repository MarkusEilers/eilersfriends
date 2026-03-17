import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Linkedin, ArrowRight } from 'lucide-react'
import { Link } from '@/lib/i18n/navigation'

export function CoachesSection() {
  const t = useTranslations('coaches')

  return (
    <section id="coaches" className="px-6 py-20" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-14 text-center">
          <span
            className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4"
            style={{ backgroundColor: '#FFF1EB', color: '#F05A1A' }}
          >
            {t('eyebrow')}
          </span>
          <h2 className="text-4xl font-bold sm:text-5xl" style={{ color: '#0D0D0B' }}>
            {t('headline')}
          </h2>
          <p className="mt-4 text-base text-gray-500 max-w-xl mx-auto">
            {t('subtext')}
          </p>
        </div>

        {/* Two coach cards */}
        <div className="grid gap-8 sm:grid-cols-2">

          {/* Markus — Blue accent */}
          <div className="relative overflow-hidden rounded-3xl bg-white shadow-sm border border-gray-100">
            {/* Photo */}
            <div className="relative h-72 w-full overflow-hidden bg-gray-100">
              <Image
                src="/markus-photo.jpg"
                alt="Markus Eilers"
                fill
                className="object-cover object-top"
                style={{ filter: 'grayscale(100%)' }}
              />
              {/* Orange tag overlay */}
              <div className="absolute bottom-4 left-4">
                <span
                  className="inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-md"
                  style={{ backgroundColor: '#F05A1A' }}
                >
                  {t('markus.tag')}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-7">
              {/* Stat chip */}
              <div
                className="mb-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-bold"
                style={{ backgroundColor: '#EBF1FF', color: '#1A5FD4' }}
              >
                {t('markus.stat')}
              </div>
              <h3 className="text-xl font-bold" style={{ color: '#0D0D0B' }}>
                {t('markus.name')}
              </h3>
              <p className="text-xs text-gray-400 mb-3">{t('markus.role')}</p>
              <p className="text-sm leading-relaxed text-gray-600 mb-5">
                {t('markus.bio')}
              </p>
              <div className="flex items-center gap-3">
                <a
                  href="https://linkedin.com/in/markuseilers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-colors hover:bg-blue-50"
                  style={{ color: '#1A5FD4', borderColor: '#BBCFF5' }}
                >
                  <Linkedin size={13} />
                  {t('markus.linkedin')}
                </a>
                <Link
                  href="/markus"
                  className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-900"
                >
                  {t('markus.cta')} <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>

          {/* Aljona — Amber accent */}
          <div className="relative overflow-hidden rounded-3xl bg-white shadow-sm border border-gray-100">
            {/* Photo */}
            <div className="relative h-72 w-full overflow-hidden bg-gray-100">
              <Image
                src="/aljona-photo.jpg"
                alt="Aljona Eilers"
                fill
                className="object-cover object-top"
                style={{ filter: 'grayscale(100%)' }}
              />
              {/* Orange tag overlay */}
              <div className="absolute bottom-4 left-4">
                <span
                  className="inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-md"
                  style={{ backgroundColor: '#F05A1A' }}
                >
                  {t('aljona.tag')}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-7">
              {/* Stat chip */}
              <div
                className="mb-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-bold"
                style={{ backgroundColor: '#FFF8E6', color: '#B07C0A' }}
              >
                {t('aljona.stat')}
              </div>
              <h3 className="text-xl font-bold" style={{ color: '#0D0D0B' }}>
                {t('aljona.name')}
              </h3>
              <p className="text-xs text-gray-400 mb-3">{t('aljona.role')}</p>
              <p className="text-sm leading-relaxed text-gray-600 mb-5">
                {t('aljona.bio')}
              </p>
              <div className="flex items-center gap-3">
                <a
                  href="https://linkedin.com/in/aljonaeilers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-colors hover:bg-red-50"
                  style={{ color: '#D4192B', borderColor: '#F5BBBC' }}
                >
                  <Linkedin size={13} />
                  {t('aljona.linkedin')}
                </a>
                <Link
                  href="/aljona"
                  className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-900"
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
