'use client'

import { useState } from 'react'
import { Trophy, Plus, X } from 'lucide-react'
import { StepShell, callSuggest, callSave, StepEditField } from './StepShell'

interface NameOption { name: string; style: string; espressoTestScore: number; recommended: boolean }
interface Answers { nameOptions?: NameOption[]; headlineOptions?: string[]; cta?: string; offerDescription?: string }

export function Letzten20Step({ initialAnswers, prevContext, onSaved }: {
  initialAnswers?: Answers; prevContext?: unknown; onSaved?: (p: number) => void
}) {
  const [a, setA] = useState<Answers>(initialAnswers ?? {})
  function set<K extends keyof Answers>(k: K, v: Answers[K]) { setA((p) => ({ ...p, [k]: v })) }

  const names = a.nameOptions ?? []
  const heads = a.headlineOptions ?? []
  const canSave = names.length > 0 || heads.length > 0 || !!a.cta

  return (
    <StepShell stepKey="08-letzten-20-prozent" voiceName="Die letzten 20 %"
      title="Name · Headline · CTA"
      why="Drei Mikro-Entscheidungen. Espresso-Test min 4/5."
      canSuggest
      canSave={canSave}
      onSuggest={async () => callSuggest('08-letzten-20-prozent', { ...(prevContext as object || {}), offerDescription: a.offerDescription })}
      onResult={(r) => setA((p) => ({ ...p, ...(r as Answers) }))}
      onSave={async () => callSave('08-letzten-20-prozent', a)}
      onSaved={onSaved}
    >
      <StepEditField label="Angebots-Beschreibung (für Kontext)" value={a.offerDescription ?? ''} onChange={(v) => set('offerDescription', v)} multiline />

      <div className="rounded-xl border border-blue-200 bg-blue-50/30 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><Trophy size={14} className="text-blue-700" />
            <span className="text-xs font-bold uppercase tracking-widest text-blue-800">Name-Optionen</span>
          </div>
          <button onClick={() => set('nameOptions', [...names, { name: '', style: '', espressoTestScore: 0, recommended: false }])} className="text-xs font-semibold text-blue-600"><Plus size={12} className="inline" /></button>
        </div>
        {names.map((n, i) => (
          <div key={i} className={`rounded-lg border bg-white p-2 ${n.recommended ? 'border-blue-400 shadow-sm' : 'border-gray-100'}`}>
            <div className="flex items-start gap-2">
              <input value={n.name} onChange={(e) => set('nameOptions', names.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="Name" className="flex-1 bg-transparent text-sm font-bold focus:outline-none" />
              <input value={n.style} onChange={(e) => set('nameOptions', names.map((x, j) => j === i ? { ...x, style: e.target.value } : x))} placeholder="Stil" className="w-32 bg-transparent text-[11px] text-gray-500 focus:outline-none" />
              <input type="number" min={0} max={5} value={n.espressoTestScore} onChange={(e) => set('nameOptions', names.map((x, j) => j === i ? { ...x, espressoTestScore: parseInt(e.target.value, 10) || 0 } : x))} className="w-10 bg-transparent text-xs text-center focus:outline-none" />
              <label className="text-[10px] font-bold text-blue-700 flex items-center gap-1">
                <input type="checkbox" checked={n.recommended} onChange={(e) => set('nameOptions', names.map((x, j) => j === i ? { ...x, recommended: e.target.checked } : x))} /> Empf
              </label>
              <button onClick={() => set('nameOptions', names.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500"><X size={10} /></button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50/30 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-800">Headline-Optionen</span>
          <button onClick={() => set('headlineOptions', [...heads, ''])} className="text-xs font-semibold text-blue-600"><Plus size={12} className="inline" /></button>
        </div>
        {heads.map((h, i) => (
          <div key={i} className="flex gap-1">
            <input value={h} onChange={(e) => set('headlineOptions', heads.map((x, j) => j === i ? e.target.value : x))} className="flex-1 rounded-lg border border-gray-100 bg-white px-2 py-1.5 text-xs focus:outline-none" placeholder="Headline" />
            <button onClick={() => set('headlineOptions', heads.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500"><X size={12} /></button>
          </div>
        ))}
      </div>

      <StepEditField label="CTA (Button-Text)" value={a.cta ?? ''} onChange={(v) => set('cta', v)} placeholder="z.B. „Bauplan jetzt holen"" />
    </StepShell>
  )
}
