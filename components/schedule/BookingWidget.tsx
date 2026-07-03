'use client'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Loader2, Check, ChevronLeft, ChevronRight, Video, CalendarPlus, ArrowLeft, Globe } from 'lucide-react'
import type { Question } from '@/lib/schedule/types-store'
import { TZ_CITIES, tzOffsetLabel, cityFromTz, detectTz } from '@/lib/schedule/timezones'

const ACCENT = '#1A5FD4'
const INK = '#0D0D0B'

type Host = { name: string; role: string; avatarUrl: string; intro: string }
type Booked = { start: string; end: string; joinUrl: string | null; title: string; manageUrl?: string | null }

function pad(n: number) { return String(n).padStart(2, '0') }
function tzDayKey(iso: string, tz: string) {
  const p: Record<string, string> = {}
  for (const x of new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(iso))) p[x.type] = x.value
  return `${p.year}-${p.month}-${p.day}`
}
function timeLabel(iso: string, tz: string, locale: string) { return new Intl.DateTimeFormat(locale, { timeZone: tz, hour: '2-digit', minute: '2-digit' }).format(new Date(iso)) }
function dayHuman(key: string, locale: string) {
  const [y, m, d] = key.split('-').map(Number)
  return new Intl.DateTimeFormat(locale, { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(Date.UTC(y, m - 1, d, 12)))
}
function monthTitle(y: number, m: number, locale: string) { return new Intl.DateTimeFormat(locale, { timeZone: 'UTC', month: 'long', year: 'numeric' }).format(new Date(Date.UTC(y, m - 1, 1, 12))) }
function weekdayHeaders(locale: string) { return Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(locale, { timeZone: 'UTC', weekday: 'short' }).format(new Date(Date.UTC(2024, 0, 1 + i, 12)))) }
function fullWhen(iso: string, tz: string, locale: string) { return new Intl.DateTimeFormat(locale, { timeZone: tz, weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(iso)) }
function firstWeekdayMon(y: number, m: number) { return (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7 }
function daysInMonth(y: number, m: number) { return new Date(Date.UTC(y, m, 0)).getUTCDate() }
function initials(name: string) { return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() }

export function BookingWidget({ person, type, personName, durationMin, infoText, questions, hosts }: {
  person: string; type: string; personName: string; durationMin: number
  infoText?: string; questions?: Question[]; hosts?: Host[]
}) {
  const t = useTranslations('schedule')
  const locale = useLocale()
  const qs = questions ?? []
  const [tz, setTz] = useState('Europe/Berlin')
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(true)
  const [slots, setSlots] = useState<string[]>([])
  const [dayKey, setDayKey] = useState<string | null>(null)
  const [slot, setSlot] = useState<string | null>(null)
  const [cursor, setCursor] = useState<{ y: number; m: number } | null>(null)
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [note, setNote] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false); const [booked, setBooked] = useState<Booked | null>(null); const [err, setErr] = useState<string | null>(null)

  useEffect(() => { setTz(detectTz()) }, [])
  useEffect(() => {
    let alive = true
    fetch(`/api/schedule/availability?person=${person}&type=${type}`).then(r => r.json()).then(d => {
      if (!alive) return
      setConnected(d.connected !== false); setSlots(d.slots || [])
    }).catch(() => alive && setConnected(false)).finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [person, type])
  // Tag/Monat neu bestimmen, wenn Slots geladen sind oder die Zeitzone wechselt
  useEffect(() => {
    if (!slots.length) return
    const first = tzDayKey(slots[0], tz)
    setDayKey(first); const [y, m] = first.split('-').map(Number); setCursor({ y, m }); setSlot(null)
  }, [slots, tz])

  const wd = useMemo(() => weekdayHeaders(locale), [locale])
  const availableDays = useMemo(() => { const s = new Set<string>(); for (const x of slots) s.add(tzDayKey(x, tz)); return s }, [slots, tz])
  const monthBounds = useMemo(() => {
    if (!slots.length) return null
    const keys = slots.map(x => tzDayKey(x, tz)).sort()
    const f = keys[0].split('-').map(Number), l = keys[keys.length - 1].split('-').map(Number)
    return { min: { y: f[0], m: f[1] }, max: { y: l[0], m: l[1] } }
  }, [slots, tz])
  const dayTimes = useMemo(() => dayKey ? slots.filter(x => tzDayKey(x, tz) === dayKey) : [], [slots, dayKey, tz])

  function shiftMonth(dir: number) { if (!cursor) return; let { y, m } = cursor; m += dir; if (m < 1) { m = 12; y-- } else if (m > 12) { m = 1; y++ }; setCursor({ y, m }) }
  const canPrev = !!(cursor && monthBounds && (cursor.y > monthBounds.min.y || (cursor.y === monthBounds.min.y && cursor.m > monthBounds.min.m)))
  const canNext = !!(cursor && monthBounds && (cursor.y < monthBounds.max.y || (cursor.y === monthBounds.max.y && cursor.m < monthBounds.max.m)))
  const clock = t('clock')

  async function submit() {
    if (!slot || !name.trim() || !/.+@.+\..+/.test(email)) { setErr(t('errFields')); return }
    for (const q of qs) if (q.required && !(answers[q.id] || '').trim()) { setErr(t('errRequired', { label: q.label })); return }
    setSubmitting(true); setErr(null)
    try {
      const res = await fetch('/api/schedule/book', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ person, type, slot, name: name.trim(), email: email.trim(), note, answers }) })
      const d = await res.json()
      if (!res.ok) {
        if (d.error === 'slot_taken' || d.error === 'day_full') { setErr(t('errTaken')); setSlot(null); setSlots(prev => prev.filter(s => s !== slot)) }
        else if (d.error === 'missing_answer') setErr(t('errRequiredFields'))
        else setErr(t('errBookFailed'))
        return
      }
      setBooked({ start: d.start || slot, end: d.end || slot, joinUrl: d.joinUrl || null, title: d.title || personName, manageUrl: d.manageUrl || null })
    } catch { setErr(t('errConnection')) } finally { setSubmitting(false) }
  }

  if (loading) return <SkeletonCal />
  if (!connected) return <Info amber>{t('notConnected')} <a href="mailto:team@eilersfriends.com" className="font-semibold underline">team@eilersfriends.com</a>.</Info>
  if (booked) return <Done booked={booked} email={email} personName={personName} durationMin={durationMin} tz={tz} />

  const intro = (hosts && hosts.length) || infoText ? (
    <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      {hosts && hosts.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {hosts.map(h => (
            <div key={h.name} className="flex items-start gap-3">
              {h.avatarUrl
                ? <img src={h.avatarUrl} alt={h.name} className="h-11 w-11 rounded-full object-cover" />
                : <span className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: ACCENT }}>{initials(h.name)}</span>}
              <div>
                <p className="text-sm font-bold" style={{ color: INK }}>{h.name}</p>
                {h.role && <p className="text-xs text-gray-500">{h.role}</p>}
                {h.intro && <p className="mt-1 max-w-md text-xs leading-relaxed text-gray-600">{h.intro}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
      {infoText && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-700">{infoText}</p>}
    </div>
  ) : null

  const tzOptions = TZ_CITIES.some(c => c.tz === tz) ? TZ_CITIES : [{ label: cityFromTz(tz), tz }, ...TZ_CITIES]
  const tzBar = (
    <div className="mb-3 flex items-center justify-end gap-2 text-xs text-gray-500">
      <Globe size={13} className="text-gray-400" />
      <span>{t('timezoneLabel')}:</span>
      <select value={tz} onChange={e => setTz(e.target.value)} aria-label={t('timezone')} className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-700 outline-none focus:border-blue-400">
        {tzOptions.map(o => <option key={o.tz} value={o.tz}>{o.label} · {tzOffsetLabel(o.tz)}</option>)}
      </select>
    </div>
  )

  if (!slots.length) return <>{intro}<Info>{t('noTimes')} <a href="mailto:team@eilersfriends.com" className="font-semibold underline" style={{ color: ACCENT }}>team@eilersfriends.com</a>.</Info></>

  const y = cursor!.y, m = cursor!.m
  const lead = firstWeekdayMon(y, m), total = daysInMonth(y, m)
  const cells: (string | null)[] = []
  for (let i = 0; i < lead; i++) cells.push(null)
  for (let d = 1; d <= total; d++) cells.push(`${y}-${pad(m)}-${pad(d)}`)

  return (
    <>
      {intro}
      {tzBar}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-base font-bold capitalize" style={{ color: INK }}>{monthTitle(y, m, locale)}</p>
            <div className="flex gap-1">
              <button aria-label="‹" disabled={!canPrev} onClick={() => shiftMonth(-1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 disabled:opacity-30 hover:border-blue-300"><ChevronLeft size={16} /></button>
              <button aria-label="›" disabled={!canNext} onClick={() => shiftMonth(1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 disabled:opacity-30 hover:border-blue-300"><ChevronRight size={16} /></button>
            </div>
          </div>
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-400">{wd.map((w, i) => <div key={i}>{w}</div>)}</div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((key, i) => {
              if (!key) return <div key={i} />
              const has = availableDays.has(key), sel = key === dayKey, dnum = Number(key.split('-')[2])
              return (
                <button key={i} disabled={!has} onClick={() => { setDayKey(key); setSlot(null) }}
                  className={'aspect-square rounded-lg text-sm font-semibold transition-colors ' + (sel ? 'text-white' : has ? 'text-blue-700 hover:bg-blue-50' : 'text-gray-300')}
                  style={sel ? { backgroundColor: ACCENT } : has ? { backgroundColor: '#EBF1FF' } : undefined}>{dnum}</button>
              )
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          {!slot ? (
            <>
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-gray-400">{t('pickTime')}</p>
              <p className="mb-4 text-sm font-semibold capitalize" style={{ color: INK }}>{dayKey ? dayHuman(dayKey, locale) : '—'}</p>
              <div className="grid max-h-[320px] grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4">
                {dayTimes.map(s => <button key={s} onClick={() => setSlot(s)} className="rounded-lg border border-gray-200 px-2 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-blue-400 hover:bg-blue-50">{timeLabel(s, tz, locale)}</button>)}
                {!dayTimes.length && <p className="col-span-full text-sm text-gray-400">{t('noSlotThatDay')}</p>}
              </div>
            </>
          ) : (
            <>
              <button onClick={() => setSlot(null)} className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-gray-700"><ArrowLeft size={13} /> {t('otherTime')}</button>
              <div className="mb-4 rounded-xl px-3 py-2.5 text-sm font-semibold" style={{ backgroundColor: '#EBF1FF', color: '#1A4DB0' }}>
                <span className="capitalize">{dayHuman(tzDayKey(slot, tz), locale)}</span> · {timeLabel(slot, tz, locale)}{clock ? ` ${clock}` : ''} · {durationMin} {t('min')} {t('with')} {personName}
              </div>
              <div className="space-y-2">
                <input value={name} onChange={e => setName(e.target.value)} placeholder={t('name')} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder={t('email')} type="email" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
                {qs.map(q => (
                  <div key={q.id}>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">{q.label}{q.required && <span className="text-red-500"> *</span>}</label>
                    {q.type === 'textarea' ? (
                      <textarea value={answers[q.id] || ''} onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))} rows={2} className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
                    ) : q.type === 'select' ? (
                      <select value={answers[q.id] || ''} onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400">
                        <option value="">…</option>
                        {(q.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input value={answers[q.id] || ''} onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
                    )}
                  </div>
                ))}
                <textarea value={note} onChange={e => setNote(e.target.value)} placeholder={t('messageOptional')} rows={2} className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
              </div>
              {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
              <button onClick={submit} disabled={submitting} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white transition-opacity disabled:opacity-40" style={{ backgroundColor: ACCENT }}>
                {submitting && <Loader2 size={15} className="animate-spin" />}{submitting ? t('booking') : t('book')}
              </button>
              <p className="mt-2 text-center text-[11px] text-gray-400">{t('invitationNote')}</p>
            </>
          )}
          {err && !slot && <p className="mt-2 text-sm text-red-600">{err}</p>}
        </div>
      </div>
    </>
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
function Done({ booked, email, personName, durationMin, tz }: { booked: Booked; email: string; personName: string; durationMin: number; tz: string }) {
  const t = useTranslations('schedule'); const locale = useLocale()
  const title = encodeURIComponent(booked.title)
  const details = encodeURIComponent(booked.joinUrl ? `Microsoft Teams: ${booked.joinUrl}` : 'Eilers+Friends')
  const loc = encodeURIComponent(booked.joinUrl || 'Microsoft Teams')
  const g = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${icsDate(booked.start)}/${icsDate(booked.end)}&details=${details}&location=${loc}`
  const o = `https://outlook.office.com/calendar/0/deeplink/compose?subject=${title}&startdt=${encodeURIComponent(booked.start)}&enddt=${encodeURIComponent(booked.end)}&body=${details}&location=${loc}&path=/calendar/action/compose&rru=addevent`
  const ics = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(
    ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Eilers+Friends//Schedule//EN', 'BEGIN:VEVENT',
      `UID:${icsDate(booked.start)}-ef@eilersfriends.com`, `DTSTAMP:${icsDate(new Date().toISOString())}`,
      `DTSTART:${icsDate(booked.start)}`, `DTEND:${icsDate(booked.end)}`, `SUMMARY:${booked.title}`,
      booked.joinUrl ? `DESCRIPTION:Microsoft Teams: ${booked.joinUrl}` : 'DESCRIPTION:Eilers+Friends',
      booked.joinUrl ? `LOCATION:${booked.joinUrl}` : 'LOCATION:Microsoft Teams', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n'))
  const clock = t('clock')
  return (
    <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
      <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-white"><Check size={22} /></span>
      <p className="text-xl font-bold text-green-900">{t('booked')}</p>
      <p className="mt-1 text-sm capitalize text-green-800">{fullWhen(booked.start, tz, locale)}{clock ? ` ${clock}` : ''} · {durationMin} {t('min')} {t('with')} {personName}</p>
      <p className="mt-1 text-sm text-green-800">{t('confirmationTo', { email })}</p>
      {booked.joinUrl && <a href={booked.joinUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-full bg-green-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-green-800"><Video size={15} /> {t('openTeams')}</a>}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-800"><CalendarPlus size={13} /> {t('addToCalendar')}</span>
        <a href={g} target="_blank" rel="noreferrer" className="rounded-full border border-green-300 bg-white px-3 py-1.5 text-xs font-semibold text-green-800 hover:bg-green-100">Google</a>
        <a href={o} target="_blank" rel="noreferrer" className="rounded-full border border-green-300 bg-white px-3 py-1.5 text-xs font-semibold text-green-800 hover:bg-green-100">Outlook</a>
        <a href={ics} download="termin-eilersfriends.ics" className="rounded-full border border-green-300 bg-white px-3 py-1.5 text-xs font-semibold text-green-800 hover:bg-green-100">Apple / .ics</a>
      </div>
      {booked.manageUrl && <p className="mt-4 text-xs text-green-800">{t('manageLine')} <a href={booked.manageUrl} className="font-semibold underline">{booked.manageUrl}</a></p>}
    </div>
  )
}
