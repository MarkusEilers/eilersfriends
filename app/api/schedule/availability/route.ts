import { NextRequest, NextResponse } from 'next/server'
import { freeSlots } from '@/lib/schedule/graph'
import { typeBySlug, membersFor } from '@/lib/schedule/config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const person = req.nextUrl.searchParams.get('person') || ''
  const type = req.nextUrl.searchParams.get('type') || ''
  const t = typeBySlug(type)
  if (!t || membersFor(person).length === 0) return NextResponse.json({ error: 'bad_params' }, { status: 400 })
  const { slots, connected } = await freeSlots(person, t.durationMin)
  return NextResponse.json({ connected, durationMin: t.durationMin, slots })
}
