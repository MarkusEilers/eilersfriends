'use client'

import { useState } from 'react'
import { Gavel, FileText, Upload, Send, Lock, Loader2, Copy, Check } from 'lucide-react'

/**
 * Was nach dem Gespraech passiert: Entscheidungen festhalten, Transkript
 * hinterlegen, Teilnehmer einladen, Termin abschliessen.
 *
 * Abschliessen friert den Stand ein und setzt bei jeder offenen Karte einen
 * Strich. Ab dem vierten Strich sieht man beim naechsten Mal auf einen Blick,
 * was seit Wochen mitlaeuft.
 */
export function MeetingTools({
  meetingId, shareToken, status, summary: initialSummary, transcript: initialTranscript, participants,
}: {
  meetingId: string; shareToken: string; status: string
  summary: string; transcript: string
  participants: Array<{ id: string; email: string; name: string | null; opened_at: string | null }>
}) {
  const [summary, setSummary] = useState(initialSummary)
  const [transcript, setTranscript] = useState(initialTranscript)
  const [decision, setDecision] = useState({ text: '', rationale: '', decidedBy: '', consequence: '' })
  const [invite, setInvite] = useState({ email: '', name: '' })
  const [busy, setBusy] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const call = async (body: Record<string, unknown>, label: string) => {
    setBusy(label); setNote(null)
    try {
      const res = await fetch('/api/admin/meetings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, meetingId }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setNote('Gespeichert.')
      return d
    } catch (e) { setNote(String(e)); return null } finally { setBusy(null) }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
          <Gavel size={12} /> Entscheidung festhalten
        </h3>
        <input
          value={decision.text} onChange={(e) => setDecision({ ...decision, text: e.target.value })}
          placeholder="Was wurde entschieden?"
          className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
        />
        <textarea
          value={decision.rationale} onChange={(e) => setDecision({ ...decision, rationale: e.target.value })}
          rows={2} placeholder="Warum — der Grund ist in drei Monaten mehr wert als die Entscheidung"
          className="mt-2 w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
        />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <input
            value={decision.decidedBy} onChange={(e) => setDecision({ ...decision, decidedBy: e.target.value })}
            placeholder="Wer" className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <input
            value={decision.consequence} onChange={(e) => setDecision({ ...decision, consequence: e.target.value })}
            placeholder="Folge" className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={async () => {
            if (!decision.text.trim()) return
            const d = await call({ action: 'decision', ...decision }, 'decision')
            if (d) { setDecision({ text: '', rationale: '', decidedBy: '', consequence: '' }); location.reload() }
          }}
          disabled={busy === 'decision'}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
        >
          {busy === 'decision' && <Loader2 size={12} className="animate-spin" />} Aufnehmen
        </button>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
          <FileText size={12} /> Zusammenfassung und Transkript
        </h3>
        <textarea
          value={summary} onChange={(e) => setSummary(e.target.value)} rows={3}
          placeholder="Zusammenfassung — steht oben im Protokoll"
          className="mt-3 w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
        />
        <label className="mt-2 flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold text-gray-500 hover:text-gray-900">
          <Upload size={12} /> Transkript-Datei laden
          <input
            type="file" accept=".txt,.md,.vtt,.srt" className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0]
              if (!f) return
              setTranscript(await f.text())
            }}
          />
        </label>
        {transcript && (
          <p className="mt-1 text-[11px] text-gray-400">{transcript.length.toLocaleString('de-DE')} Zeichen geladen</p>
        )}
        <button
          onClick={() => call({ action: 'transcript', summary, transcript, source: 'upload' }, 'transcript')}
          disabled={busy === 'transcript'}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
        >
          {busy === 'transcript' && <Loader2 size={12} className="animate-spin" />} Speichern
        </button>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
          <Send size={12} /> Teilnehmer und Zugänge
        </h3>
        <ul className="mt-3 space-y-1.5">
          {participants.map((p) => (
            <li key={p.id} className="flex items-center gap-2 text-sm">
              <span className="min-w-0 flex-1 truncate text-gray-700">{p.name ?? p.email}</span>
              <span className="shrink-0 text-[11px] text-gray-400">
                {p.opened_at ? 'geöffnet' : 'noch nicht geöffnet'}
              </span>
            </li>
          ))}
          {!participants.length && <li className="text-[12px] text-gray-400">Noch niemand eingeladen.</li>}
        </ul>
        <div className="mt-3 flex gap-2">
          <input
            value={invite.name} onChange={(e) => setInvite({ ...invite, name: e.target.value })}
            placeholder="Name" className="w-28 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs"
          />
          <input
            value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })}
            placeholder="E-Mail" className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs"
          />
          <button
            onClick={async () => {
              if (!invite.email.trim()) return
              const d = await call({ action: 'participant', ...invite }, 'invite')
              if (d) { setInvite({ email: '', name: '' }); location.reload() }
            }}
            disabled={busy === 'invite'}
            className="shrink-0 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
          >
            Hinzufügen
          </button>
        </div>
        <p className="mt-2 text-[11px] leading-snug text-gray-400">
          Jeder bekommt einen eigenen Zugang. Ein gemeinsamer Link wäre bequemer und wertlos — dann stünde
          unter jeder Bewegung nur „jemand“.
        </p>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
          <Lock size={12} /> Abschließen
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          Friert den Stand als Protokoll ein und setzt bei jeder offenen Karte einen Strich. Die Bretter laufen
          weiter — Abschließen beendet den Termin, nicht die Arbeit.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={async () => { await call({ action: 'close' }, 'close'); location.reload() }}
            disabled={busy === 'close' || status === 'protokolliert'}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            {busy === 'close' && <Loader2 size={12} className="animate-spin" />}
            {status === 'protokolliert' ? 'Abgeschlossen' : 'Termin abschließen'}
          </button>
          {shareToken && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${location.origin}/de/protokoll/${shareToken}`)
                setCopied(true); setTimeout(() => setCopied(false), 1500)
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />} Protokoll-Link
            </button>
          )}
        </div>
        {note && <p className="mt-2 text-[11px] text-gray-500">{note}</p>}
      </section>
    </div>
  )
}
