'use client'
import { useEffect, useState } from 'react'
import { Loader2, Check } from 'lucide-react'

const ACCENT = '#1A5FD4'
const TZ = 'Europe/Berlin'

export function BookingWidget({ person, type, personName, durationMin }: { person: string; type: string; personName: string; durationMin: number }) {
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(true)
  const [slots, setSlots] = useState<string[]>([])
  const [day, setDay] = useState<string | null>(null)
  const [slot, setSlot] = useState<string | null>(null)
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false); const [done, setDone] = useState(false); const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/schedule/availability?person=${person}&type=${type}`).then(r => r.json()).then(d => {
      setConnected(d.connected !== false); setSlots(d.slots || [])
      if (d.slots?.length) setDay(dayKey(d.slots[0]))
    }).catch(() => setConnected(false)).finally(() => setLoading(false))
  }, [person, type])

  function dayKey(iso: string) { return new Intl.DateTimeFormat('de-DE', { timeZone: TZ, weekday: 'short', day: '2-digit', month: 'long' }).format(new Date(iso)) }
  function timeLabel(iso: string) { return new Intl.DateTimeFormat('de-DE', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(new Date(iso)) }

  const days: string[] = []
  const byDay: Record<string, string[]> = {}
  for (const s of slots) { const k = dayKey(s); if (!byDay[k]) { byDay[k] = []; days.push(k) } byDay[k].push(s) }

  async function submit() {
    if (!slot || !name || !/.+@.+\..+/.test(email)) { setErr('Bitte Name, gültige E-Mail und Slot angeben.'); return }
    setSubmitting(true); setErr(null)
    try {
      const res = await fetch('/api/schedule/book', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ person, type, slot, name, email, note }) })
      const d = await res.json()
      if (!res.ok) { setErr(d.error === 'slot_taken' ? 'Der Slot ist gerade weg — bitte einen anderen wählen.' : 'Buchung fehlgeschlagen. Bitte erneut versuchen.'); if (d.error === 'slot_taken') { setSlot(null) } return }
      setDone(true)
    } catch { setErr('Verbindung fehlgeschlagen.') } finally { setSubmitting(false) }
  }

  if (loading) return <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 size={16} className="animate-spin" /> Verfügbarkeit wird geladen…</div>
  if (!connected) return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">Die Online-Buchung ist gerade nicht verbunden. Schreib uns kurz: <a href="mailto:team@eilersfriends.com" className="underline">team@eilersfriends.com</a>.</div>
  if (done) return (
    <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
      <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-white"><Check size={22} /></span>
      <p className="text-lg font-bold text-green-900">Termin gebucht.</p>
      <p className="mt-1 text-sm text-green-800">Du bekommst gleich eine Kalender-Einladung an {email}. Bis bald!</p>
    </div>
  )
  if (!slots.length) return <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">Aktuell keine freien Slots im Fenster. Schreib uns: <a href="mailto:team@eilersfriends.com" className="underline" style={{ color: ACCENT }}>team@eilersfriends.com</a>.</div>

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Tag wählen</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {days.slice(0, 14).map(d => (
            <button key={d} onClick={() => { setDay(d); setSlot(null) }} className={'rounded-full border px-3 py-1.5 text-xs font-semibold ' + (day === d ? 'border-transparent text-white' : 'border-gray-200 text-gray-600 hover:border-blue-300')} style={day === d ? { backgroundColor: ACCENT } : undefined}>{d}</button>
          ))}
        </div>
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Uhrzeit (CET)</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {(day ? byDay[day] : []).map(s => (
            <button key={s} onClick={() => setSlot(s)} className={'rounded-lg border px-2 py-2 text-sm font-semibold ' + (slot === s ? 'border-transparent text-white' : 'border-gray-200 text-gray-700 hover:border-blue-300')} style={slot === s ? { backgroundColor: ACCENT } : undefined}>{timeLabel(s)}</button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Deine Daten</p>
        {slot && <p className="mb-3 rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800">{dayKey(slot)} · {timeLabel(slot)} Uhr · {durationMin} Min mit {personName}</p>}
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="mb-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400" />
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="E-Mail" className="mb-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400" />
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Worum geht's? (optional)" rows={3} className="mb-3 w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400" />
        {err && <p className="mb-2 text-sm text-red-600">{err}</p>}
        <button onClick={submit} disabled={submitting || !slot} className="inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white disabled:opacity-40" style={{ backgroundColor: ACCENT }}>
          {submitting ? <Loader2 size={15} className="animate-spin" /> : null}{submitting ? 'Buche…' : 'Termin buchen'}
        </button>
      </div>
    </div>
  )
}
