import { NextRequest, NextResponse } from 'next/server'
import { getBookingByToken, setBookingCancelled } from '@/lib/schedule/bookings-store'
import { cancelEvent } from '@/lib/schedule/graph'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { token } = await req.json().catch(() => ({} as { token?: string }))
  if (!token) return NextResponse.json({ error: 'bad_params' }, { status: 400 })
  const b = await getBookingByToken(String(token))
  if (!b) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (b.status === 'cancelled') return NextResponse.json({ ok: true })
  if (b.msEventId) { const r = await cancelEvent(b.ownerSlug, b.msEventId); if (!r.ok) return NextResponse.json({ error: 'cancel_failed' }, { status: 502 }) }
  await setBookingCancelled(b.id)
  return NextResponse.json({ ok: true })
}
