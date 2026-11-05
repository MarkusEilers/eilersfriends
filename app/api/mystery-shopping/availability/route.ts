import { NextResponse } from 'next/server'
import { getAvailability, nextQuarterLabel } from '@/lib/mystery-shopping/slots'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Öffentlich: wie viele Mystery-Shopping-Plätze sind in diesem Quartal noch frei? */
export async function GET() {
  const a = await getAvailability()
  return NextResponse.json(
    { quarter: a.quarter, capacity: a.capacity, taken: a.taken, free: a.free, soldOut: a.soldOut, nextOpens: nextQuarterLabel(a.quarter) },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
