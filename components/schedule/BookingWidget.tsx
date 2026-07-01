'use client'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Loader2, Check, ChevronLeft, ChevronRight, Video, CalendarPlus, ArrowLeft } from 'lucide-react'

const ACCENT = '#1A5FD4'
const INK = '#0D0D0B'
const TZ = 'Europe/Berlin'
const WD = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

type Booked = { start: string; end: string; joinUrl: string | null; title: string }

function pad(n: number) { return String(n).padStart(2, '0') }
function berlinDayKey(iso: string) {
  const p: Record<string, string> = {}
  for (const x of new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(iso))) p[x.type] = x.value
  return `${p.year}-${p.month}-${p.day}`
}
function timeLabel(iso: string) { return new Intl.DateTimeFormat('de-DE', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(new Date(iso)) }
function dayHuman(key: string) {
  const [y, m, d] = key.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d, 12))
  return new Intl.DateTimeFormat('de-DE', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' }).format(dt)
}
// Monday = 0
function firstWeekdayMon(y: number, m: number) { return (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7 }
function daysInMonth(y: number, m: number) { return new Date(Date.UTC(y, m, 0)).getUTCDate() }

export function BookingWidget({ person, type, personName, durationMin }: { person: string; type: string; personName: string; durationMin: number }) {
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(true)
  const [slots, setSlots] = useState<string[]>([])
  const [dayKey, setDayKey] = useState<string | null>(null)
  const [slot, setSlot] = useState<string | null>(null)
  const [cursor, setCursor] = useState<{ y: number; m: number } | null>(null)
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false); const [booked, setBooked] = useState<Booked | null>(null); const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    fetch(`/api/schedule/availability?person=${person}&type=${type}`).then(r => r.json()).then(d => {
      if (!alive) return
      setConnected(d.connected !== false)
      const s: string[] = d.slots || []
      setSlots(s)
      if (s.length) {
        const first = berlinDayKey(s[0])
        setDayKey(first)
        const [y, m] = first.split('-').map(Number)
        setCursor({ y, m })
      }
    }).catch(() => alive && setConnected(false)).finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [person, type])

  const availableDays = useMemo(() => { const set = new Set<string>(); for (const s of slots) set.add(berlinDayKey(s)); return set }, [slots])
  const monthBounds = useMemo(() => {
    if (!slots.length) return null
    const keys = slots.map(berlinDayKey).sort()
    const f = keys[0].split('-').map(Number), l = keys[keys.length - 1].split('-').map(Number)
    return { min: { y: f[0], m: f[1] }, max: { y: l[0], m: l[1] } }
  }, [slots])
  const dayTimes = useMemo(() => dayKey ? slots.filter(s => berlinDayKey(s) === dayKey) : [], [slots, dayKey])

  function shiftMonth(dir: number) {
    if (!cursor) return
    let { y, m } = cursor; m += dir
    if (m < 1) { m = 12; y-- } else if (m > 12) { m = 1; y++ }
    setCursor({ y, m })
  }
  const canPrev = !!(cursor && monthBounds && (cursor.y > monthBounds.min.y || (cursor.y === monthBounds.min.y && cursor.m > monthBounds.min.m)))
  const canNext = !!(cursor && monthBounds && (cursor.y < monthBounds.max.y || (cursor.y === monthBounds.max.y && cursor.m < monthBounds.max.m)))

  async function submit() {
    if (!slot || !name.trim() || !/.+@.+\..+/.test(email)) { setErr('Bitte Name, gültige E-Mail und eine Uhrzeit angeben.'); return }
    setSubmitting(true); setErr(null)
    try {
      const res = await fetch('/api/schedule/book', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ person, type, slot, name: name.trim(), email: email.trim(), note }) })
      const d = await res.json()
      if (!res.ok) {
        if (d.error === 'slot_taken') { setErr('Diese Zeit ist gerade vergeben worden — bitte eine andere wählen.'); setSlot(null); setSlots(prev => prev.filter(s => s !== slot)) }
        else setErr('Buchung fehlgeschlagen. Bitte erneut versuchen.')
        return
      }
      setBooked({ start: d.start || slot, end: d.end || slot, joinUrl: d.joinUrl || null, title: d.title || `Termin mit ${personName}` })
    } catch { setErr('Verbindung fehlgeschlagen.') } finally { setSubmitting(false) }
  }

  // ---------- render states ----------
  if (loading) return <SkeletonCal />
  if (!connected) return <Info amber>Die Online-Buchung ist gerade nicht verbunden. Schreib uns kurz: <a href="mailto:team@eilersfriends.com" className="font-semibold underline">team@eilersfriends.com</a>.</Info>
  if (booked) return <Done booked={booked} email={email} personName={personName} durationMin={durationMin} />
  if (!slots.length) return <Info>Aktuell sind im Buchungsfenster keine freien Zeiten. Schreib uns: <a href="mailto:team@eilersfriends.com" className="font-semibold underline" style={{ color: ACCENT }}>team@eilersfriends.com</a>.</Info>

  const y = cursor!.y, m = cursor!.m
  const lead = firstWeekdayMon(y, m)
  const total = daysInMonth(y, m)
  const cells: (string | null)[] = []
  for (let i = 0; i < lead; i++) cells.push(null)
  for (let d = 1; d <= total; d++) cells.push(`${y}-${pad(m)}-${pad(d)}`)

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* Calendar */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-base font-bold" style={{ color: INK }}>{MONTHS[m - 1]} {y}</p>
          <div className="flex gap-1">
            <button aria-label="Vorheriger Monat" disabled={!canPrev} onClick={() => shiftMonth(-1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 disabled:opacity-30 hover:border-blue-300"><ChevronLeft size={16} /></button>
            <button aria-label="Nächster Monat" disabled={!canNext} onClick={() => shiftMonth(1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 disabled:opacity-30 hover:border-blue-300"><ChevronRight size={16} /></button>
          </div>
        </div>
        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          {WD.map(w => <div key={w}>{w}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((key, i) => {
            if (!key) return <div key={i} />
            const has = availableDays.has(key)
            const sel = key === dayKey
            const dnum = Number(key.split('-')[2])
            return (
              <button key={i} disabled={!has} onClick={() => { setDayKey(key); setSlot(null) }}
                className={'aspect-square rounded-lg text-sm font-semibold transition-colors ' +
                  (sel ? 'text-white' : has ? 'text-blue-700 hover:bg-blue-50' : 'text-gray-300')}
                style={sel ? { backgroundColor: ACCENT } : has ? { backgroundColor: '#EBF1FF' } : undefined}>
                {dnum}
              </button>
            )
          })}
        </div>
        <p className="mt-4 text-[11px] text-gray-400">Alle Zeiten in mitteleuropäischer Zeit · Berlin (MEZ/MESZ)</p>
      </div>

      {/* Right panel: times or form */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        {!slot ? (
          <>
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-gray-400">Uhrzeit wählen</p>
            <p className="mb-4 text-sm font-semibold capitalize" style={{ color: INK }}>{dayKey ? dayHuman(dayKey) : '—'}</p>
            <div className="grid max-h-[320px] grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4">
              {dayTimes.map(s => (
                <button key={s} onClick={() => setSlot(s)} className="rounded-lg border border-gray-200 px-2 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-blue-400 hover:bg-blue-50">{timeLabel(s)}</button>
              ))}
              {!dayTimes.length && <p className="col-span-full text-sm text-gray-400">Kein freier Slot an diesem Tag.</p>}
            </div>
          </>
        ) : (
          <>
            <button onClick={() => setSlot(null)} className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-gray-700"><ArrowLeft size={13} /> Andere Zeit</button>
            <div className="mb-4 rounded-xl px-3 py-2.5 text-sm font-semibold" style={{ backgroundColor: '#EBF1FF', color: '#1A4DB0' }}>
              <span className="capitalize">{dayHuman(berlinDayKey(slot))}</span> · {timeLabel(slot)} Uhr · {durationMin} Min mit {personName}
            </div>
            <div className="space-y-2">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="E-Mail" type="email" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
              <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Worum geht's? (optional)" rows={3} className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
            </div>
            {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
            <button onClick={submit} disabled={submitting} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white transition-opacity disabled:opacity-40" style={{ backgroundColor: ACCENT }}>
              {submitting && <Loader2 size={15} className="animate-spin" />}{submitting ? 'Buche…' : 'Termin verbindlich buchen'}
            </button>
            <p className="mt-2 text-center text-[11px] text-gray-400">Du erhältst eine Kalender-Einladung mit Microsoft-Teams-Link.</p>
          </>
        )}
        {err && !slot && <p className="mt-2 text-sm text-red-600">{err}</p>}
      </div>
    </div>
  )
}

function Info({ children, amber }: { children: ReactNode; amber?: boolean }) {
  return <div className={'rounded-2xl border p-6 text-sm ' + (amber ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-gray-200 bg-white text-gray-600')}>{children}</div>
}

function SkeletonCal() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="mb-4 h-5 w-32 animate-pulse rounded bg-gray-200" />
        <div className="grid grid-cols-7 gap-1">{Array.from({ length: 35 }).map((_, i) => <div key={i} className="aspect-square animate-pulse rounded-lg bg-gray-100" />)}</div>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="mb-4 h-4 w-40 animate-pulse rounded bg-gray-200" />
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{Array.from({ length: 12 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />)}</div>
      </div>
    </div>
  )
}

function icsDate(iso: string) { return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z') }

function Done({ booked, email, personName, durationMin }: { booked: Booked; email: string; personName: string; durationMin: number }) {
  const title = encodeURIComponent(booked.title)
  const details = encodeURIComponent(booked.joinUrl ? `Microsoft-Teams-Link: ${booked.joinUrl}` : 'Termin mit Eilers+Friends')
  const loc = encodeURIComponent(booked.joinUrl || 'Microsoft Teams')
  const g = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${icsDate(booked.start)}/${icsDate(booked.end)}&details=${details}&location=${loc}`
  const o = `https://outlook.office.com/calendar/0/deeplink/compose?subject=${title}&startdt=${encodeURIComponent(booked.start)}&enddt=${encodeURIComponent(booked.end)}&body=${details}&location=${loc}&path=/calendar/action/compose&rru=addevent`
  const ics = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(
    ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Eilers+Friends//Schedule//DE', 'BEGIN:VEVENT',
      `UID:${icsDate(booked.start)}-ef@eilersfriends.com`, `DTSTAMP:${icsDate(new Date().toISOString())}`,
      `DTSTART:${icsDate(booked.start)}`, `DTEND:${icsDate(booked.end)}`, `SUMMARY:${booked.title}`,
      booked.joinUrl ? `DESCRIPTION:Microsoft-Teams-Link: ${booked.joinUrl}` : 'DESCRIPTION:Termin mit Eilers+Friends',
      booked.joinUrl ? `LOCATION:${booked.joinUrl}` : 'LOCATION:Microsoft Teams', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n'))
  const when = new Intl.DateTimeFormat('de-DE', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(booked.start))
  return (
    <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
      <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-white"><Check size={22} /></span>
      <p className="text-xl font-bold text-green-900">Termin gebucht.</p>
      <p className="mt-1 text-sm capitalize text-green-800">{when} Uhr · {durationMin} Min mit {personName}</p>
      <p className="mt-1 text-sm text-green-800">Eine Bestätigung geht an {email}.</p>
      {booked.joinUrl && (
        <a href={booked.joinUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-full bg-green-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-green-800"><Video size={15} /> Teams-Meeting öffnen</a>
      )}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-800"><CalendarPlus size={13} /> Zum Kalender:</span>
        <a href={g} target="_blank" rel="noreferrer" className="rounded-full border border-green-300 bg-white px-3 py-1.5 text-xs font-semibold text-green-800 hover:bg-green-100">Google</a>
        <a href={o} target="_blank" rel="noreferrer" className="rounded-full border border-green-300 bg-white px-3 py-1.5 text-xs font-semibold text-green-800 hover:bg-green-100">Outlook</a>
        <a href={ics} download="termin-eilersfriends.ics" className="rounded-full border border-green-300 bg-white px-3 py-1.5 text-xs font-semibold text-green-800 hover:bg-green-100">Apple / .ics</a>
      </div>
    </div>
  )
}
