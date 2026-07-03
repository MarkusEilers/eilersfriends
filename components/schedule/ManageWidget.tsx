'use client'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Loader2, Video, CalendarClock, X, Check } from 'lucide-react'

const ACCENT = '#1A5FD4'
const TZ = 'Europe/Berlin'
function berlinDayKey(iso: string) {
  const p: Record<string, string> = {}
  for (const x of new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(iso))) p[x.type] = x.value
  return `${p.year}-${p.month}-${p.day}`
}
function timeLabel(iso: string) { return new Intl.DateTimeFormat('de-DE', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(new Date(iso)) }
function dayHuman(key: string) { const [y, m, d] = key.split('-').map(Number); return new Intl.DateTimeFormat('de-DE', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'long' }).format(new Date(Date.UTC(y, m - 1, d, 12))) }
function fullWhen(iso: string) { return new Intl.DateTimeFormat('de-DE', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(iso)) }

export function ManageWidget({ token, owner, type, personName, start, durationMin, status, joinUrl }: {
  token: string; owner: string; type: string; personName: string; start: string; durationMin: number; status: string; joinUrl: string | null
}) {
  const [state, setState] = useState<'view' | 'reschedule' | 'cancelled' | 'rescheduled'>(status === 'cancelled' ? 'cancelled' : 'view')
  const [curStart, setCurStart] = useState(start)
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null)
  const [confirmCancel, setConfirmCancel] = useState(false)

  const [slots, setSlots] = useState<string[]>([]); const [loadingSlots, setLoadingSlots] = useState(false)
  const [day, setDay] = useState<string | null>(null); const [slot, setSlot] = useState<string | null>(null)

  useEffect(() => {
    if (state !== 'reschedule' || slots.length) return
    setLoadingSlots(true)
    fetch(`/api/schedule/availability?person=${owner}&type=${type}`).then(r => r.json()).then(d => {
      const s: string[] = d.slots || []; setSlots(s); if (s.length) setDay(berlinDayKey(s[0]))
    }).finally(() => setLoadingSlots(false))
  }, [state, owner, type, slots.length])

  const days: string[] = []; const byDay: Record<string, string[]> = {}
  for (const s of slots) { const k = berlinDayKey(s); if (!byDay[k]) { byDay[k] = []; days.push(k) } byDay[k].push(s) }

  async function doCancel() {
    setBusy(true); setErr(null)
    try { const r = await fetch('/api/schedule/manage/cancel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) }); if (!r.ok) throw new Error(); setState('cancelled') }
    catch { setErr('Absage fehlgeschlagen. Bitte erneut versuchen.') } finally { setBusy(false) }
  }
  async function doReschedule() {
    if (!slot) return
    setBusy(true); setErr(null)
    try {
      const r = await fetch('/api/schedule/manage/reschedule', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, slot }) })
      const d = await r.json()
      if (!r.ok) { setErr(d.error === 'slot_taken' ? 'Zeit gerade vergeben — bitte andere wählen.' : 'Umbuchen fehlgeschlagen.'); if (d.error === 'slot_taken') { setSlots(p => p.filter(x => x !== slot)); setSlot(null) }; return }
      setCurStart(d.start || slot); setState('rescheduled')
    } catch { setErr('Verbindung fehlgeschlagen.') } finally { setBusy(false) }
  }

  if (state === 'cancelled') return <Box tone="red"><p className="text-base font-bold">Termin abgesagt.</p><p className="mt-1 text-sm">Der Termin wurde storniert. Du kannst jederzeit einen neuen buchen.</p></Box>
  if (state === 'rescheduled') return <Box tone="green"><span className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-green-600 text-white"><Check size={20} /></span><p className="text-base font-bold text-green-900">Umgebucht.</p><p className="mt-1 text-sm capitalize text-green-800">Neuer Termin: {fullWhen(curStart)} Uhr</p><p className="mt-1 text-sm text-green-800">Die aktualisierte Einladung ist unterwegs.</p></Box>

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: '#EBF1FF' }}><CalendarClock size={20} style={{ color: ACCENT }} /></span>
        <div><p className="text-sm font-bold capitalize text-gray-900">{fullWhen(curStart)} Uhr</p><p className="text-xs text-gray-500">{durationMin} Min mit {personName}</p></div>
      </div>
      {joinUrl && <a href={joinUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold" style={{ color: ACCENT }}><Video size={15} /> Teams-Meeting öffnen</a>}

      {state === 'view' && (
        <div className="mt-6 flex flex-wrap gap-2">
          <button onClick={() => setState('reschedule')} className="rounded-full px-5 py-2.5 text-sm font-bold text-white" style={{ backgroundColor: ACCENT }}>Umbuchen</button>
          {!confirmCancel ? (
            <button onClick={() => setConfirmCancel(true)} className="rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:border-red-300 hover:text-red-600">Absagen</button>
          ) : (
            <span className="inline-flex items-center gap-2">
              <button onClick={doCancel} disabled={busy} className="inline-flex items-center gap-1 rounded-full bg-red-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />} Wirklich absagen</button>
              <button onClick={() => setConfirmCancel(false)} className="text-sm font-semibold text-gray-400 hover:text-gray-700">Zurück</button>
            </span>
          )}
        </div>
      )}

      {state === 'reschedule' && (
        <div className="mt-6">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Neue Zeit wählen</p>
          {loadingSlots ? (
            <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 size={15} className="animate-spin" /> Verfügbarkeit lädt…</div>
          ) : !slots.length ? (
            <p className="text-sm text-gray-500">Aktuell keine freien Zeiten. Schreib uns: <a href="mailto:team@eilersfriends.com" className="underline">team@eilersfriends.com</a>.</p>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap gap-2">
                {days.slice(0, 14).map(d => <button key={d} onClick={() => { setDay(d); setSlot(null) }} className={'rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ' + (day === d ? 'border-transparent text-white' : 'border-gray-200 text-gray-600 hover:border-blue-300')} style={day === d ? { backgroundColor: ACCENT } : undefined}>{dayHuman(d)}</button>)}
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {(day ? byDay[day] : []).map(s => <button key={s} onClick={() => setSlot(s)} className={'rounded-lg border px-2 py-2 text-sm font-semibold ' + (slot === s ? 'border-transparent text-white' : 'border-gray-200 text-gray-700 hover:border-blue-300')} style={slot === s ? { backgroundColor: ACCENT } : undefined}>{timeLabel(s)}</button>)}
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={doReschedule} disabled={busy || !slot} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40" style={{ backgroundColor: ACCENT }}>{busy && <Loader2 size={14} className="animate-spin" />}Neue Zeit bestätigen</button>
                <button onClick={() => { setState('view'); setSlot(null) }} className="text-sm font-semibold text-gray-400 hover:text-gray-700">Abbrechen</button>
              </div>
            </>
          )}
        </div>
      )}
      {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
    </div>
  )
}

function Box({ children, tone }: { children: ReactNode; tone: 'red' | 'green' }) {
  const c = tone === 'red' ? 'border-red-200 bg-red-50 text-red-800' : 'border-green-200 bg-green-50 text-green-900'
  return <div className={'rounded-2xl border p-8 text-center ' + c}>{children}</div>
}
