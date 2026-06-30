import { NextRequest, NextResponse } from 'next/server'
import { freeSlots, createBooking } from '@/lib/schedule/graph'
import { typeBySlug, membersFor } from '@/lib/schedule/config'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as Record<string, unknown>))
  const person = String(body.person || ''); const type = String(body.type || '')
  const slot = String(body.slot || ''); const name = String(body.name || '').slice(0, 120)
  const email = String(body.email || '').slice(0, 160); const note = String(body.note || '').slice(0, 2000)
  const t = typeBySlug(type)
  if (!t || membersFor(person).length === 0 || !slot || !name || !/.+@.+\..+/.test(email)) {
    return NextResponse.json({ error: 'bad_params' }, { status: 400 })
  }
  // Re-validate slot is still free
  const { slots, connected } = await freeSlots(person, t.durationMin)
  if (!connected) return NextResponse.json({ error: 'not_connected' }, { status: 503 })
  if (!slots.includes(slot)) return NextResponse.json({ error: 'slot_taken' }, { status: 409 })
  const r = await createBooking(person, slot, t.durationMin, name, email, note)
  if (!r.ok) return NextResponse.json({ error: r.error || 'failed' }, { status: 502 })
  return NextResponse.json({ ok: true })
}
