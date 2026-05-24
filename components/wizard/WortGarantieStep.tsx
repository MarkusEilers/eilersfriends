'use client'

import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { StepShell, callSuggest, callSave, StepEditField } from './StepShell'

interface Answers { type?: string; trigger?: string; consequence?: string; anchorPhase?: string; anchorCurrency?: string; espressoTest?: string }

export function WortGarantieStep({ initialAnswers, prevContext, onSaved }: {
  initialAnswers?: Answers; prevContext?: unknown; onSaved?: (p: number) => void
}) {
  const [a, setA] = useState<Answers>(initialAnswers ?? {})

  function set<K extends keyof Answers>(k: K, v: Answers[K]) { setA((p) => ({ ...p, [k]: v })) }

  const canSave = !!(a.type && a.trigger && a.consequence)

  return (
    <StepShell stepKey="07-wort-garantie" voiceName="Wort-Garantie"
      title="Verteidigbare Garantie"
      why="Typ + Trigger + Konsequenz + Liefer-Anker + Espresso-Test bestanden."
      canSuggest
      canSave={canSave}
      onSuggest={async () => callSuggest('07-wort-garantie', prevContext ?? {})}
      onResult={(r) => setA((p) => ({ ...p, ...(r as Answers) }))}
      onSave={async () => callSave('07-wort-garantie', a)}
      onSaved={onSaved}
    >
      <div className="rounded-xl border border-green-200 bg-green-50/30 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-green-700" />
          <span className="text-xs font-bold uppercase tracking-widest text-green-800">Garantie-Komponenten</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <StepEditField label="Typ (z.B. Refund / Office-Hours)" value={a.type ?? ''} onChange={(v) => set('type', v)} />
          <StepEditField label="Trigger (wann greift sie)" value={a.trigger ?? ''} onChange={(v) => set('trigger', v)} />
        </div>
        <StepEditField label="Konsequenz (was passiert)" value={a.consequence ?? ''} onChange={(v) => set('consequence', v)} multiline />
        <div className="grid gap-3 sm:grid-cols-2">
          <StepEditField label="Anker-Phase (aus Step 3)" value={a.anchorPhase ?? ''} onChange={(v) => set('anchorPhase', v)} />
          <StepEditField label="Anker-Währung (aus Step 4)" value={a.anchorCurrency ?? ''} onChange={(v) => set('anchorCurrency', v)} />
        </div>
        <StepEditField label="Espresso-Test (1 Satz, max 25 Wörter)" value={a.espressoTest ?? ''} onChange={(v) => set('espressoTest', v)} multiline />
      </div>
    </StepShell>
  )
}
