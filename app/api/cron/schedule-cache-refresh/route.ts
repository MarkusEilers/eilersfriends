import { NextRequest, NextResponse } from 'next/server'
import { refreshAllCaches } from '@/lib/schedule/availability-cache'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const r = await refreshAllCaches()
  return NextResponse.json({ ok: true, ...r })
}
