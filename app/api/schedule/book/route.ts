import { NextRequest, NextResponse } from 'next/server'
import { freeSlots, createBooking } from '@/lib/schedule/graph'
import { entityFor, membersFor } from '@/lib/schedule/config'
import { getEventType } from '@/lib/schedule/types-store'
import { createBooking as storeBooking, bookingCountsByDay, makeManageToken } from '@/lib/schedule/bookings-store'
import { removeSlotFromCache } from '@/lib/schedule/availability-cache'
import { logError } from '@/lib/errors/store'

export const runtime = 'nodejs'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.eilersfriends.com'
const TZ = 'Europe/Berlin'
function dayKeyOf(iso: string) {
  const p: Record<string, string> = {}
  for (const x of new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(iso))) p[x.type] = x.value
  return `${p.year}-${p.month}-${p.day}`
}
function esc(s: string) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string)) }

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as Record<string, unknown>))
  const person = String(body.person || ''); const type = String(body.type || '')
  const slot = String(body.slot || ''); const name = String(body.name || '').slice(0, 120)
  const email = String(body.email || '').slice(0, 160); const note = String(body.note || '').slice(0, 2000)
  const rawAnswers = (body.answers && typeof body.answers === 'object') ? body.answers as Record<string, string> : {}

  const ent = entityFor(person); const et = await getEventType(person, type)
  if (!ent || !et || et.visibility === 'offline' || membersFor(person).length === 0 || !slot || !name || !/.+@.+\..+/.test(email)) {
    return NextResponse.json({ error: 'bad_params' }, { status: 400 })
  }

  // Pflichtfragen prüfen + Antworten ordnen
  const answers: { question: string; answer: string }[] = []
  for (const q of et.questions) {
    const a = String(rawAnswers[q.id] ?? '').trim()
    if (q.required && !a) return NextResponse.json({ error: 'missing_answer', field: q.id }, { status: 400 })
    if (a) answers.push({ question: q.label, answer: a })
  }

  // Tageslimit
  if (et.maxPerDay != null) {
    const counts = await bookingCountsByDay(person, type)
    if ((counts[dayKeyOf(slot)] || 0) >= et.maxPerDay) return NextResponse.json({ error: 'day_full' }, { status: 409 })
  }

  // Slot noch frei?
  const blocked = new Set<string>()
  if (et.maxPerDay != null) { const counts = await bookingCountsByDay(person, type); for (const [d, n] of Object.entries(counts)) if (n >= et.maxPerDay) blocked.add(d) }
  const { slots, connected } = await freeSlots(person, { durationMin: et.durationMin, bufferBeforeMin: et.bufferBeforeMin, bufferAfterMin: et.bufferAfterMin, blockedDayKeys: blocked })
  if (!connected) return NextResponse.json({ error: 'not_connected' }, { status: 503 })
  if (!slots.includes(slot)) return NextResponse.json({ error: 'slot_taken' }, { status: 409 })

  const token = makeManageToken(person, type, slot)
  const manageUrl = `${SITE}/termin/${token}`
  const end = new Date(new Date(slot).getTime() + et.durationMin * 60000).toISOString()
  const title = `${et.name} · ${ent.name} × ${name}`

  const qaHtml = answers.length
    ? '<p><b>Angaben des Gastes:</b></p><ul>' + answers.map(a => `<li><b>${esc(a.question)}:</b> ${esc(a.answer)}</li>`).join('') + '</ul>'
    : ''
  const noteHtml = note ? `<p><b>Nachricht:</b><br>${esc(note).replace(/\n/g, '<br>')}</p>` : ''
  const infoHtml = et.infoText ? `<p>${esc(et.infoText).replace(/\n/g, '<br>')}</p>` : ''
  const bodyHtml = `<div style="font-family:Arial,sans-serif">
    <p><b>${esc(et.name)}</b> mit ${esc(ent.name)}</p>
    ${infoHtml}
    <p><b>Gast:</b> ${esc(name)} · ${esc(email)}</p>
    ${qaHtml}${noteHtml}
    <hr>
    <p>Der Gast kann den Termin selbst verwalten: <a href="${manageUrl}">Umbuchen oder absagen</a><br>${manageUrl}</p>
  </div>`

  const r = await createBooking(person, slot, et.durationMin, { subject: title, bodyHtml, attendeeName: name, attendeeEmail: email })
  if (!r.ok) {
    await logError({ level: 'error', source: 'server', status: 502, message: `Buchung fehlgeschlagen (${person}/${type}): ${r.error || 'failed'}`, url: '/api/schedule/book', context: { person, type, slot } })
    return NextResponse.json({ error: r.error || 'failed' }, { status: 502 })
  }

  await storeBooking({
    eventTypeId: et.id, ownerSlug: person, typeSlug: type, startUtc: slot, endUtc: end, dayKey: dayKeyOf(slot),
    customerName: name, customerEmail: email, answers, note, msEventId: r.eventId || null, joinUrl: r.joinUrl || null, manageToken: token,
  })
  await removeSlotFromCache(person, type, slot)

  return NextResponse.json({ ok: true, start: slot, end, joinUrl: r.joinUrl || null, title: `${et.name} mit ${ent.name}`, manageUrl })
}
