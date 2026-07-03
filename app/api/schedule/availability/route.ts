import { NextRequest, NextResponse } from 'next/server'
import { entityFor } from '@/lib/schedule/config'
import { getEventType } from '@/lib/schedule/types-store'
import { getCached, computeAndCache, CACHE_STALE_MS } from '@/lib/schedule/availability-cache'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const person = req.nextUrl.searchParams.get('person') || ''
  const type = req.nextUrl.searchParams.get('type') || ''
  const ent = entityFor(person)
  const et = await getEventType(person, type)
  if (!ent || !et || et.visibility === 'offline') return NextResponse.json({ error: 'bad_params' }, { status: 400 })

  const cached = await getCached(person, type).catch(() => null)
  if (cached && cached.connected && Date.now() - cached.refreshedAt < CACHE_STALE_MS) {
    return NextResponse.json({ connected: true, durationMin: et.durationMin, slots: cached.slots, cached: true })
  }
  const { slots, connected } = await computeAndCache(person, type, et)
  return NextResponse.json({ connected, durationMin: et.durationMin, slots })
}
