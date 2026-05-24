import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { pageViews } from '@/lib/db/schema'
import { ensureAnalyticsTables } from '@/lib/db/self-heal'
import { createHash } from 'crypto'

const schema = z.object({
  path: z.string().min(1).max(500),
  locale: z.string().max(8).optional().default('de'),
  referrer: z.string().max(2000).optional(),
  uaClass: z.enum(['desktop', 'mobile', 'tablet', 'bot']).optional(),
  utmSource: z.string().max(120).optional(),
  utmMedium: z.string().max(120).optional(),
  utmCampaign: z.string().max(120).optional(),
})

function parseReferrerHost(ref?: string): string | null {
  if (!ref) return null
  try {
    return new URL(ref).host
  } catch {
    return null
  }
}

/**
 * Anonymizes the visitor: SHA-256 over (IP + UA + day-of-year + secret).
 * Resets every day so we can do "unique visitors today" without storing IPs.
 */
function sessionHash(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for') ?? ''
  const ip = fwd.split(',')[0]?.trim() ?? 'unknown'
  const ua = request.headers.get('user-agent') ?? 'unknown'
  const day = new Date().toISOString().slice(0, 10)
  const secret = process.env.ANALYTICS_SALT ?? 'eilers-friends-default-salt'
  return createHash('sha256').update(`${ip}|${ua}|${day}|${secret}`).digest('hex').slice(0, 32)
}

export async function POST(request: Request) {
  try {
    // Hard gate: only track when explicit analyse-consent was given.
    // The browser sends X-EF-Consent based on the cookie banner state.
    const consent = request.headers.get('x-ef-consent')
    if (consent !== 'accepted') {
      return NextResponse.json({ ok: true, recorded: false, reason: 'no-consent' })
    }

    const body = await request.json().catch(() => ({}))
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'invalid payload' }, { status: 400 })
    }

    await ensureAnalyticsTables()

    const country = request.headers.get('x-vercel-ip-country') ?? null
    const data = parsed.data

    await db.insert(pageViews).values({
      path: data.path,
      locale: data.locale,
      sessionHash: sessionHash(request),
      referrerHost: parseReferrerHost(data.referrer),
      uaClass: data.uaClass ?? null,
      country,
      utmSource: data.utmSource ?? null,
      utmMedium: data.utmMedium ?? null,
      utmCampaign: data.utmCampaign ?? null,
    })

    return NextResponse.json({ ok: true, recorded: true })
  } catch (err) {
    console.error('[/api/track] error:', err)
    // Never block the user — tracking is best-effort.
    return NextResponse.json({ ok: true, recorded: false }, { status: 200 })
  }
}
