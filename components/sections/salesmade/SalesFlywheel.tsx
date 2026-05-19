/**
 * Sales Performance Journey — Sonia-Style geschwungener Pfad mit 4 Stationen.
 *
 * Layout:
 * - SVG-Pfad spannt sich hinter allen 4 Stationen, passiert jedes Icon mittig.
 * - Stationen stehen in einer Reihe; jedes Icon-Disc sitzt auf dem Pfad.
 * - Unter jedem Icon: ein 80%-opaques Kärtchen mit Titel/Tagline/Body, das
 *   den Pfad sanft überblendet.
 * - Heartbeat-Animation: jede Station pulsiert in 16s-Loop, versetzt um je 2s
 *   von links nach rechts. Halbe Geschwindigkeit gegenüber Vorgänger-Version.
 * - Respektiert prefers-reduced-motion.
 */
'use client'

import { useTranslations } from 'next-intl'
import { ClipboardCheck, GraduationCap, TrendingUp, Activity } from 'lucide-react'

interface Stage {
  title: string
  tagline: string
  body: string
  specific: string
}

const STAGE_ICONS = [ClipboardCheck, GraduationCap, TrendingUp, Activity]
const BLUE = '#1A5FD4'

export function SalesFlywheel() {
  const t = useTranslations('salesmadeExt.flywheel')
  const stages = (t.raw('stages') as Stage[]) ?? []

  return (
    <section className="px-6 py-20 bg-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <span
            className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
            style={{ backgroundColor: '#EBF1FF', color: BLUE, border: '1px solid #BBCFF5' }}
          >
            {t('eyebrow')}
          </span>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
            {t('headline1')}
            <br className="hidden sm:block" /> {t('headline2')}
          </h2>
          <p className="mt-4 mx-auto max-w-2xl text-base text-gray-600 leading-relaxed">
            {t('subtext')}
          </p>
        </div>

        {/* Stations + path container */}
        <div className="relative pt-2">
          {/* Wavy SVG path — sits absolutely behind all 4 icons, anchored to
              the icon row's vertical center (~36px from top of the relative box). */}
          <svg
            className="hidden lg:block absolute inset-x-0 pointer-events-none"
            viewBox="0 0 1000 160"
            preserveAspectRatio="none"
            style={{ top: 0, height: 160, zIndex: 0 }}
            aria-hidden="true"
          >
            {/* Stations sit at x = 125, 375, 625, 875 (centred in their 4-col grid),
                vertical anchor y = 36. The path enters/exits at y=36 and waves up/down between. */}
            <path
              d="M 0,36 Q 60,-10 125,36 Q 250,90 375,36 Q 500,-10 625,36 Q 750,90 875,36 Q 940,-10 1000,36"
              fill="none"
              stroke="#BBCFF5"
              strokeWidth="2.5"
              strokeDasharray="6 5"
              opacity="0.85"
            />
          </svg>

          {/* Stations row */}
          <div className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-4" style={{ zIndex: 1 }}>
            {stages.map((s, i) => {
              const Icon = STAGE_ICONS[i] ?? ClipboardCheck
              return (
                <div
                  key={s.title}
                  className="flex flex-col items-center text-center"
                >
                  {/* Icon disc — sits ON the path */}
                  <div
                    className="salesmade-station-disc relative flex h-16 w-16 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: '#EBF1FF',
                      border: '1.5px solid #BBCFF5',
                      color: BLUE,
                      animationDelay: `${i * 2}s`,
                      zIndex: 2,
                    }}
                  >
                    <Icon size={24} strokeWidth={1.8} />
                  </div>

                  {/* 80%-opaque card overlaying the path */}
                  <div
                    className="mt-5 w-full rounded-2xl px-5 py-5"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.80)',
                      backdropFilter: 'blur(2px)',
                      WebkitBackdropFilter: 'blur(2px)',
                      border: '1px solid rgba(187,207,245,0.55)',
                    }}
                  >
                    <span className="font-mono text-[11px] font-bold tracking-widest" style={{ color: BLUE }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="mt-1 text-lg font-bold" style={{ color: '#0D0D0B' }}>
                      {s.title}
                    </h3>
                    <p className="mt-1 text-sm font-semibold" style={{ color: BLUE }}>
                      {s.tagline}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-gray-600">
                      {s.body}
                    </p>

                    {/* Specific — compact, visualised */}
                    <div
                      className="mt-4 rounded-xl px-3 py-2.5 text-left"
                      style={{
                        backgroundColor: 'rgba(235,241,255,0.7)',
                        border: '1px solid rgba(187,207,245,0.6)',
                      }}
                    >
                      <div className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: BLUE }}>
                        {t('specificLabel')}
                      </div>
                      <div className="mt-1 text-[11px] leading-snug" style={{ color: '#0F1E3A' }}>
                        {s.specific}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Heartbeat keyframes — 16 s loop (half speed vs. prior), staggered 2 s per station */}
      <style jsx>{`
        @keyframes salesmadeHeartbeat {
          0%, 80%, 100% {
            box-shadow: 0 0 0 0 rgba(26, 95, 212, 0);
            transform: scale(1);
          }
          10% {
            box-shadow: 0 0 0 8px rgba(26, 95, 212, 0.18);
            transform: scale(1.06);
          }
          25% {
            box-shadow: 0 0 0 14px rgba(26, 95, 212, 0);
            transform: scale(1);
          }
          35% {
            box-shadow: 0 0 0 6px rgba(26, 95, 212, 0.12);
            transform: scale(1.04);
          }
          50% {
            box-shadow: 0 0 0 12px rgba(26, 95, 212, 0);
            transform: scale(1);
          }
        }
        :global(.salesmade-station-disc) {
          animation: salesmadeHeartbeat 16s ease-in-out infinite;
          will-change: transform, box-shadow;
        }
        @media (prefers-reduced-motion: reduce) {
          :global(.salesmade-station-disc) {
            animation: none;
          }
        }
      `}</style>
    </section>
  )
}
