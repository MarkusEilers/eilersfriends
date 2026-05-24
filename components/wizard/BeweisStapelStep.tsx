'use client'

import { useState } from 'react'
import { Plus, X, Award } from 'lucide-react'
import { StepShell, callSuggest, callSave } from './StepShell'

interface Proof { class: 'A' | 'B' | 'C' | 'D' | 'E'; text: string; source: string; methodology?: string }
interface Answers { proofs: Proof[] }

const CLASS_META = {
  A: { label: 'A — Named Customer', color: '#1A5FD4' },
  B: { label: 'B — Customer-Avg', color: '#3B82F6' },
  C: { label: 'C — Hypothese + Methode', color: '#B07C0A' },
  D: { label: 'D — Branchen-Benchmark', color: '#6B7280' },
  E: { label: 'E — Testimonial', color: '#10B981' },
} as const

export function BeweisStapelStep({ initialAnswers, prevContext, onSaved }: {
  initialAnswers?: Answers; prevContext?: unknown; onSaved?: (p: number) => void
}) {
  const [proofs, setProofs] = useState<Proof[]>(initialAnswers?.proofs ?? [])

  function update(i: number, patch: Partial<Proof>) {
    setProofs(proofs.map((p, j) => j === i ? { ...p, ...patch } : p))
  }

  return (
    <StepShell stepKey="05-beweis-stapel" voiceName="Beweis-Stapel"
      title="ROI-Beweise — Klassen A-E"
      why="3 bis 7 Beweise. Mindestens 2 aus A oder B im Top-3. Hypothese braucht Methodik, sonst Marketing-Floskel."
      canSuggest
      canSave={proofs.length >= 3}
      onSuggest={async () => callSuggest('05-beweis-stapel', prevContext ?? {})}
      onResult={(r) => { const x = r as Answers; if (x.proofs) setProofs(x.proofs) }}
      onSave={async () => callSave('05-beweis-stapel', { proofs })}
      onSaved={onSaved}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-700">Beweise ({proofs.length}/7)</p>
        <button onClick={() => setProofs([...proofs, { class: 'C', text: '', source: '' }])} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800">
          <Plus size={12} /> Beweis hinzufügen
        </button>
      </div>

      <div className="space-y-2">
        {proofs.map((p, i) => {
          const meta = CLASS_META[p.class]
          return (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-3">
              <div className="flex items-start gap-2">
                <select value={p.class} onChange={(e) => update(i, { class: e.target.value as Proof['class'] })} className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-[11px] font-semibold focus:outline-none" style={{ color: meta.color }}>
                  {Object.entries(CLASS_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
                </select>
                <Award size={14} className="mt-1.5" style={{ color: meta.color }} />
                <button onClick={() => setProofs(proofs.filter((_, j) => j !== i))} className="ml-auto mt-1 text-gray-400 hover:text-red-500"><X size={12} /></button>
              </div>
              <input value={p.text} onChange={(e) => update(i, { text: e.target.value })} placeholder={'Beweis (z.B. „22.500 €/Jahr eingespart")'} className="mt-2 w-full rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-1.5 text-xs font-semibold focus:outline-none" />
              <div className="grid gap-2 sm:grid-cols-2 mt-2">
                <input value={p.source} onChange={(e) => update(i, { source: e.target.value })} placeholder={'Source (z.B. „GMG-Case")'} className="rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-1.5 text-[11px] focus:outline-none" />
                <input value={p.methodology ?? ''} onChange={(e) => update(i, { methodology: e.target.value })} placeholder={'Methodik (z.B. „3 FTE × 4h/Wo × …")'} className="rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-1.5 text-[11px] focus:outline-none" />
              </div>
            </div>
          )
        })}
      </div>
    </StepShell>
  )
}
