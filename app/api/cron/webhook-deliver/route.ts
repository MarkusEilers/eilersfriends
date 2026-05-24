import { NextRequest, NextResponse } from 'next/server'
import { deliverPendingWebhooks } from '@/lib/events/deliver'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * GET /api/cron/webhook-deliver
 * Wird von Vercel-Cron alle Minute aufgerufen.
 * Auth via CRON_SECRET header (Vercel-Cron-Standard).
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  try {
    const result = await deliverPendingWebhooks({ maxBatch: 100 })
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : 'unknown' }, { status: 500 })
  }
}
