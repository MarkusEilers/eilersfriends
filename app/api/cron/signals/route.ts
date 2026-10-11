import { NextRequest, NextResponse } from 'next/server'
import { buildSignalDrafts } from '@/lib/rollouts/signals'

// Täglich: Signal-Mails als Entwurf anlegen. Versendet wird nur nach Freigabe im Backend.
export async function GET(request: NextRequest) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const today = request.nextUrl.searchParams.get('today') ?? undefined
  return NextResponse.json(await buildSignalDrafts(today))
}
