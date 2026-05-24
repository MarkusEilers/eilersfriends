'use client'

import { useState } from 'react'
import { Loader2, Sparkles, Plus, X, Save, CheckCircle2 } from 'lucide-react'

type Item = Record<string, string>
interface Answers extends Record<string, unknown> { boosters?: Item[] }

interface Props { initialAnswers?: Answers; onSaved?: (p: number) => void }

export function BoosterStep({ initialAnswers, onSaved }: Props) {
  const [offerDescription, setOfferDescription] = useState(initialAnswers?.offerDescription ?? '')
  const [items, setItems] = useState<Item[]>((initialAnswers?.boosters as Item[] | undefined) ?? [])
  const [status, setStatus] = useState<'idle' | 'suggesting' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function suggest() {
    setStatus('suggesting'); setError(null)
    try {
      const res = await fetch('/api/wizard/b2b-angebote/step/06-booster/suggest', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerDescription  }),
      })
      const data = await res.json()
      if (!res.ok || !data.result) { setError(data.error || 'Suggest fehlgeschlagen'); setStatus('error'); return }
      const result = data.result as Answers
      if (Array.isArray(result.boosters)) setItems(result.boosters as Item[])
      setStatus('idle')
    } catch (e) { setError(String(e)); setStatus('error') }
  }

  async function save() {
    setStatus('saving'); setError(null)
    try {
      const res = await fetch('/api/wizard/b2b-angebote/step/06-booster/save', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boosters: items, offerDescription }),
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
  function addItem() { setItems([...items, { name: '', valueLabel: '', deliveryCost: '', anchor: '' }]) }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#1A5FD4' }}>Booster</p>
          <h2 className="mt-1 text-xl font-bold text-gray-900">Adjacent Pain mit Anker</h2>
          <p className="mt-1 text-sm text-gray-500">1-3 Booster. Echter Lieferaufwand höchstens 20 % des wahrgenommenen Werts. Zweites Problem gelöst + EUR-Anker + Margin-Schutz.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Angebots-Beschreibung</label>
          <textarea value={offerDescription} onChange={(e) => setOfferDescription(e.target.value)}
            rows={3} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
            placeholder="Was ist das Hauptangebot?" />
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
                  <input value={item.name ?? ''} onChange={(e) => updateItem(i, { name: e.target.value })}
                    placeholder="Booster-Name" className="w-full rounded-lg border border-gray-100 bg-white px-2.5 py-1.5 text-xs focus:outline-none" />
                  <input value={item.valueLabel ?? ''} onChange={(e) => updateItem(i, { valueLabel: e.target.value })}
                    placeholder="Wert in EUR" className="w-full rounded-lg border border-gray-100 bg-white px-2.5 py-1.5 text-xs focus:outline-none" />
                  <input value={item.deliveryCost ?? ''} onChange={(e) => updateItem(i, { deliveryCost: e.target.value })}
                    placeholder="Lieferaufwand" className="w-full rounded-lg border border-gray-100 bg-white px-2.5 py-1.5 text-xs focus:outline-none" />
                  <input value={item.anchor ?? ''} onChange={(e) => updateItem(i, { anchor: e.target.value })}
                    placeholder="Anker im Pitch" className="w-full rounded-lg border border-gray-100 bg-white px-2.5 py-1.5 text-xs focus:outline-none" />
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
