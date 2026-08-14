'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { saveStepAction } from '@/lib/actions/strategy'

interface Field { key: string; label: string; type?: string; help?: string; placeholder?: string }

/**
 * Arbeitsfläche eines Schritts. Rendert die Felder des Schritts (aus den
 * Bausteinen, sonst ein freies Arbeitsblatt) und speichert automatisch.
 */
export function StepEditor({ stateId, fields, initial, readOnly }:
  { stateId: string; fields: Field[]; initial: Record<string, unknown>; readOnly?: boolean }) {
  const [values, setValues] = useState<Record<string, unknown>>(initial ?? {})
  const [saved, setSaved] = useState<number | null>(null)
  const [pending, start] = useTransition()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dirty = useRef(false)

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  function set(key: string, v: string) {
    if (readOnly) return
    dirty.current = true
    const next = { ...values, [key]: v }
    setValues(next)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      const filled = fields.filter((f) => String(next[f.key] ?? '').trim().length > 0).length
      const progress = fields.length ? Math.round((filled / fields.length) * 100) : 0
      start(async () => { await saveStepAction(stateId, next, progress); setSaved(Date.now()); dirty.current = false })
    }, 900)
  }

  return (
    <div className="space-y-5">
      {fields.map((f) => (
        <div key={f.key}>
          <label className="mb-1.5 block text-sm font-semibold text-gray-900">{f.label}</label>
          {f.help && <p className="mb-2 text-xs leading-relaxed text-gray-500">{f.help}</p>}
          <textarea
            value={String(values[f.key] ?? '')}
            onChange={(e) => set(f.key, e.target.value)}
            readOnly={readOnly}
            rows={f.type === 'short' ? 2 : 5}
            placeholder={f.placeholder ?? ''}
            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm leading-relaxed outline-none transition-colors ${
              readOnly ? 'border-gray-100 bg-gray-50 text-gray-600' : 'border-gray-200 bg-white focus:border-blue-400'}`}
          />
        </div>
      ))}

      {!readOnly && (
        <p className="flex items-center gap-1.5 text-xs text-gray-400">
          {pending ? <><Loader2 size={12} className="animate-spin" /> Speichert …</>
            : saved ? <><Check size={12} className="text-green-600" /> Automatisch gespeichert</>
            : 'Änderungen werden automatisch gespeichert.'}
        </p>
      )}
      {readOnly && <p className="text-xs text-gray-400">Dieser Schritt ist eingereicht oder freigegeben — zum Ändern bitte wieder öffnen.</p>}
    </div>
  )
}
