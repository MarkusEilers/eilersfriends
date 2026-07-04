import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/errors/store'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({} as Record<string, unknown>))
  await logError({
    level: typeof b.level === 'string' ? b.level : 'error',
    source: typeof b.source === 'string' ? b.source : 'client',
    message: String(b.message || 'Unknown client error'),
    stack: typeof b.stack === 'string' ? b.stack : undefined,
    url: typeof b.url === 'string' ? b.url : req.headers.get('referer') || undefined,
    status: typeof b.status === 'number' ? b.status : undefined,
    userAgent: req.headers.get('user-agent') || undefined,
    context: b.context,
  })
  return NextResponse.json({ ok: true })
}
