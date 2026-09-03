'use client'

import { useState } from 'react'
import { Check, X, Loader2 } from 'lucide-react'

export function ModerationConfirm({ id, action, token }: { id: string; action: string; token: string }) {
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState('')
  const approve = action === 'freigeben'

  async function go() {
    setState('busy')
    try {
      const res = await fetch('/api/blog/moderate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, token }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setMsg(d.status === 'freigegeben' ? 'Der Kommentar steht jetzt online.' : 'Der Kommentar wurde abgelehnt.')
      setState('done')
    } catch (e) { setMsg(String(e)); setState('error') }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6" style={{ background: '#FAFAF8' }}>
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 text-center">
        {state === 'done' ? (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Check size={22} />
            </div>
            <p className="mt-4 text-sm text-gray-700">{msg}</p>
            <a href="/de/admin/blog/kommentare" className="mt-5 inline-block text-xs font-semibold text-gray-500 hover:text-gray-900">
              Zur Freigabe-Liste
            </a>
          </>
        ) : (
          <>
            <div
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
              style={approve ? { background: '#ECFDF5', color: '#059669' } : { background: '#FEF2F2', color: '#DC2626' }}
            >
              {approve ? <Check size={22} /> : <X size={22} />}
            </div>
            <h1 className="mt-4 text-lg font-bold text-gray-900">
              Kommentar {approve ? 'freigeben' : 'ablehnen'}?
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-gray-500">
              Noch ein Klick. Der Umweg ist Absicht — sonst würde schon das Öffnen der Mail den Kommentar freischalten.
            </p>
            <button
              onClick={go} disabled={state === 'busy'}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
              style={{ background: approve ? '#059669' : '#DC2626' }}
            >
              {state === 'busy' && <Loader2 size={14} className="animate-spin" />}
              {approve ? 'Ja, freigeben' : 'Ja, ablehnen'}
            </button>
            {state === 'error' && <p className="mt-3 text-xs text-red-600">{msg}</p>}
          </>
        )}
      </div>
    </main>
  )
}
