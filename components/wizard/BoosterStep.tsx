'use client'

import { useState } from 'react'
import { Plus, X, Zap } from 'lucide-react'
import { StepShell, callSuggest, callSave, StepEditField } from './StepShell'

interface Booster { name: string; valueLabel: string; deliveryCost: string; anchor: string }
interface Answers { boosters: Booster[]; offerDescription?: string; adjacentPains?: string[] }

export function BoosterStep({ initialAnswers, onSaved }: { initialAnswers?: Answers; onSaved?: (p: number) => void }) {
  const [offerDescription, setOfferDescription] = useState(initialAnswers?.offerDescription ?? '')
  const [boosters, setBoosters] = useState<Booster[]>(initialAnswers?.boosters ?? [])

  function update(i: number, patch: Partial<Booster>) {
    setBoosters(boosters.map((b, j) => j === i ? { ...b, ...patch } : b))
  }

  return (
    <StepShell stepKey="06-booster" voiceName="Booster"
      title="Adjacent Pain mit Anker"
      why="1–3 Booster. Echter Lieferaufwand ≤ 20 % des wahrgenommenen Werts. Zweites Problem gelöst, mit €-Anker."
      canSuggest={!!offerDescription.trim()}
      canSave={boosters.length > 0}
      onSuggest={async () => callSuggest('06-booster', { offerDescription })}
      onResult={(r) => { const x = r as Answers; if (x.boosters) setBoosters(x.boosters) }}
      onSave={async () => callSave('06-booster', { boosters, offerDescription })}
      onSaved={onSaved}
    >
      <StepEditField label="Angebots-Beschreibung" value={offerDescription} onChange={setOfferDescription} multiline />

      <div className="flex items-center justify-between mt-3">
        <p className="text-xs font-semibold text-gray-700">Booster ({boosters.length}/3)</p>
        {boosters.length < 3 && (
          <button onClick={() => setBoosters([...boosters, { name: '', valueLabel: '', deliveryCost: '', anchor: '' }])} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800">
            <Plus size={12} /> Booster
          </button>
        )}
      </div>

      <div className="space-y-2">
        {boosters.map((b, i) => (
          <div key={i} className="rounded-xl border border-amber-200 bg-amber-50/40 p-3">
            <div className="flex items-start gap-2 mb-2">
              <Zap size={14} className="text-amber-700 mt-1.5" />
              <input value={b.name} onChange={(e) => update(i, { name: e.target.value })} placeholder="Booster-Name" className="flex-1 rounded-lg border border-amber-100 bg-white px-2.5 py-1.5 text-xs font-bold focus:outline-none" />
              <button onClick={() => setBoosters(boosters.filter((_, j) => j !== i))} className="mt-1.5 text-gray-400 hover:text-red-500"><X size={12} /></button>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <input value={b.valueLabel} onChange={(e) => update(i, { valueLabel: e.target.value })} placeholder="Wert (z.B. 1.997 €)" className="rounded-lg border border-amber-100 bg-white px-2 py-1.5 text-[11px] focus:outline-none" />
              <input value={b.deliveryCost} onChange={(e) => update(i, { deliveryCost: e.target.value })} placeholder="Lieferaufwand (0 € einmal gebaut)" className="rounded-lg border border-amber-100 bg-white px-2 py-1.5 text-[11px] focus:outline-none" />
              <input value={b.anchor} onChange={(e) => update(i, { anchor: e.target.value })} placeholder="Anker (z.B. „aktiviert im Pitch")" className="rounded-lg border border-amber-100 bg-white px-2 py-1.5 text-[11px] focus:outline-none" />
            </div>
          </div>
        ))}
      </div>
    </StepShell>
  )
}
