'use client'

import { useState } from 'react'
import { Loader2, Sparkles, Save, CheckCircle2, ShieldCheck } from 'lucide-react'

interface Answers {
  type?: string; trigger?: string; consequence?: string
  anchorPhase?: string; anchorCurrency?: string; espressoTest?: string
  contextInput?: string
}

export function WortGarantieStep({ initialAnswers, onSaved }: { initialAnswers?: Answers; onSaved?: (p: number) => void }) {
  const [a, setA] = useState<Answers>(initialAnswers ?? {})
  const [status, setStatus] = useState<'idle' | 'suggesting' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  function set<K extends keyof Answers>(k: K, v: Answers[K]) { setA((p) => ({ ...p, [k]: v })) }

  async function suggest() {
    setStatus('suggesting'); setError(null)
    try {
      const res = await fetch('/api/wizard/b2b-angebote/step/07-wort-garantie/suggest', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contextInput: a.contextInput }),
      })
      const data = await res.json()
      if (!res.ok || !data.result) { setError(data.error || 'Suggest fehlgeschlagen'); setStatus('error'); return }
      setA((p) => ({ ...p, ...(data.result as Answers) })); setStatus('idle')
    } catch (e) { setError(String(e)); setStatus('error') }
  }
  async function save() {
    setStatus('saving'); setError(null)
    try {
      const res = await fetch('/api/wizard/b2b-angebote/step/07-wort-garantie/save', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(a),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Save fehlgeschlagen'); setStatus('error'); return }
      setStatus('saved'); if (onSaved) onSaved(data.progress ?? 0)
      setTimeout(() => setStatus('idle'), 2500)
    } catch (e) { setError(String(e)); setStatus('error') }
  }

  const canSave = !!(a.type && a.trigger && a.consequence)

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#1A5FD4' }}>Wort-Garantie</p>
          <h2 className="mt-1 text-xl font-bold text-gray-900">Verteidigbare Garantie</h2>
          <p className="mt-1 text-sm text-gray-500">Typ + Trigger + Konsequenz + Anker. Espresso-Test bestanden.</p>
        </div>
        <textarea value={a.contextInput ?? ''} onChange={(e) => set('contextInput', e.target.value)}
          rows={3} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm"
          placeholder="Kontext: Phasen, Currencies, Lieferversprechen — alles, das die Garantie tragen kann." />
        <div className="mt-5 flex gap-3">
          <button onClick={suggest} disabled={status === 'suggesting'}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50">
            {status === 'suggesting' ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            AI: Vorschlagen
          </button>
          {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
      </div>

      <div className="rounded-2xl border border-green-200 bg-green-50/30 p-6">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={16} className="text-green-700" />
          <span className="text-xs font-bold uppercase tracking-widest text-green-800">Garantie-Komponenten</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input value={a.type ?? ''} onChange={(e) => set('type', e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm" placeholder="Typ (z.B. Refund / Office-Hours)" />
          <input value={a.trigger ?? ''} onChange={(e) => set('trigger', e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm" placeholder="Trigger (wann greift sie)" />
        </div>
        <textarea value={a.consequence ?? ''} onChange={(e) => set('consequence', e.target.value)}
          rows={2} className="mt-3 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm" placeholder="Konsequenz (was passiert)" />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input value={a.anchorPhase ?? ''} onChange={(e) => set('anchorPhase', e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm" placeholder="Anker-Phase (aus Step 3)" />
          <input value={a.anchorCurrency ?? ''} onChange={(e) => set('anchorCurrency', e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm" placeholder="Anker-Währung (aus Step 4)" />
        </div>
        <textarea value={a.espressoTest ?? ''} onChange={(e) => set('espressoTest', e.target.value)}
          rows={2} className="mt-3 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm" placeholder="Espresso-Test (1 Satz, max 25 Wörter)" />
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
