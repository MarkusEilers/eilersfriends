'use client'

import { useState, useRef } from 'react'
import { ChevronDown, ChevronUp, CheckCircle2, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { BeefRadarStep } from './BeefRadarStep'
import { StepCompanion } from './StepCompanion'

const STEPS = [
  { key: '01-beef-radar', voice: 'Beef-Radar', title: 'Inhalte → Value → Impact', why: 'WAS · WIE · WARUM pro Baustein.', live: true },
  { key: '02-doppelschmerz', voice: 'Doppelschmerz', title: 'Heute & Morgen', why: 'Heute löst, morgen vorausgesehen.', live: false },
  { key: '03-sichtbarer-pfad', voice: 'Sichtbarer Pfad', title: 'Bulletproof Delivery Plan', why: '3-5 Phasen mit Input/Output/Dauer.', live: false },
  { key: '04-phasen-waehrung', voice: 'Phasen-Währung', title: 'Currency pro Phase', why: 'Baseline + Pessimist/Realist/Optimist.', live: false },
  { key: '05-beweis-stapel', voice: 'Beweis-Stapel', title: 'ROI-Beweise A-E', why: '3-7 Beweise, mind. 2 aus A oder B.', live: false },
  { key: '06-booster', voice: 'Booster', title: 'Adjacent Pain mit Anker', why: '1-3 Booster, Lieferaufwand ≤ 20% Wert.', live: false },
  { key: '07-wort-garantie', voice: 'Wort-Garantie', title: 'Verteidigbare Garantie', why: 'Typ + Trigger + Konsequenz + Anker.', live: false },
  { key: '08-letzten-20-prozent', voice: 'Die letzten 20 Prozent', title: 'Name · Headline · CTA', why: 'Drei Mikro-Entscheidungen zum Schluss.', live: false },
]

interface Props { answers: Record<string, unknown>; stepsCompleted: number }

export function WizardAccordion({ answers, stepsCompleted }: Props) {
  const initialIdx = stepsCompleted < STEPS.length ? stepsCompleted : 0
  const [openKey, setOpenKey] = useState<string>(STEPS[initialIdx].key)
  const router = useRouter()
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  function handleSaved() {
    if (refreshTimer.current) clearTimeout(refreshTimer.current)
    refreshTimer.current = setTimeout(() => router.refresh(), 800)
  }

  return (
    <ol className="space-y-3">
      {STEPS.map((s, i) => {
        const done = answers[s.key] != null
        const isOpen = openKey === s.key
        const stepAnswers = answers[s.key] as Record<string, unknown> | undefined
        return (
          <li key={s.key} className={`rounded-2xl border ${isOpen ? 'border-blue-300 shadow-sm' : done ? 'border-green-200' : 'border-gray-200'} bg-white overflow-hidden`}>
            <button type="button" onClick={() => setOpenKey(isOpen ? '' : s.key)}
              className={`w-full px-5 py-4 flex items-center gap-3 text-left transition-colors ${isOpen ? 'bg-blue-50/40' : done ? 'bg-green-50/30' : 'hover:bg-gray-50'}`}>
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold flex-shrink-0 ${done ? 'bg-green-600 text-white' : isOpen ? 'bg-blue-600 text-white' : !s.live ? 'bg-gray-50 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                {done ? <CheckCircle2 size={16} /> : !s.live ? <Lock size={14} /> : String(i + 1).padStart(2, '0')}
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
                {!s.live && (
                  <>
                    <StepCompanion stepKey={s.key} />
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                    <p className="text-xs font-bold uppercase tracking-widest text-amber-800">Naechste Welle</p>
                    <h4 className="mt-1 text-sm font-bold text-amber-900">{s.title}</h4>
                    <p className="mt-1 text-xs text-amber-800">{s.why}</p>
                    <p className="mt-3 text-xs text-amber-700">
                      Edge-Route /api/wizard/b2b-angebote/step/{s.key}/suggest funktioniert schon (gpt-4o-mini, JSON-Output gemaess
                      Schema). Die interaktive UI fuer diesen Step rollen wir im naechsten Update frei — Beef-Radar oben ist der
                      Stencil.
                    </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
