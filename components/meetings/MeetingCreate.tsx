'use client'

import { useMemo, useState } from 'react'
import { Loader2, Plus, Repeat } from 'lucide-react'

/** Neuer Termin — mit oder ohne Reihe. Die Reihe ist der Bezug, der alles traegt. */
export function MeetingCreate({
  orgs, series,
}: { orgs: Array<{ id: string; name: string }>; series: Array<{ id: string; name: string; org_id: string }> }) {
  const [orgId, setOrgId] = useState(orgs[0]?.id ?? '')
  const [seriesId, setSeriesId] = useState<string>('')
  const [newSeries, setNewSeries] = useState('')
  const [title, setTitle] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [place, setPlace] = useState('')
  const [people, setPeople] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mine = useMemo(() => series.filter((s) => s.org_id === orgId), [series, orgId])

  async function create() {
    setBusy(true); setError(null)
    try {
      let sid = seriesId || null
      if (!sid && newSeries.trim()) {
        const r = await fetch('/api/admin/meetings', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'series', orgId, name: newSeries.trim() }),
        }).then((x) => x.json())
        if (!r.ok) throw new Error(r.error)
        sid = r.id
      }
      const participants = people.split('\n').map((l) => l.trim()).filter(Boolean).map((line) => {
        const m = line.match(/^(.*?)[<\s]*([^\s<>]+@[^\s<>]+?)>?$/)
        return { name: m?.[1]?.trim() || null, email: m?.[2] ?? line }
      })
      const res = await fetch('/api/admin/meetings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'meeting', orgId, seriesId: sid, title,
          startsAt: new Date(startsAt).toISOString(), location: place, participants,
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      window.location.href = `/de/admin/meetings/${d.meeting.id}`
    } catch (e) { setError(String(e)); setBusy(false) }
  }

  return (
    <div className="max-w-2xl rounded-2xl border border-gray-200 bg-white p-6">
      <h1 className="text-xl font-bold text-gray-900">Neuer Termin</h1>

      <label className="mt-5 block text-[10px] font-bold uppercase tracking-widest text-gray-400">Organisation</label>
      <select
        value={orgId} onChange={(e) => { setOrgId(e.target.value); setSeriesId('') }}
        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
      >
        {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>

      <label className="mt-4 block text-[10px] font-bold uppercase tracking-widest text-gray-400">Reihe</label>
      <select
        value={seriesId} onChange={(e) => setSeriesId(e.target.value)}
        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
      >
        <option value="">— neue Reihe anlegen —</option>
        {mine.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      {!seriesId && (
        <div className="mt-2">
          <input
            value={newSeries} onChange={(e) => setNewSeries(e.target.value)}
            placeholder="Name der Reihe, z.B. Jour fixe Vertrieb"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <p className="mt-1 flex items-start gap-1.5 text-[11px] leading-snug text-gray-400">
            <Repeat size={11} className="mt-0.5 shrink-0" />
            Die Reihe bekommt zwei Bretter: Themen mit Agenda und Prio 1 bis 3, Aktivitäten von Neu bis Erledigt.
            Jeder weitere Termin dieser Reihe sieht dieselben Karten im dann aktuellen Zustand.
          </p>
        </div>
      )}

      <label className="mt-4 block text-[10px] font-bold uppercase tracking-widest text-gray-400">Titel</label>
      <input
        value={title} onChange={(e) => setTitle(e.target.value)}
        placeholder="Worum geht es?" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
      />

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Beginn</label>
          <input
            type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Ort</label>
          <input
            value={place} onChange={(e) => setPlace(e.target.value)}
            placeholder="Teams, Büro, …" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <label className="mt-4 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
        Teilnehmer — einer je Zeile
      </label>
      <textarea
        value={people} onChange={(e) => setPeople(e.target.value)} rows={4}
        placeholder={'Anna Muster anna@firma.de\nbernd@firma.de'}
        className="mt-1 w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm"
      />

      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

      <button
        onClick={create} disabled={busy || !title.trim() || !startsAt || !orgId}
        className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Termin anlegen
      </button>
    </div>
  )
}
