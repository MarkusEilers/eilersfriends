'use client'

import { useState, useTransition } from 'react'
import { Wand2, Loader2 } from 'lucide-react'
import { normalizeAllLogosAction } from '@/lib/actions/logo-finder'

/** Erzeugt für alle Logos die Monochrom-Fassung neu (für helle und dunkle Logoleisten). */
export function LogoNormalizeButton() {
  const [busy, start] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)
  return (
    <div className="flex items-center gap-3">
      {msg && <span className="text-xs text-gray-500">{msg}</span>}
      <button type="button" disabled={busy}
        onClick={() => start(async () => { const r = await normalizeAllLogosAction(); setMsg(`${r.ok} aufbereitet${r.failed.length ? ` · Fehler: ${r.failed.join(', ')}` : ''}`); setTimeout(() => window.location.reload(), 1500) })}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
        {busy ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />} Alle Logos aufbereiten
      </button>
    </div>
  )
}
