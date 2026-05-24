'use client'

import { useState } from 'react'
import { Loader2, Sparkles, Plus, X, Save, CheckCircle2 } from 'lucide-react'

type Item = Record<string, string>
interface Answers extends Record<string, unknown> { currencies?: Item[] }

interface Props { initialAnswers?: Answers; onSaved?: (p: number) => void }

export function PhasenWährungStep({ initialAnswers, onSaved }: Props) {
  const [phasesContext, setPhasesContext] = useState(initialAnswers?.phasesContext ?? '')
  const [items, setItems] = useState<Item[]>((initialAnswers?.currencies as Item[] | undefined) ?? [])
  const [status, setStatus] = useState<'idle' | 'suggesting' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function suggest() {
    setStatus('suggesting'); setError(null)
    try {
      const res = await fetch('/api/wizard/b2b-angebote/step/04-phasen-waehrung/suggest', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phasesContext  }),
      })
      const data = await res.json()
      if (!res.ok || !data.result) { setError(data.error || 'Suggest fehlgeschlagen'); setStatus('error'); return }
      const result = data.result as Answers
      if (Array.isArray(result.currencies)) setItems(result.currencies as Item[])
      setStatus('idle')
    } catch (e) { setError(String(e)); setStatus('error') }
  }

  async function save() {
    setStatus('saving'); setError(null)
    try {
      const res = await fetch('/api/wizard/b2b-angebote/step/04-phasen-waehrung/save', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currencies: items, phasesContext }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Save fehlgeschlagen'); setStatus('error'); return }
      setStatus('saved')
      if (onSaved) onSaved(data.progress ?? 0)
      setTimeout(() => setStatus('idle'), 2500)
    } catch (e) { setError(String(e)); setStatus('error') }
  }

  function updateItem(i: number, patch: Partial<Item>) { setItems(items.map((x, j) => j === i ? { ...x, ...patch } : x)) }
  function removeItem(i: number) { setItems(items.filter((_, j) => j !== i)) }
  function addItem() { setItems([...items, { phaseName: '', metric: '', baseline: '', pessimist: '', realist: '', optimist: '', measureAt: '' }]) }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#1A5FD4' }}>Phasen-Währung</p>
          <h2 className="mt-1 text-xl font-bold text-gray-900">Currency pro Phase</h2>
          <p className="mt-1 text-sm text-gray-500">Baseline + Pessimist/Realist/Optimist + Mess-Zeitpunkt. Pricing gegen Realist, Garantie gegen Pessimist.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Phasen-Namen (aus Schritt 3)</label>
          <textarea value={phasesContext} onChange={(e) => setPhasesContext(e.target.value)}
            rows={3} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
            placeholder="z.B. Aufräumen, Aufstellen, Abliefern" />
        </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button onClick={suggest} disabled={status === 'suggesting'}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50">
            {status === 'suggesting' ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            AI: Vorschlagen
          </button>
          {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-700">Einträge ({items.length})</p>
          <button onClick={addItem} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800">
            <Plus size={12} /> Hinzufügen
          </button>
        </div>
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="rounded-xl border border-gray-200 bg-white p-3">
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-2">
                  <input value={item.phaseName ?? ''} onChange={(e) => updateItem(i, { phaseName: e.target.value })}
                    placeholder="Phase" className="w-full rounded-lg border border-gray-100 bg-white px-2.5 py-1.5 text-xs focus:outline-none" />
                  <input value={item.metric ?? ''} onChange={(e) => updateItem(i, { metric: e.target.value })}
                    placeholder="Metric" className="w-full rounded-lg border border-gray-100 bg-white px-2.5 py-1.5 text-xs focus:outline-none" />
                  <input value={item.baseline ?? ''} onChange={(e) => updateItem(i, { baseline: e.target.value })}
                    placeholder="Baseline" className="w-full rounded-lg border border-gray-100 bg-white px-2.5 py-1.5 text-xs focus:outline-none" />
                  <input value={item.pessimist ?? ''} onChange={(e) => updateItem(i, { pessimist: e.target.value })}
                    placeholder="Pessimist" className="w-full rounded-lg border border-gray-100 bg-white px-2.5 py-1.5 text-xs focus:outline-none" />
                  <input value={item.realist ?? ''} onChange={(e) => updateItem(i, { realist: e.target.value })}
                    placeholder="Realist" className="w-full rounded-lg border border-gray-100 bg-white px-2.5 py-1.5 text-xs focus:outline-none" />
                  <input value={item.optimist ?? ''} onChange={(e) => updateItem(i, { optimist: e.target.value })}
                    placeholder="Optimist" className="w-full rounded-lg border border-gray-100 bg-white px-2.5 py-1.5 text-xs focus:outline-none" />
                  <input value={item.measureAt ?? ''} onChange={(e) => updateItem(i, { measureAt: e.target.value })}
                    placeholder="Mess-Zeitpunkt" className="w-full rounded-lg border border-gray-100 bg-white px-2.5 py-1.5 text-xs focus:outline-none" />
                </div>
                <button onClick={() => removeItem(i)} className="text-gray-400 hover:text-red-500 mt-1"><X size={12} /></button>
              </div>
            </li>
          ))}
          {items.length === 0 && <li className="text-xs italic text-gray-400">Noch keine Einträge — AI: Vorschlagen oder + drücken.</li>}
        </ul>
        <div className="mt-5 flex items-center gap-3">
          <button onClick={save} disabled={status === 'saving' || items.length === 0}
            className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50">
            {status === 'saving' ? <Loader2 size={14} className="animate-spin" /> : status === 'saved' ? <CheckCircle2 size={14} /> : <Save size={14} />}
            {status === 'saved' ? 'Gespeichert' : 'Schritt speichern'}
          </button>
        </div>
      </div>
    </div>
  )
}
