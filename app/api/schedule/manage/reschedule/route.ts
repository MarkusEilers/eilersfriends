import { NextRequest, NextResponse } from 'next/server'
import { getBookingByToken, updateBookingTime, bookingCountsByDay } from '@/lib/schedule/bookings-store'
import { getEventType } from '@/lib/schedule/types-store'
import { freeSlots, updateEventTime } from '@/lib/schedule/graph'

export const runtime = 'nodejs'
const TZ = 'Europe/Berlin'
function dayKeyOf(iso: string) {
  const p: Record<string, string> = {}
  for (const x of new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(iso))) p[x.type] = x.value
  return `${p.year}-${p.month}-${p.day}`
}

export async function POST(req: NextRequest) {
  const { token, slot } = await req.json().catch(() => ({} as { token?: string; slot?: string }))
  if (!token || !slot) return NextResponse.json({ error: 'bad_params' }, { status: 400 })
  const b = await getBookingByToken(String(token))
  if (!b || b.status === 'cancelled') return NextResponse.json({ error: 'not_found' }, { status: 404 })
  const et = await getEventType(b.ownerSlug, b.typeSlug)
  if (!et) return NextResponse.json({ error: 'no_type' }, { status: 400 })

  const blocked = new Set<string>()
  if (et.maxPerDay != null) { const counts = await bookingCountsByDay(b.ownerSlug, b.typeSlug); for (const [d, n] of Object.entries(counts)) if (n >= et.maxPerDay && d !== b.dayKey) blocked.add(d) }
  const { slots, connected } = await freeSlots(b.ownerSlug, { durationMin: et.durationMin, bufferBeforeMin: et.bufferBeforeMin, bufferAfterMin: et.bufferAfterMin, blockedDayKeys: blocked })
  if (!connected) return NextResponse.json({ error: 'not_connected' }, { status: 503 })
  if (!slots.includes(String(slot))) return NextResponse.json({ error: 'slot_taken' }, { status: 409 })

  const end = new Date(new Date(String(slot)).getTime() + et.durationMin * 60000).toISOString()
  if (b.msEventId) { const r = await updateEventTime(b.ownerSlug, b.msEventId, String(slot), et.durationMin); if (!r.ok) return NextResponse.json({ error: 'update_failed' }, { status: 502 }) }
  await updateBookingTime(b.id, String(slot), end, dayKeyOf(String(slot)))
  return NextResponse.json({ ok: true, start: slot, end })
}
