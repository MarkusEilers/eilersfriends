import { useTranslations } from 'next-intl'
import { ArrowRight } from 'lucide-react'
import { Link } from '@/lib/i18n/navigation'
import { SectionHeader } from '@/components/blocks/SectionHeader'
import { PillTag } from '@/components/blocks/PillTag'

export function BentoGrid() {
  const t = useTranslations('bento')

  return (
    <section className="bg-gray-50 px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow={t('eyebrow')}
          headline={t('headline')}
          color="orange"
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* SalesMade — 2×2 featured */}
          <div
            className="group relative overflow-hidden rounded-3xl p-8 sm:col-span-2 sm:row-span-2 flex flex-col justify-between min-h-[280px]"
            style={{ backgroundColor: '#FFF1EB', border: '1.5px solid #FECDBB' }}
          >
            <div>
              <PillTag color="orange">{t('salesmade.eyebrow')}</PillTag>
              <h3 className="mt-4 text-2xl font-bold text-ink" style={{ color: '#0D0D0B' }}>
                {t('salesmade.title')}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {t('salesmade.text')}
              </p>
            </div>
            <Link
              href="/salesmade"
              className="mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 self-start"
              style={{ backgroundColor: '#F05A1A' }}
            >
              Mehr erfahren <ArrowRight size={14} />
            </Link>
          </div>

          {/* Markus — blue */}
          <div
            className="rounded-3xl p-6 flex flex-col justify-between min-h-[130px]"
            style={{ backgroundColor: '#EBF1FF', border: '1.5px solid #BBCFF5' }}
          >
            <PillTag color="blue">{t('markus.eyebrow')}</PillTag>
            <div>
              <h3 className="mt-3 text-lg font-bold" style={{ color: '#0D0D0B' }}>{t('markus.title')}</h3>
              <p className="mt-1 text-xs text-gray-600">{t('markus.text')}</p>
            </div>
            <Link href="/markus" className="mt-4 text-xs font-semibold" style={{ color: '#1A5FD4' }}>
              → Mehr
            </Link>
          </div>

          {/* Aljona — red */}
          <div
            className="rounded-3xl p-6 flex flex-col justify-between min-h-[130px]"
            style={{ backgroundColor: '#FFEBEC', border: '1.5px solid #F5BBBC' }}
          >
            <PillTag color="red">{t('aljona.eyebrow')}</PillTag>
            <div>
              <h3 className="mt-3 text-lg font-bold" style={{ color: '#0D0D0B' }}>{t('aljona.title')}</h3>
              <p className="mt-1 text-xs text-gray-600">{t('aljona.text')}</p>
            </div>
            <Link href="/aljona" className="mt-4 text-xs font-semibold" style={{ color: '#D4192B' }}>
              → Mehr
            </Link>
          </div>

          {/* Liquid Leadership — spans 2 columns */}
          <div
            className="rounded-3xl p-6 flex flex-col justify-between sm:col-span-2 min-h-[130px]"
            style={{ backgroundColor: '#FFF1EB', border: '1.5px solid #FECDBB' }}
          >
            <PillTag color="orange">{t('liquid.eyebrow')}</PillTag>
            <div>
              <h3 className="mt-3 text-lg font-bold" style={{ color: '#0D0D0B' }}>{t('liquid.title')}</h3>
              <p className="mt-1 text-xs text-gray-600">{t('liquid.text')}</p>
            </div>
            <Link href="/aljona#liquid" className="mt-4 text-xs font-semibold" style={{ color: '#F05A1A' }}>
              → Mehr
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
