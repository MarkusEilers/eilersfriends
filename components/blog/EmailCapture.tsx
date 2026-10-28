'use client'

import { useState } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'

/** E-Mail-Feld mit Label und Knopf — läuft über die normale Newsletter-Anmeldung mit Double-Opt-in. */
export function EmailCapture({ source, button, buttonClass, layout = 'stack' }: {
  source: string; button: string; buttonClass: string; layout?: 'stack' | 'row'
}) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setState('loading')
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source, consentGiven: true }),
      })
      setState(res.ok ? 'done' : 'error')
    } catch { setState('error') }
  }
  if (state === 'done') {
    return <p className="flex items-center gap-2 text-sm font-semibold text-gray-800"><CheckCircle2 size={16} className="text-emerald-600" /> Prüf bitte Dein Postfach, dort liegt die Bestätigung.</p>
  }
  return (
    <form onSubmit={submit} className="w-full">
      <label className="mb-1.5 block text-xs text-gray-600">E-Mail</label>
      <div className={layout === 'row' ? 'flex gap-2' : 'space-y-2'}>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="du@firma.de"
          className="w-full min-w-0 flex-1 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-gray-400" />
        <button type="submit" disabled={state === 'loading'}
          className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-bold disabled:opacity-60 ${layout === 'stack' ? 'w-full' : ''} ${buttonClass}`}>
          {state === 'loading' ? <Loader2 size={14} className="animate-spin" /> : null}{button}
        </button>
      </div>
      {state === 'error' && <p className="mt-2 text-xs text-red-600">Das hat nicht geklappt. Versuch es bitte noch einmal.</p>}
    </form>
  )
}
