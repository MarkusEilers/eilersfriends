'use client'

import { useState } from 'react'
import { Plus, X, TrendingUp } from 'lucide-react'
import { StepShell, callSuggest, callSave } from './StepShell'

interface Currency { phaseName: string; metric: string; baseline: string; pessimist: string; realist: string; optimist: string; measureAt: string }
interface Answers { currencies: Currency[]; phases?: { name: string }[] }

export function PhasenWaehrungStep({ initialAnswers, prevPhases, onSaved }: {
  initialAnswers?: Answers; prevPhases?: { name: string }[]; onSaved?: (p: number) => void
}) {
  const [currencies, setCurrencies] = useState<Currency[]>(initialAnswers?.currencies ?? [])

  function update(i: number, patch: Partial<Currency>) {
    setCurrencies(currencies.map((c, j) => j === i ? { ...c, ...patch } : c))
  }

  return (
    <StepShell stepKey="04-phasen-waehrung" voiceName="Phasen-Währung"
      title="Currency pro Phase — Pessimist · Realist · Optimist"
      why="Pricing gegen Realist verteidigt. Garantie gegen Pessimist. Optimist ist Up-Side, nicht Versprechen."
      canSuggest={(prevPhases?.length ?? 0) > 0}
      canSave={currencies.length > 0}
      onSuggest={async () => callSuggest('04-phasen-waehrung', { phases: prevPhases ?? [] })}
      onResult={(r) => { const x = r as Answers; if (x.currencies) setCurrencies(x.currencies) }}
      onSave={async () => callSave('04-phasen-waehrung', { currencies })}
      onSaved={onSaved}
    >
      {(prevPhases?.length ?? 0) === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          Erst Schritt 3 (Sichtbarer Pfad) abschliessen — die Phasen-Namen werden hier referenziert.
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-700">Currencies ({currencies.length})</p>
        <button onClick={() => setCurrencies([...currencies, { phaseName: '', metric: '', baseline: '', pessimist: '', realist: '', optimist: '', measureAt: '' }])} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800">
          <Plus size={12} /> Currency
        </button>
      </div>

      <div className="space-y-3">
        {currencies.map((c, i) => (
          <div key={i} className="rounded-xl border border-blue-200 bg-white p-3">
            <div className="flex items-start gap-2 mb-2">
              <TrendingUp size={14} className="text-blue-600 mt-1.5" />
              <input value={c.phaseName} onChange={(e) => update(i, { phaseName: e.target.value })} placeholder={'Phase" className='}w-32 rounded-lg border border-gray-200 px-2 py-1.5 text-xs font-bold focus:outline-none" />
              <input value={c.metric} onChange={(e) => update(i, { metric: e.target.value })} placeholder={'Metric (z.B. Annahmequote)" className='}flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:outline-none" />
              <button onClick={() => setCurrencies(currencies.filter((_, j) => j !== i))} className="mt-1.5 text-gray-400 hover:text-red-500"><X size={12} /></button>
            </div>
            <div className="grid gap-2 sm:grid-cols-5">
              <input value={c.baseline} onChange={(e) => update(i, { baseline: e.target.value })} placeholder={'Baseline" className='}rounded-lg border border-gray-100 bg-gray-50 px-2 py-1.5 text-[11px] focus:outline-none" />
              <input value={c.pessimist} onChange={(e) => update(i, { pessimist: e.target.value })} placeholder={'Pessimist" className='}rounded-lg border border-red-100 bg-red-50/40 px-2 py-1.5 text-[11px] focus:outline-none" />
              <input value={c.realist} onChange={(e) => update(i, { realist: e.target.value })} placeholder={'Realist" className='}rounded-lg border border-blue-100 bg-blue-50/40 px-2 py-1.5 text-[11px] focus:outline-none" />
              <input value={c.optimist} onChange={(e) => update(i, { optimist: e.target.value })} placeholder={'Optimist" className='}rounded-lg border border-green-100 bg-green-50/40 px-2 py-1.5 text-[11px] focus:outline-none" />
              <input value={c.measureAt} onChange={(e) => update(i, { measureAt: e.target.value })} placeholder={'Mess (Wo 8)" className='}rounded-lg border border-gray-100 bg-gray-50 px-2 py-1.5 text-[11px] focus:outline-none" />
            </div>
          </div>
        ))}
      </div>
    </StepShell>
  )
}
