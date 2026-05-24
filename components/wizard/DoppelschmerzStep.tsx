'use client'

import { useState } from 'react'
import { Plus, X, Clock, Calendar } from 'lucide-react'
import { StepShell, callSuggest, callSave, StepEditField } from './StepShell'

interface PainToday { topic: string; reality: string }
interface PainTomorrow { topic: string; trigger: string; timeframe: string }
interface Answers { today: PainToday[]; tomorrow: PainTomorrow[]; offerDescription?: string; industryContext?: string }

export function DoppelschmerzStep({ initialAnswers, onSaved }: { initialAnswers?: Answers; onSaved?: (p: number) => void }) {
  const [offerDescription, setOfferDescription] = useState(initialAnswers?.offerDescription ?? '')
  const [industryContext, setIndustryContext] = useState(initialAnswers?.industryContext ?? '')
  const [today, setToday] = useState<PainToday[]>(initialAnswers?.today ?? [])
  const [tomorrow, setTomorrow] = useState<PainTomorrow[]>(initialAnswers?.tomorrow ?? [])

  return (
    <StepShell stepKey="02-doppelschmerz" voiceName="Doppelschmerz"
      title="Heute & Morgen — Pflaster + Strecke"
      why="Heute-gelöst macht relevant. Morgen-vorausgesehen macht strategisch."
      canSuggest={!!offerDescription.trim()}
      canSave={today.length > 0 || tomorrow.length > 0}
      onSuggest={async () => callSuggest('02-doppelschmerz', { offerDescription, industryContext })}
      onResult={(r) => {
        const x = r as Answers
        if (x.today) setToday(x.today)
        if (x.tomorrow) setTomorrow(x.tomorrow)
      }}
      onSave={async () => callSave('02-doppelschmerz', { today, tomorrow, offerDescription, industryContext })}
      onSaved={onSaved}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <StepEditField label="Angebots-Beschreibung" value={offerDescription} onChange={setOfferDescription} placeholder="Was tut Dein Angebot heute schon?" multiline />
        <StepEditField label="Branchen-Kontext (optional)" value={industryContext} onChange={setIndustryContext} placeholder="Regulatorik, Marktentwicklung, Tech-Shift" multiline />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mt-4">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-blue-600" />
              <span className="text-xs font-bold uppercase tracking-widest text-blue-700">Heute · Pflaster</span>
            </div>
            <button onClick={() => setToday([...today, { topic: '', reality: '' }])} className="rounded-full bg-white p-1 hover:bg-blue-100">
              <Plus size={12} className="text-blue-700" />
            </button>
          </div>
          <ul className="space-y-2">
            {today.map((p, i) => (
              <li key={i} className="rounded-lg bg-white p-2.5 border border-blue-200/40">
                <div className="flex items-start gap-2">
                  <div className="flex-1 space-y-1">
                    <input value={p.topic} onChange={(e) => setToday(today.map((x, j) => j === i ? { ...x, topic: e.target.value } : x))} placeholder="Topic" className="w-full bg-transparent text-xs font-semibold focus:outline-none" />
                    <input value={p.reality} onChange={(e) => setToday(today.map((x, j) => j === i ? { ...x, reality: e.target.value } : x))} placeholder="Reality heute" className="w-full bg-transparent text-[11px] text-gray-600 focus:outline-none" />
                  </div>
                  <button onClick={() => setToday(today.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500"><X size={10} /></button>
                </div>
              </li>
            ))}
            {today.length === 0 && <li className="text-xs italic text-blue-400">Noch keine — AI: Vorschlagen klicken oder + drücken.</li>}
          </ul>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-amber-700" />
              <span className="text-xs font-bold uppercase tracking-widest text-amber-800">Morgen · Strecke</span>
            </div>
            <button onClick={() => setTomorrow([...tomorrow, { topic: '', trigger: '', timeframe: '' }])} className="rounded-full bg-white p-1 hover:bg-amber-100">
              <Plus size={12} className="text-amber-800" />
            </button>
          </div>
          <ul className="space-y-2">
            {tomorrow.map((p, i) => (
              <li key={i} className="rounded-lg bg-white p-2.5 border border-amber-200/40">
                <div className="flex items-start gap-2">
                  <div className="flex-1 space-y-1">
                    <input value={p.topic} onChange={(e) => setTomorrow(tomorrow.map((x, j) => j === i ? { ...x, topic: e.target.value } : x))} placeholder="Topic" className="w-full bg-transparent text-xs font-semibold focus:outline-none" />
                    <input value={p.trigger} onChange={(e) => setTomorrow(tomorrow.map((x, j) => j === i ? { ...x, trigger: e.target.value } : x))} placeholder="Trigger (z.B. BEMA 2027)" className="w-full bg-transparent text-[11px] text-gray-600 focus:outline-none" />
                    <input value={p.timeframe} onChange={(e) => setTomorrow(tomorrow.map((x, j) => j === i ? { ...x, timeframe: e.target.value } : x))} placeholder="Timeframe (12-24 Mo)" className="w-full bg-transparent text-[11px] text-gray-500 focus:outline-none" />
                  </div>
                  <button onClick={() => setTomorrow(tomorrow.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500"><X size={10} /></button>
                </div>
              </li>
            ))}
            {tomorrow.length === 0 && <li className="text-xs italic text-amber-400">Noch keine.</li>}
          </ul>
        </div>
      </div>
    </StepShell>
  )
}
