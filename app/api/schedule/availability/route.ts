import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { entityFor } from '@/lib/schedule/config'
import { getEventType } from '@/lib/schedule/types-store'
import { getCached, computeAndCache, computeInternal, CACHE_STALE_MS } from '@/lib/schedule/availability-cache'
import { auth } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const person = req.nextUrl.searchParams.get('person') || ''
  const type = req.nextUrl.searchParams.get('type') || ''
  const internal = req.nextUrl.searchParams.get('internal') === '1'
  const ent = entityFor(person)
  const et = await getEventType(person, type)
  if (!ent || !et) return NextResponse.json({ error: 'bad_params' }, { status: 400 })

  // Interner Team-Modus: nur Admin/Coach, KEIN Cache (live gegen den Kalender),
  // langer Horizont (35-180 Tage, Default 150), auch offline/interne Typen. ?internal=1&days=150
  if (internal) {
    const session = await auth().catch(() => null)
    const role = session?.user?.role
    if (role !== 'admin' && role !== 'coach') return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    const days = Math.min(180, Math.max(35, Number(req.nextUrl.searchParams.get('days') || 150)))
    const { slots, connected } = await computeInternal(person, type, et, days)
    return NextResponse.json({ connected, durationMin: et.durationMin, slots, internal: true, horizonDays: days })
  }

  // Oeffentliche Sicht: offline-Typen sind nicht buchbar
  if (et.visibility === 'offline') return NextResponse.json({ error: 'bad_params' }, { status: 400 })

  // Stale-while-revalidate: Cache sofort ausliefern; wenn veraltet, im Hintergrund neu rechnen
  // (Besucher wartet nie; Neuberechnung hoechstens 1x pro Typ pro Fenster, nur bei Zugriff).
  const cached = await getCached(person, type).catch(() => null)
  if (cached && cached.connected) {
    const stale = Date.now() - cached.refreshedAt >= CACHE_STALE_MS
    if (stale) after(async () => { await computeAndCache(person, type, et).catch(() => {}) })
    return NextResponse.json({ connected: true, durationMin: et.durationMin, slots: cached.slots, cached: true, stale })
  }
  // Kein Cache (kalt): einmal synchron rechnen
  const { slots, connected } = await computeAndCache(person, type, et)
  return NextResponse.json({ connected, durationMin: et.durationMin, slots })
}
