'use client'

import { useState, type ReactNode } from 'react'
import { Loader2, Sparkles, Save, CheckCircle2 } from 'lucide-react'

interface Props {
  stepKey: string
  voiceName: string
  title: string
  why: string
  canSuggest?: boolean
  canSave?: boolean
  onSuggest: () => Promise<{ ok: boolean; result?: unknown; error?: string }>
  onSave: () => Promise<{ ok: boolean; progress?: number; error?: string }>
  onResult?: (result: unknown) => void
  onSaved?: (progress: number) => void
  children: ReactNode
}

export function StepShell({
  stepKey: _stepKey, voiceName, title, why,
  canSuggest = true, canSave = true,
  onSuggest, onSave, onResult, onSaved, children,
}: Props) {
  const [status, setStatus] = useState<'idle' | 'suggesting' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function suggest() {
    setStatus('suggesting'); setError(null)
    const res = await onSuggest()
    if (!res.ok) { setError(res.error || 'Suggest fehlgeschlagen'); setStatus('error'); return }
    if (onResult && res.result) onResult(res.result)
    setStatus('idle')
  }

  async function save() {
    setStatus('saving'); setError(null)
    const res = await onSave()
    if (!res.ok) { setError(res.error || 'Save fehlgeschlagen'); setStatus('error'); return }
    setStatus('saved')
    if (onSaved) onSaved(res.progress ?? 0)
    setTimeout(() => setStatus('idle'), 2500)
  }

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#1A5FD4' }}>{voiceName}</p>
        <h2 className="mt-1 text-xl font-bold text-gray-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">{why}</p>
      </header>

      {children}

      <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
        <button
          onClick={suggest}
          disabled={status === 'suggesting' || !canSuggest}
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
        >
          {status === 'suggesting' ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          AI: Vorschlagen
        </button>
        <button
          onClick={save}
          disabled={status === 'saving' || !canSave}
          className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
        >
          {status === 'saving' ? <Loader2 size={14} className="animate-spin" /> : status === 'saved' ? <CheckCircle2 size={14} /> : <Save size={14} />}
          {status === 'saved' ? 'Gespeichert' : 'Schritt speichern'}
        </button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </div>
  )
}

export async function callSuggest(stepKey: string, body: unknown) {
  try {
    const res = await fetch(`/api/wizard/b2b-angebote/step/${stepKey}/suggest`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) return { ok: false, error: data.error || `HTTP ${res.status}` }
    return { ok: true, result: data.result }
  } catch (e) { return { ok: false, error: String(e) } }
}

export async function callSave(stepKey: string, body: unknown) {
  try {
    const res = await fetch(`/api/wizard/b2b-angebote/step/${stepKey}/save`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) return { ok: false, error: data.error || `HTTP ${res.status}` }
    return { ok: true, progress: data.progress }
  } catch (e) { return { ok: false, error: String(e) } }
}

export function StepEditField({ label, value, onChange, placeholder, multiline }:
  { label?: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean }) {
  return (
    <div>
      {label && <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">{label}</label>}
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          rows={3} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs focus:border-blue-400 focus:outline-none" />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs focus:border-blue-400 focus:outline-none" />
      )}
    </div>
  )
}
