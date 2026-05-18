/**
 * Sales Performance Journey — Sonia-style geschwungener Pfad.
 *
 * 4 Stationen auf einer Welle, alternierend oben/unten. Jede Station
 * pulsiert in einem sanften 4-Sekunden-Heartbeat von links nach rechts,
 * versetzt um je 1 s. Animation läuft automatisch in einer Endlosschleife.
 *
 * Reduzierte Hierarchie: nur Titel + Tagline + Body. Keine Pull-Quote-Box
 * darunter (das hatten wir in der alten Version — übersteigt jetzt das
 * Aufmerksamkeitsbudget).
 */
'use client'

import { useTranslations } from 'next-intl'
import { ClipboardCheck, GraduationCap, TrendingUp, Activity } from 'lucide-react'

interface Stage {
  title: string
  tagline: string
  body: string
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

        {/* Wavy path with stations */}
        <div className="relative">
          {/* SVG wavy path connecting all stations (desktop only) */}
          <svg
            className="hidden lg:block absolute inset-0 w-full pointer-events-none"
            viewBox="0 0 1000 220"
            preserveAspectRatio="none"
            style={{ height: 220, top: 70 }}
            aria-hidden="true"
          >
            <path
              d="M 50,110 C 200,30 280,30 370,110 C 460,190 540,190 630,110 C 720,30 800,30 950,110"
              fill="none"
              stroke="#BBCFF5"
              strokeWidth="2"
              strokeDasharray="6 4"
              opacity="0.7"
            />
          </svg>

          {/* Stations row */}
          <div className="relative grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {stages.map((s, i) => {
              const Icon = STAGE_ICONS[i] ?? ClipboardCheck
              const offsetClass = i % 2 === 0 ? 'lg:mt-0' : 'lg:mt-32'
              return (
                <div
                  key={s.title}
                  className={`relative flex flex-col items-center text-center ${offsetClass} salesmade-station`}
                  style={{
                    // Each station heartbeats with a staggered delay
                    animationDelay: `${i * 1}s`,
                  }}
                >
                  {/* Icon disc */}
                  <div
                    className="salesmade-station-disc relative flex h-16 w-16 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: '#EBF1FF',
                      border: '1px solid #BBCFF5',
                      color: BLUE,
                      animationDelay: `${i * 1}s`,
                    }}
                  >
                    <Icon size={26} strokeWidth={1.8} />
                  </div>
                  {/* Number label */}
                  <span className="mt-3 font-mono text-[11px] font-bold tracking-widest" style={{ color: BLUE }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {/* Title */}
                  <h3 className="mt-2 text-lg font-bold" style={{ color: '#0D0D0B' }}>
                    {s.title}
                  </h3>
                  {/* Tagline */}
                  <p className="mt-1 text-sm font-semibold" style={{ color: BLUE }}>{s.tagline}</p>
                  {/* Body */}
                  <p className="mt-3 max-w-[230px] text-sm leading-relaxed text-gray-600">{s.body}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Heartbeat keyframes — one full 4s cycle, then 4s rest = 8s loop */}
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
          animation: salesmadeHeartbeat 8s ease-in-out infinite;
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
