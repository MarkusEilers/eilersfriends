import { NextRequest, NextResponse } from 'next/server'
import { voiceAuthorized } from '@/lib/voice/auth'
import { entityFor } from '@/lib/schedule/config'
import { getEventType, listBookableTypes } from '@/lib/schedule/types-store'
import { getCached, computeAndCache, CACHE_STALE_MS } from '@/lib/schedule/availability-cache'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const TZ = 'Europe/Berlin'
function label(iso: string) { return new Intl.DateTimeFormat('de-DE', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(iso)) + ' Uhr' }

export async function GET(req: NextRequest) {
  if (!voiceAuthorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const person = req.nextUrl.searchParams.get('person') || 'markus'
  const typeSlug = req.nextUrl.searchParams.get('type') || ''
  const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') || 20), 60)
  const ent = entityFor(person)
  if (!ent) return NextResponse.json({ error: 'bad_person' }, { status: 400 })
  const et = typeSlug ? await getEventType(person, typeSlug) : (await listBookableTypes(person))[0]
  if (!et) return NextResponse.json({ error: 'no_type' }, { status: 400 })

  let slots: string[] = []
  const cached = await getCached(person, et.slug).catch(() => null)
  if (cached && cached.connected && Date.now() - cached.refreshedAt < CACHE_STALE_MS) slots = cached.slots
  else { const r = await computeAndCache(person, et.slug, et); slots = r.connected ? r.slots : [] }

  return NextResponse.json({
    person, type: et.slug, name: et.name, durationMin: et.durationMin,
    slots: slots.slice(0, limit).map(s => ({ id: s, start: s, label: label(s) })),
  })
}
