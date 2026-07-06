import { randomBytes } from 'crypto'
import { entityFor } from '@/lib/schedule/config'
import { getEventType, listBookableTypes } from '@/lib/schedule/types-store'
import { getCached, computeAndCache, CACHE_STALE_MS, removeSlotFromCache } from '@/lib/schedule/availability-cache'
import { freeSlots, createBooking, statusNow } from '@/lib/schedule/graph'
import { createBooking as storeBooking, bookingCountsByDay } from '@/lib/schedule/bookings-store'
import { logActivity, getStatusOverrides } from '@/lib/voice/store'
import { DW_PERSONS } from '@/lib/voice/auth'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.eilersfriends.com'
const TZ = 'Europe/Berlin'
export function slotLabel(iso: string) { return new Intl.DateTimeFormat('de-DE', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(iso)) + ' Uhr' }
function dayKeyOf(iso: string) { const p: Record<string, string> = {}; for (const x of new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(iso))) p[x.type] = x.value; return `${p.year}-${p.month}-${p.day}` }

export async function runGetSlots(person: string, typeSlug?: string, limit = 6) {
  const ent = entityFor(person); if (!ent) return { error: 'bad_person' }
  const et = typeSlug ? await getEventType(person, typeSlug) : (await listBookableTypes(person))[0]
  if (!et) return { error: 'no_type' }
  let slots: string[] = []
  const cached = await getCached(person, et.slug).catch(() => null)
  if (cached && cached.connected && Date.now() - cached.refreshedAt < CACHE_STALE_MS) slots = cached.slots
  else { const r = await computeAndCache(person, et.slug, et); slots = r.connected ? r.slots : [] }
  return { person, type: et.slug, name: et.name, durationMin: et.durationMin, slots: slots.slice(0, limit).map(s => ({ id: s, label: slotLabel(s) })) }
}

export async function runBook(a: { person: string; typeSlug?: string; slotId: string; name: string; phone: string; email?: string; topic?: string }) {
  const ent = entityFor(a.person)
  const et = a.typeSlug ? await getEventType(a.person, a.typeSlug) : (await listBookableTypes(a.person))[0]
  if (!ent || !et || !a.slotId || !a.name || !a.phone) return { ok: false, error: 'bad_params' }
  const blocked = new Set<string>()
  if (et.maxPerDay != null) { const counts = await bookingCountsByDay(a.person, et.slug); for (const [d, n] of Object.entries(counts)) if (n >= et.maxPerDay) blocked.add(d) }
  const { slots, connected } = await freeSlots(a.person, { durationMin: et.durationMin, bufferBeforeMin: et.bufferBeforeMin, bufferAfterMin: et.bufferAfterMin, blockedDayKeys: blocked })
  if (!connected) return { ok: false, error: 'not_connected' }
  if (!slots.includes(a.slotId)) return { ok: false, error: 'slot_taken' }
  const token = randomBytes(18).toString('base64url')
  const manageUrl = `${SITE}/termin/${token}`
  const end = new Date(new Date(a.slotId).getTime() + et.durationMin * 60000).toISOString()
  const r = await createBooking(a.person, a.slotId, et.durationMin, { subject: `${et.name} · ${ent.name} × ${a.name} (Tel.)`, bodyHtml: `<p><b>${et.name}</b> · Telefonisch gebucht</p><p>Gast: ${a.name} · Tel.: ${a.phone}${a.email ? ' · ' + a.email : ''}</p>${a.topic ? '<p>Anliegen: ' + a.topic + '</p>' : ''}<p>Verwalten: <a href="${manageUrl}">${manageUrl}</a></p>`, attendeeName: a.name, attendeeEmail: a.email || '' })
  if (!r.ok) return { ok: false, error: r.error || 'failed' }
  await storeBooking({ eventTypeId: et.id, ownerSlug: a.person, typeSlug: et.slug, startUtc: a.slotId, endUtc: end, dayKey: dayKeyOf(a.slotId), customerName: a.name, customerEmail: a.email || '', answers: [], note: `Telefon: ${a.phone}${a.topic ? ' · ' + a.topic : ''}`, msEventId: r.eventId || null, joinUrl: r.joinUrl || null, manageToken: token })
  await removeSlotFromCache(a.person, et.slug, a.slotId)
  await logActivity({ type: 'booking', personSlug: a.person, name: a.name, phone: a.phone, email: a.email || null, topic: a.topic || null, summary: `Termin gebucht: ${et.name} am ${slotLabel(a.slotId)}` })
  return { ok: true, confirmation: `${et.name} mit ${ent.name} am ${slotLabel(a.slotId)} ist gebucht.`, manageUrl }
}

export async function runTeamStatus() {
  const overrides = await getStatusOverrides()
  const slugs = Object.values(DW_PERSONS)
  const entries = await Promise.all(slugs.map(async slug => {
    const ov = overrides[slug]
    if (ov) return [slug, { status: ov.status, source: 'manual' }] as const
    const st = await statusNow(slug).catch(() => 'offline' as const)
    return [slug, { status: st, source: 'calendar' }] as const
  }))
  return Object.fromEntries(entries)
}
