import { ArrowRight, TrendingUp, Users, Layers, Mic } from 'lucide-react'
import { Link } from '@/lib/i18n/navigation'
import { SectionHeader } from '@/components/blocks/SectionHeader'
import { useTranslations } from 'next-intl'
import { KaroPatternCorner } from '@/components/blocks/KaroPattern'

export function BentoGrid() {
  const t = useTranslations('bento')

  return (
    <section id="frameworks" className="bg-white px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow={t('eyebrow')}
          headline={t('headline')}
          color="orange"
        />

        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          {/* Left: SalesMade — hero card (blue, Karo-Paper background) */}
          <div
            className="relative overflow-hidden rounded-3xl p-8 flex flex-col justify-between min-h-[360px]"
            style={{
              backgroundColor: '#EBF1FF',
              border: '1.5px solid #BBCFF5',
              backgroundImage:
                'linear-gradient(rgba(26,95,212,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(26,95,212,0.06) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          >
            <div className="relative">
              <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide" style={{ color: '#1A5FD4', borderColor: '#BBCFF5', backgroundColor: 'white' }}>
                Academy
              </span>
              <h3 className="mt-5 text-2xl font-bold leading-tight" style={{ color: '#0D0D0B' }}>
                {t('salesmade.title')}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-600 max-w-xs">
                {t('salesmade.text')}
              </p>

              {/* Feature badges */}
              <div className="mt-5 flex flex-wrap gap-2">
                {(t.raw('salesmade.badges') as string[]).map((f) => (
                  <span key={f} className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: '#BBCFF5', color: '#0F1E3A' }}>
                    {f}
                  </span>
                ))}
              </div>
            </div>

            <Link
              href="/salesmade"
              className="relative mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white self-start transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#1A5FD4' }}
            >
              {t('salesmade.cta')} <ArrowRight size={14} />
            </Link>
          </div>

          {/* Right: 2x2 grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Markus */}
            <div
              className="rounded-3xl p-6 flex flex-col gap-3"
              style={{ backgroundColor: '#EBF1FF', border: '1.5px solid #BBCFF5' }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: '#BBCFF5' }}>
                <TrendingUp size={18} style={{ color: '#1A5FD4' }} />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wide" style={{ color: '#1A5FD4' }}>{t('markus.eyebrowTag')}</span>
                <h3 className="mt-1 text-base font-bold" style={{ color: '#0D0D0B' }}>{t('markus.title')}</h3>
                <p className="mt-1 text-xs leading-relaxed text-gray-600">{t('markus.text')}</p>
              </div>
              <Link href="/markus" className="mt-auto inline-flex items-center gap-1 text-xs font-semibold" style={{ color: '#1A5FD4' }}>
                {t('markus.cta')} <ArrowRight size={12} />
              </Link>
            </div>

            {/* Aljona */}
            <div
              className="rounded-3xl p-6 flex flex-col gap-3"
              style={{ backgroundColor: '#FFEBEC', border: '1.5px solid #F5BBBC' }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: '#F5BBBC' }}>
                <Users size={18} style={{ color: '#EB0028' }} />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wide" style={{ color: '#EB0028' }}>{t('aljona.eyebrowTag')}</span>
                <h3 className="mt-1 text-base font-bold" style={{ color: '#0D0D0B' }}>{t('aljona.title')}</h3>
                <p className="mt-1 text-xs leading-relaxed text-gray-600">{t('aljona.text')}</p>
              </div>
              <Link href="/aljona" className="mt-auto inline-flex items-center gap-1 text-xs font-semibold" style={{ color: '#EB0028' }}>
                {t('aljona.cta')} <ArrowRight size={12} />
              </Link>
            </div>

            {/* Liquid Leadership — spans both columns */}
            <div
              className="col-span-2 rounded-3xl p-6 flex flex-col gap-3"
              style={{ backgroundColor: '#FFEBEC', border: '1.5px solid #F5BBBC' }}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: '#F5BBBC' }}>
                  <Layers size={18} style={{ color: '#EB0028' }} />
                </div>
                <div className="flex-1">
                  <span className="text-xs font-bold uppercase tracking-wide" style={{ color: '#EB0028' }}>Framework</span>
                  <h3 className="mt-1 text-base font-bold" style={{ color: '#0D0D0B' }}>{t('liquid.title')}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-gray-600">{t('liquid.text')}</p>
                </div>
                <Link href="/aljona#liquid" className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-semibold self-start mt-1" style={{ color: '#EB0028' }}>
                  {t('liquid.cta')} <ArrowRight size={12} />
                </Link>
              </div>
            </div>

            {/* Liquid Leadership Podcast — spans both columns, red with cover backdrop */}
            <a
              href="https://www.youtube.com/@liquid.leadership"
              target="_blank"
              rel="noopener noreferrer"
              className="col-span-2 relative overflow-hidden rounded-3xl p-6 flex flex-col gap-3 group transition-transform hover:-translate-y-0.5"
              style={{
                backgroundColor: '#7A0D17',
                color: '#FFF',
                border: '1.5px solid #EB0028',
                minHeight: 180,
              }}
            >
              {/* Photo backdrop */}
              <div
                className="absolute inset-0 pointer-events-none"
                aria-hidden="true"
                style={{
                  backgroundImage: 'url(/liquid-leadership-cover.jpg)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'right center',
                  opacity: 0.50,
                }}
              />
              {/* Tonal lift */}
              <div
                className="absolute inset-0 pointer-events-none"
                aria-hidden="true"
                style={{
                  background:
                    'linear-gradient(90deg, rgba(122,13,23,0.92) 0%, rgba(122,13,23,0.70) 50%, rgba(122,13,23,0.20) 100%)',
                }}
              />
              <div className="relative flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}>
                  <Mic size={18} />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: 'rgba(255,255,255,0.75)' }}>{t('podcast.badge')}</span>
                  <h3 className="mt-1 text-base font-bold">{t('podcast.title')}</h3>
                  <p className="mt-1 text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.78)' }}>
                    {t('podcast.text')}
                  </p>
                </div>
                <span className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-semibold self-start mt-1">
                  {t('podcast.cta')} <ArrowRight size={12} />
                </span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
