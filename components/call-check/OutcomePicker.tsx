'use client'

import { useState, useTransition } from 'react'
import { Check } from 'lucide-react'
import { setOutcomeAction } from '@/lib/call-check/actions'

/** Wie ist es ausgegangen? Ein Klick — damit werden spätere Auswertungen genauer. */
export function OutcomePicker({ publicId, initial, title, hint, saved, options }: {
  publicId: string; initial: string | null; title: string; hint: string; saved: string; options: Record<string, string>
}) {
  const [val, setVal] = useState(initial)
  const [ok, setOk] = useState(false)
  const [pending, start] = useTransition()
  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      <p className="mt-1 text-sm text-gray-500">{hint}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {Object.entries(options).map(([k, label]) => (
          <button key={k} type="button" disabled={pending}
            onClick={() => start(async () => { const r = await setOutcomeAction(publicId, k); if (r.ok) { setVal(k); setOk(true) } })}
            className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${val === k ? 'border-[#1A5FD4] bg-[#1A5FD4] text-white' : 'border-gray-200 text-gray-700 hover:border-gray-400'}`}>
            {val === k && <Check size={14} />}{label}
          </button>
        ))}
      </div>
      {ok && <p className="mt-3 text-xs font-medium text-green-700">{saved}</p>}
    </section>
  )
}
