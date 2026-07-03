import { NextRequest, NextResponse } from 'next/server'
import { freeSlots } from '@/lib/schedule/graph'
import { entityFor } from '@/lib/schedule/config'
import { getEventType } from '@/lib/schedule/types-store'
import { bookingCountsByDay } from '@/lib/schedule/bookings-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const person = req.nextUrl.searchParams.get('person') || ''
  const type = req.nextUrl.searchParams.get('type') || ''
  const ent = entityFor(person)
  const et = await getEventType(person, type)
  if (!ent || !et || et.visibility === 'offline') return NextResponse.json({ error: 'bad_params' }, { status: 400 })

  const blocked = new Set<string>()
  if (et.maxPerDay != null) {
    const counts = await bookingCountsByDay(person, type)
    for (const [d, n] of Object.entries(counts)) if (n >= et.maxPerDay) blocked.add(d)
  }
  const { slots, connected } = await freeSlots(person, {
    durationMin: et.durationMin, bufferBeforeMin: et.bufferBeforeMin, bufferAfterMin: et.bufferAfterMin, blockedDayKeys: blocked,
  })
  return NextResponse.json({ connected, durationMin: et.durationMin, slots })
}
