'use client'

import { useState } from 'react'
import { Loader2, Sparkles, Plus, X, Save, CheckCircle2, Trophy } from 'lucide-react'

interface NameOption { name: string; style?: string; espressoTestScore?: number; recommended?: boolean }
interface Answers { nameOptions?: NameOption[]; headlineOptions?: string[]; cta?: string; offerDescription?: string }

export function Letzten20Step({ initialAnswers, onSaved }: { initialAnswers?: Answers; onSaved?: (p: number) => void }) {
  const [a, setA] = useState<Answers>(initialAnswers ?? {})
  const [status, setStatus] = useState<'idle' | 'suggesting' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  function set<K extends keyof Answers>(k: K, v: Answers[K]) { setA((p) => ({ ...p, [k]: v })) }

  async function suggest() {
    setStatus('suggesting'); setError(null)
    try {
      const res = await fetch('/api/wizard/b2b-angebote/step/08-letzten-20-prozent/suggest', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerDescription: a.offerDescription }),
      })
      const data = await res.json()
      if (!res.ok || !data.result) { setError(data.error || 'Suggest fehlgeschlagen'); setStatus('error'); return }
      setA((p) => ({ ...p, ...(data.result as Answers) })); setStatus('idle')
    } catch (e) { setError(String(e)); setStatus('error') }
  }
  async function save() {
    setStatus('saving'); setError(null)
    try {
      const res = await fetch('/api/wizard/b2b-angebote/step/08-letzten-20-prozent/save', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(a),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Save fehlgeschlagen'); setStatus('error'); return }
      setStatus('saved'); if (onSaved) onSaved(data.progress ?? 0)
      setTimeout(() => setStatus('idle'), 2500)
    } catch (e) { setError(String(e)); setStatus('error') }
  }

  const names = a.nameOptions ?? []
  const heads = a.headlineOptions ?? []
  const canSave = names.length > 0 || heads.length > 0 || !!a.cta

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#1A5FD4' }}>Die letzten 20 Prozent</p>
          <h2 className="mt-1 text-xl font-bold text-gray-900">Name · Headline · CTA</h2>
          <p className="mt-1 text-sm text-gray-500">Drei Mikro-Entscheidungen. Espresso-Test mindestens 4 von 5.</p>
        </div>
        <textarea value={a.offerDescription ?? ''} onChange={(e) => set('offerDescription', e.target.value)}
          rows={3} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm" placeholder="Angebots-Beschreibung für Kontext" />
        <div className="mt-5 flex gap-3">
          <button onClick={suggest} disabled={status === 'suggesting'}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50">
            {status === 'suggesting' ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            AI: Vorschlagen
          </button>
          {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
      </div>

      <div className="rounded-2xl border border-blue-200 bg-blue-50/30 p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Trophy size={14} className="text-blue-700" />
            <span className="text-xs font-bold uppercase tracking-widest text-blue-800">Name-Optionen</span>
          </div>
          <button onClick={() => set('nameOptions', [...names, { name: '', style: '', espressoTestScore: 0, recommended: false }])}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
            <Plus size={12} /> Name
          </button>
        </div>
        <ul className="space-y-2">
          {names.map((n, i) => (
            <li key={i} className={`rounded-lg border bg-white p-2 ${n.recommended ? 'border-blue-400 shadow-sm' : 'border-gray-100'}`}>
              <div className="flex items-start gap-2">
                <input value={n.name} onChange={(e) => set('nameOptions', names.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                  placeholder="Name" className="flex-1 bg-transparent text-sm font-bold focus:outline-none" />
                <input value={n.style ?? ''} onChange={(e) => set('nameOptions', names.map((x, j) => j === i ? { ...x, style: e.target.value } : x))}
                  placeholder="Stil" className="w-32 bg-transparent text-[11px] text-gray-500 focus:outline-none" />
                <input type="number" min={0} max={5} value={n.espressoTestScore ?? 0}
                  onChange={(e) => set('nameOptions', names.map((x, j) => j === i ? { ...x, espressoTestScore: parseInt(e.target.value, 10) || 0 } : x))}
                  className="w-10 bg-transparent text-xs text-center focus:outline-none" />
                <label className="text-[10px] font-bold text-blue-700 flex items-center gap-1">
                  <input type="checkbox" checked={!!n.recommended}
                    onChange={(e) => set('nameOptions', names.map((x, j) => j === i ? { ...x, recommended: e.target.checked } : x))} /> Empf
                </label>
                <button onClick={() => set('nameOptions', names.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500"><X size={10} /></button>
              </div>
            </li>
          ))}
          {names.length === 0 && <li className="text-xs italic text-gray-400">Noch keine Name-Optionen.</li>}
        </ul>
      </div>

      <div className="rounded-2xl border border-blue-200 bg-blue-50/30 p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-800">Headline-Optionen</span>
          <button onClick={() => set('headlineOptions', [...heads, ''])} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
            <Plus size={12} /> Headline
          </button>
        </div>
        <ul className="space-y-2">
          {heads.map((h, i) => (
            <li key={i} className="flex gap-2">
              <input value={h} onChange={(e) => set('headlineOptions', heads.map((x, j) => j === i ? e.target.value : x))}
                className="flex-1 rounded-lg border border-gray-100 bg-white px-2 py-1.5 text-xs focus:outline-none" placeholder="Headline" />
              <button onClick={() => set('headlineOptions', heads.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500"><X size={12} /></button>
            </li>
          ))}
          {heads.length === 0 && <li className="text-xs italic text-gray-400">Noch keine Headlines.</li>}
        </ul>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">CTA (Button-Text)</label>
        <input value={a.cta ?? ''} onChange={(e) => set('cta', e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm" placeholder="z.B. Bauplan jetzt holen" />
        <div className="mt-5">
          <button onClick={save} disabled={status === 'saving' || !canSave}
            className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50">
            {status === 'saving' ? <Loader2 size={14} className="animate-spin" /> : status === 'saved' ? <CheckCircle2 size={14} /> : <Save size={14} />}
            {status === 'saved' ? 'Gespeichert' : 'Schritt speichern'}
          </button>
        </div>
      </div>
    </div>
  )
}
