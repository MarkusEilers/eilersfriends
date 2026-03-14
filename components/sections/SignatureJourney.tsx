import { useTranslations } from 'next-intl'
import { ArrowRight } from 'lucide-react'
import { SectionHeader } from '@/components/blocks/SectionHeader'

const PHASES = ['phase1', 'phase2', 'phase3', 'phase4'] as const
const PHASE_COLORS = ['#F05A1A', '#1A5FD4', '#D4192B', '#6B5CE7']

export function SignatureJourney() {
  const t = useTranslations('journey')

  return (
    <section className="bg-white px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow={t('eyebrow')}
          headline={t('headline')}
          color="orange"
        />

        <div className="mt-14 flex flex-col items-center gap-4 lg:flex-row lg:items-stretch lg:gap-0">
          {/* Bad Place */}
          <div className="flex w-full items-center justify-center rounded-2xl border-2 border-red-border bg-red-bg px-6 py-8 text-center lg:w-48 lg:flex-shrink-0" style={{ backgroundColor: '#FFEBEC', borderColor: '#F5BBBC' }}>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#D4192B' }}>Start</span>
              <p className="mt-2 text-sm font-semibold text-gray-800">{t('badPlace')}</p>
            </div>
          </div>

          {/* Arrow */}
          <div className="hidden items-center px-2 lg:flex">
            <ArrowRight size={20} className="text-gray-300" />
          </div>

          {/* Phases */}
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            {PHASES.map((phase, i) => (
              <div
                key={phase}
                className="flex flex-1 flex-col items-center justify-center rounded-2xl border px-5 py-7 text-center"
                style={{
                  borderColor: PHASE_COLORS[i] + '40',
                  backgroundColor: PHASE_COLORS[i] + '0A',
                }}
              >
                <span
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: PHASE_COLORS[i] }}
                >
                  Phase {i + 1}
                </span>
                <p className="mt-2 text-sm font-semibold text-gray-800">{t(phase)}</p>
              </div>
            ))}
          </div>

          {/* Arrow */}
          <div className="hidden items-center px-2 lg:flex">
            <ArrowRight size={20} className="text-gray-300" />
          </div>

          {/* Happy Place */}
          <div className="flex w-full items-center justify-center rounded-2xl border-2 border-blue-border bg-blue-bg px-6 py-8 text-center lg:w-48 lg:flex-shrink-0" style={{ backgroundColor: '#EBF1FF', borderColor: '#BBCFF5' }}>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#1A5FD4' }}>Ziel</span>
              <p className="mt-2 text-sm font-semibold text-gray-800">{t('happyPlace')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
