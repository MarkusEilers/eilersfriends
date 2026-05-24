'use client'

import { useState } from 'react'
import { Plus, X, ArrowRight } from 'lucide-react'
import { StepShell, callSuggest, callSave, StepEditField } from './StepShell'

interface Phase { name: string; input: string; output: string; durationWeeks: number; steps: string[] }
interface Answers { phases: Phase[]; startingPain?: string; endGoal?: string; offerDescription?: string }

export function SichtbarerPfadStep({ initialAnswers, onSaved }: { initialAnswers?: Answers; onSaved?: (p: number) => void }) {
  const [offerDescription, setOfferDescription] = useState(initialAnswers?.offerDescription ?? '')
  const [startingPain, setStartingPain] = useState(initialAnswers?.startingPain ?? '')
  const [endGoal, setEndGoal] = useState(initialAnswers?.endGoal ?? '')
  const [phases, setPhases] = useState<Phase[]>(initialAnswers?.phases ?? [])

  function update(i: number, patch: Partial<Phase>) {
    setPhases(phases.map((p, j) => j === i ? { ...p, ...patch } : p))
  }

  return (
    <StepShell stepKey="03-sichtbarer-pfad" voiceName="Sichtbarer Pfad"
      title="Bulletproof Delivery Plan"
      why="3 bis 5 benannte Phasen. Gleiche Grammatik, gleiche Silbenanzahl. „Aufräumen · Aufstellen · Abliefern"."
      canSuggest={!!offerDescription.trim()}
      canSave={phases.length >= 3}
      onSuggest={async () => callSuggest('03-sichtbarer-pfad', { offerDescription, startingPain, endGoal })}
      onResult={(r) => { const x = r as Answers; if (x.phases) setPhases(x.phases) }}
      onSave={async () => callSave('03-sichtbarer-pfad', { phases, offerDescription, startingPain, endGoal })}
      onSaved={onSaved}
    >
      <StepEditField label="Angebots-Beschreibung" value={offerDescription} onChange={setOfferDescription} multiline placeholder={'Was tut Dein Angebot?" />
      <div className='}grid gap-3 sm:grid-cols-2">
        <StepEditField label="Starting Pain (wo der Kunde heute steht)" value={startingPain} onChange={setStartingPain} placeholder={'„Wir haben kein klares Reporting"'} />
        <StepEditField label="End Goal (wo er hin will)" value={endGoal} onChange={setEndGoal} placeholder={'„Wöchentlicher Forecast mit 90% Genauigkeit"'} />
      </div>

      <div className="flex items-center justify-between mt-3">
        <p className="text-xs font-semibold text-gray-700">Phasen ({phases.length}/5)</p>
        {phases.length < 5 && (
          <button onClick={() => setPhases([...phases, { name: '', input: '', output: '', durationWeeks: 4, steps: [] }])} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800">
            <Plus size={12} /> Phase hinzufügen
          </button>
        )}
      </div>

      <div className="space-y-3">
        {phases.map((ph, i) => (
          <div key={i} className="rounded-xl border border-blue-200 bg-blue-50/30 p-3">
            <div className="flex items-start gap-2 mb-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">{i + 1}</span>
              <input value={ph.name} onChange={(e) => update(i, { name: e.target.value })} placeholder={'Phase-Name (1 Wort)" className='}flex-1 rounded-lg border border-blue-100 bg-white px-2.5 py-1.5 text-sm font-bold focus:border-blue-400 focus:outline-none" />
              <input type="number" value={ph.durationWeeks} onChange={(e) => update(i, { durationWeeks: parseInt(e.target.value, 10) || 0 })} className="w-16 rounded-lg border border-blue-100 bg-white px-2 py-1.5 text-xs focus:outline-none" />
              <span className="text-[10px] text-gray-500 mt-2">Wo</span>
              <button onClick={() => setPhases(phases.filter((_, j) => j !== i))} className="mt-1.5 text-gray-400 hover:text-red-500"><X size={12} /></button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <input value={ph.input} onChange={(e) => update(i, { input: e.target.value })} placeholder={'Input (was kommt rein)" className='}rounded-lg border border-blue-100 bg-white px-2 py-1.5 text-[11px] focus:outline-none" />
              <input value={ph.output} onChange={(e) => update(i, { output: e.target.value })} placeholder={'Output (was kommt raus)" className='}rounded-lg border border-blue-100 bg-white px-2 py-1.5 text-[11px] focus:outline-none" />
            </div>
            <div className="mt-2">
              <input value={(ph.steps ?? []).join(' · ')} onChange={(e) => update(i, { steps: e.target.value.split(/\s*·\s*/).filter(Boolean) })} placeholder={'Steps (mit · trennen)" className='}w-full rounded-lg border border-blue-100 bg-white px-2 py-1.5 text-[11px] focus:outline-none" />
            </div>
          </div>
        ))}
      </div>
    </StepShell>
  )
}
