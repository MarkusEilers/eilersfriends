'use client'

import Link from 'next/link'

interface Step {
  key: string
  num: string
  nav: string
  optional?: boolean
}

const STEPS: Step[] = [
  { key: '00-welcome', num: '★', nav: 'Welcome' },
  { key: '01-business-product-blocks', num: '01', nav: 'Business + Produkt + Bausteine' },
  { key: '02-icp', num: '02', nav: 'ICP' },
  { key: '03-challenges-outcomes', num: '03', nav: 'Herausforderungen + Ergebnisse' },
  { key: '04-beef-radar', num: '04', nav: 'Beef-Radar' },
  { key: '05-future-problems', num: '05', nav: 'Future Problems' },
  { key: '06-economic-cluster', num: '06', nav: 'Wirtschaftliche Bewertung' },
  { key: '07-bulletproof', num: '07', nav: 'Optimaler Weg' },
  { key: '08-phase-currencies', num: '08', nav: 'Currencies pro Phase', optional: true },
  { key: '09-preis', num: '09', nav: 'Preis' },
  { key: '10-scarcity', num: '10', nav: 'Scarcity', optional: true },
  { key: '11-risk-reversal', num: '11', nav: 'Risk-Reversal', optional: true },
  { key: '12-name-headline', num: '12', nav: 'Name + Headline' },
]

interface Props {
  children: React.ReactNode
  stepsCompleted: number
  totalSteps?: number
  currentStepKey?: string
}

export function WizardV2Layout({ children, stepsCompleted, totalSteps = STEPS.length, currentStepKey }: Props) {
  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Topbar — eilersfriends Layout-Pattern */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-md">
        <div className="flex w-full items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href={'/dashboard/frameworks' as '/'} className="text-xs font-semibold uppercase tracking-widest text-muted hover:text-ink">
              ← Meine Frameworks
            </Link>
            <span className="hidden text-xs font-bold uppercase tracking-widest text-ink sm:inline">Bauplan-Wizard</span>
          </div>
          <div className="hidden items-center gap-6 md:flex">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted">{stepsCompleted} / {totalSteps} fertig</span>
            <div className="flex items-center gap-1">
              {STEPS.map((s, i) => {
                const done = i < stepsCompleted
                const current = s.key === currentStepKey
                return (
                  <span
                    key={s.key}
                    className={
                      'h-1 w-6 rounded-full ' +
                      (current ? 'bg-blue ring-2 ring-blue-bg' : done ? 'bg-blue' : 'bg-gray-200')
                    }
                    title={s.nav}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </header>

      <main className="pt-14">{children}</main>
    </div>
  )
}
