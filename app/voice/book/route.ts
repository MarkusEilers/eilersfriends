import { NextRequest, NextResponse } from 'next/server'
import { voiceAuthorized } from '@/lib/voice/auth'
import { freeSlots, createBooking } from '@/lib/schedule/graph'
import { entityFor } from '@/lib/schedule/config'
import { getEventType, listBookableTypes } from '@/lib/schedule/types-store'
import { createBooking as storeBooking, bookingCountsByDay, makeManageToken } from '@/lib/schedule/bookings-store'
import { removeSlotFromCache } from '@/lib/schedule/availability-cache'
import { logActivity } from '@/lib/voice/store'

export const runtime = 'nodejs'
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.eilersfriends.com'
const TZ = 'Europe/Berlin'
function label(iso: string) { return new Intl.DateTimeFormat('de-DE', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(iso)) + ' Uhr' }
function dayKeyOf(iso: string) { const p: Record<string, string> = {}; for (const x of new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(iso))) p[x.type] = x.value; return `${p.year}-${p.month}-${p.day}` }
function esc(s: string) { return String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string)) }

export async function POST(req: NextRequest) {
  if (!voiceAuthorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const b = await req.json().catch(() => ({} as Record<string, unknown>))
  const person = String(b.person || 'markus')
  const slot = String(b.slot_id || b.slot || '')
  const name = String(b.name || '').slice(0, 120)
  const phone = String(b.phone || '').slice(0, 40)
  const email = String(b.email || '').slice(0, 160)
  const topic = String(b.topic || '').slice(0, 500)
  const ent = entityFor(person)
  const et = b.type ? await getEventType(person, String(b.type)) : (await listBookableTypes(person))[0]
  if (!ent || !et || !slot || !name || !phone) return NextResponse.json({ error: 'bad_params' }, { status: 400 })

  // Slot noch frei? (inkl. Tageslimit)
  const blocked = new Set<string>()
  if (et.maxPerDay != null) { const counts = await bookingCountsByDay(person, et.slug); for (const [d, n] of Object.entries(counts)) if (n >= et.maxPerDay) blocked.add(d) }
  const { slots, connected } = await freeSlots(person, { durationMin: et.durationMin, bufferBeforeMin: et.bufferBeforeMin, bufferAfterMin: et.bufferAfterMin, blockedDayKeys: blocked })
  if (!connected) return NextResponse.json({ error: 'not_connected' }, { status: 503 })
  if (!slots.includes(slot)) return NextResponse.json({ error: 'slot_taken' }, { status: 409 })

  const token = makeManageToken(person, et.slug, slot)
  const manageUrl = `${SITE}/termin/${token}`
  const end = new Date(new Date(slot).getTime() + et.durationMin * 60000).toISOString()
  const bodyHtml = `<div style="font-family:Arial,sans-serif"><p><b>${esc(et.name)}</b> mit ${esc(ent.name)} · <b>Telefonisch gebucht</b></p>
    <p><b>Gast:</b> ${esc(name)} · Tel.: ${esc(phone)}${email ? ' · ' + esc(email) : ''}</p>
    ${topic ? `<p><b>Anliegen:</b> ${esc(topic)}</p>` : ''}
    <hr><p>Verwalten: <a href="${manageUrl}">${manageUrl}</a></p></div>`

  const r = await createBooking(person, slot, et.durationMin, { subject: `${et.name} · ${ent.name} × ${name} (Tel.)`, bodyHtml, attendeeName: name, attendeeEmail: email })
  if (!r.ok) return NextResponse.json({ error: r.error || 'failed' }, { status: 502 })

  await storeBooking({ eventTypeId: et.id, ownerSlug: person, typeSlug: et.slug, startUtc: slot, endUtc: end, dayKey: dayKeyOf(slot), customerName: name, customerEmail: email, answers: [], note: `Telefon: ${phone}${topic ? ' · ' + topic : ''}`, msEventId: r.eventId || null, joinUrl: r.joinUrl || null, manageToken: token })
  await removeSlotFromCache(person, et.slug, slot)
  await logActivity({ type: 'booking', personSlug: person, name, phone, email: email || null, topic: topic || null, summary: `Termin gebucht: ${et.name} am ${label(slot)}` })

  return NextResponse.json({ ok: true, confirmation: `${et.name} mit ${ent.name} am ${label(slot)} ist gebucht.`, start: slot, manageUrl })
}
