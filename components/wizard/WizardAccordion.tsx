'use client'

import { useState, useRef } from 'react'
import { ChevronDown, ChevronUp, CheckCircle2, Lock } from 'lucide-react'
import { BeefRadarStep } from './BeefRadarStep'
import { DoppelschmerzStep } from './DoppelschmerzStep'
import { SichtbarerPfadStep } from './SichtbarerPfadStep'
import { PhasenWaehrungStep } from './PhasenWaehrungStep'
import { BeweisStapelStep } from './BeweisStapelStep'
import { BoosterStep } from './BoosterStep'
import { WortGarantieStep } from './WortGarantieStep'
import { Letzten20Step } from './Letzten20Step'
import { useRouter } from 'next/navigation'

const STEPS = [
  { key: '01-beef-radar', voice: 'Beef-Radar', title: 'Inhalte → Value → Impact' },
  { key: '02-doppelschmerz', voice: 'Doppelschmerz', title: 'Heute & Morgen' },
  { key: '03-sichtbarer-pfad', voice: 'Sichtbarer Pfad', title: 'Bulletproof Delivery Plan' },
  { key: '04-phasen-waehrung', voice: 'Phasen-Währung', title: 'Currency pro Phase' },
  { key: '05-beweis-stapel', voice: 'Beweis-Stapel', title: 'ROI-Beweise A-E' },
  { key: '06-booster', voice: 'Booster', title: 'Adjacent Pain mit Anker' },
  { key: '07-wort-garantie', voice: 'Wort-Garantie', title: 'Verteidigbare Garantie' },
  { key: '08-letzten-20-prozent', voice: 'Die letzten 20 %', title: 'Name · Headline · CTA' },
]

interface Props {
  answers: Record<string, unknown>
  stepsCompleted: number
}

export function WizardAccordion({ answers, stepsCompleted }: Props) {
  const [openKey, setOpenKey] = useState<string>(STEPS[stepsCompleted < 8 ? stepsCompleted : 0].key)
  const router = useRouter()
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleSaved() {
    // Soft-refresh server data after a short delay
    if (refreshTimer.current) clearTimeout(refreshTimer.current)
    refreshTimer.current = setTimeout(() => router.refresh(), 800)
  }

  return (
    <ol className="space-y-3">
      {STEPS.map((s, i) => {
        const done = answers[s.key] != null
        const isOpen = openKey === s.key
        const stepAnswers = answers[s.key] as Record<string, unknown> | undefined
        const isLocked = false  // alle Steps editierbar; AI darf bei Bedarf vorherige Steps lesen

        return (
          <li key={s.key} className={`rounded-2xl border ${isOpen ? 'border-blue-300 shadow-sm' : done ? 'border-green-200' : 'border-gray-200'} bg-white overflow-hidden`}>
            <button
              type="button"
              onClick={() => setOpenKey(isOpen ? '' : s.key)}
              className={`w-full px-5 py-4 flex items-center gap-3 text-left transition-colors ${isOpen ? 'bg-blue-50/40' : done ? 'bg-green-50/30' : 'hover:bg-gray-50'}`}
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold flex-shrink-0 ${done ? 'bg-green-600 text-white' : isOpen ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {done ? <CheckCircle2 size={16} /> : isLocked ? <Lock size={14} /> : String(i + 1).padStart(2, '0')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#1A5FD4' }}>{s.voice}</p>
                <p className="text-sm font-bold text-gray-900 truncate">{s.title}</p>
              </div>
              {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>
            {isOpen && (
              <div className="px-5 pb-5">
                {s.key === '01-beef-radar' && <BeefRadarStep initialAnswers={stepAnswers as Parameters<typeof BeefRadarStep>[0]['initialAnswers']} onSaved={handleSaved} />}
                {s.key === '02-doppelschmerz' && <DoppelschmerzStep initialAnswers={stepAnswers as Parameters<typeof DoppelschmerzStep>[0]['initialAnswers']} onSaved={handleSaved} />}
                {s.key === '03-sichtbarer-pfad' && <SichtbarerPfadStep initialAnswers={stepAnswers as Parameters<typeof SichtbarerPfadStep>[0]['initialAnswers']} onSaved={handleSaved} />}
                {s.key === '04-phasen-waehrung' && <PhasenWaehrungStep initialAnswers={stepAnswers as Parameters<typeof PhasenWaehrungStep>[0]['initialAnswers']} prevPhases={(answers['03-sichtbarer-pfad'] as { phases?: { name: string }[] } | undefined)?.phases ?? []} onSaved={handleSaved} />}
                {s.key === '05-beweis-stapel' && <BeweisStapelStep initialAnswers={stepAnswers as Parameters<typeof BeweisStapelStep>[0]['initialAnswers']} prevContext={answers} onSaved={handleSaved} />}
                {s.key === '06-booster' && <BoosterStep initialAnswers={stepAnswers as Parameters<typeof BoosterStep>[0]['initialAnswers']} onSaved={handleSaved} />}
                {s.key === '07-wort-garantie' && <WortGarantieStep initialAnswers={stepAnswers as Parameters<typeof WortGarantieStep>[0]['initialAnswers']} prevContext={answers} onSaved={handleSaved} />}
                {s.key === '08-letzten-20-prozent' && <Letzten20Step initialAnswers={stepAnswers as Parameters<typeof Letzten20Step>[0]['initialAnswers']} prevContext={answers} onSaved={handleSaved} />}
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
