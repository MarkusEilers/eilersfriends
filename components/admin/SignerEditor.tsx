'use client'

import { useState, useTransition } from 'react'
import { Plus, X, Send, Check, Users, Link as LinkIcon } from 'lucide-react'
import { saveSignersAction } from '@/lib/actions/offers'

export interface SignerRow {
  id?: string
  name: string
  email: string
  role?: string | null
  status?: string
  sign_token?: string
  signed_at?: string | null
}

/** Unterzeichner verwalten — mehrere Personen zeichnen dasselbe Angebot. */
export function SignerEditor({ offerId, accessSalt, initial, order, onOrderChange }:
  { offerId: string; accessSalt?: string; initial: SignerRow[]; order: 'parallel' | 'sequential'; onOrderChange: (o: 'parallel' | 'sequential') => void }) {
  const [rows, setRows] = useState<SignerRow[]>(initial.length ? initial : [])
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  function upd(i: number, patch: Partial<SignerRow>) {
    setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)))
  }

  function save() {
    setErr(null); setMsg(null)
    start(async () => {
      try {
        const saved = await saveSignersAction(offerId, rows.map((r) => ({ id: r.id, name: r.name, email: r.email, role: r.role ?? null })))
        setRows(saved as SignerRow[])
        setMsg('Unterzeichner gespeichert.')
      } catch (e) { setErr(e instanceof Error ? e.message : String(e)) }
    })
  }

  function sendLinks() {
    setErr(null); setMsg(null)
    start(async () => {
      try {
        const r = await fetch(`/api/admin/offers/${offerId}/signers/send`, { method: 'POST' })
        const j = await r.json()
        if (!r.ok) setErr(j.error || `Fehler ${r.status}`)
        else setMsg(j.sent ? `${j.sent} Signing-Link${j.sent > 1 ? 's' : ''} verschickt.` : (j.note ?? 'Nichts zu versenden.'))
      } catch (e) { setErr(String(e)) }
    })
  }

  const signedCount = rows.filter((r) => r.status === 'signed').length

  return (
    <div>
      <p className="mb-3 text-xs text-gray-500">
        Wer unterschreiben muss. Jede Person bekommt einen persönlichen Link. Das Angebot gilt erst als angenommen,
        wenn alle unterschrieben haben. Die Zahlweise wählt, wer zuerst unterschreibt.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {(['parallel', 'sequential'] as const).map((o) => (
          <button key={o} type="button" onClick={() => onOrderChange(o)}
            className="rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors"
            style={order === o
              ? { borderColor: '#1A5FD4', backgroundColor: '#EBF1FF', color: '#1A5FD4' }
              : { borderColor: '#E5E7EB', backgroundColor: '#fff', color: '#6B7280' }}>
            {o === 'parallel' ? 'Parallel — alle gleichzeitig' : 'Nacheinander — erst A, dann B'}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={r.id ?? i} className="rounded-xl border border-gray-200 bg-white p-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                style={{ backgroundColor: r.status === 'signed' ? '#067647' : '#9CA3AF' }}>
                {r.status === 'signed' ? <Check size={12} /> : i + 1}
              </span>
              <input value={r.name} onChange={(e) => upd(i, { name: e.target.value })} placeholder="Name"
                disabled={r.status === 'signed'}
                className="w-40 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm outline-none focus:border-blue-400 disabled:bg-gray-50" />
              <input value={r.email} onChange={(e) => upd(i, { email: e.target.value })} placeholder="E-Mail" type="email"
                disabled={r.status === 'signed'}
                className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm outline-none focus:border-blue-400 disabled:bg-gray-50" />
              <input value={r.role ?? ''} onChange={(e) => upd(i, { role: e.target.value })} placeholder="Rolle (optional)"
                className="w-36 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm outline-none focus:border-blue-400" />
              {r.status !== 'signed' && (
                <button type="button" onClick={() => setRows((x) => x.filter((_, j) => j !== i))}
                  className="rounded-lg border border-red-200 bg-white px-2 py-1.5 text-red-600 hover:bg-red-50"><X size={13} /></button>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-3 pl-8 text-[11px] text-gray-400">
              <span>{r.status === 'signed' ? `unterschrieben${r.signed_at ? ` am ${new Date(r.signed_at).toLocaleDateString('de-DE')}` : ''}` : r.status === 'awaiting_confirm' ? 'wartet auf E-Mail-Bestätigung' : r.status === 'invited' ? 'Link verschickt' : 'noch nicht eingeladen'}</span>
              {r.sign_token && accessSalt && (
                <span className="inline-flex items-center gap-1">
                  <LinkIcon size={10} />
                  <code className="rounded bg-gray-50 px-1.5 py-0.5">/offer/{accessSalt}?s={r.sign_token.slice(0, 10)}…</code>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setRows((r) => [...r, { name: '', email: '', role: '' }])}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">
          <Plus size={13} /> Person hinzufügen
        </button>
        <button type="button" onClick={save} disabled={pending || rows.length === 0}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
          style={{ backgroundColor: '#0F1E3A' }}>
          <Users size={13} /> Unterzeichner speichern
        </button>
        <button type="button" onClick={sendLinks} disabled={pending || rows.some((r) => !r.id)}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
          style={{ backgroundColor: '#1A5FD4' }}>
          <Send size={13} /> Signing-Links verschicken
        </button>
        {rows.length > 0 && (
          <span className="text-xs text-gray-400">{signedCount}/{rows.length} unterschrieben</span>
        )}
      </div>

      {rows.some((r) => !r.id) && rows.length > 0 && (
        <p className="mt-2 text-[11px] text-amber-700">Erst speichern — danach lassen sich die Links verschicken.</p>
      )}
      {msg && <p className="mt-2 text-xs font-semibold text-green-700">{msg}</p>}
      {err && <p className="mt-2 text-xs font-semibold text-red-600">{err}</p>}
    </div>
  )
}
