import { NextResponse } from 'next/server'
import { z } from 'zod'
import { parseTranscript } from '@/lib/call-check/transcript'
import { analyseTranscript, LIMITS } from '@/lib/call-check/analyze'
import {
  createCheck, finishCheck, getCheck, hashIp, newPublicId, recentCounts, spentToday,
} from '@/lib/call-check/store'
import { sendEmail } from '@/lib/email/resend'

export const runtime = 'nodejs'
export const maxDuration = 300

/**
 * The Gesprächs-Check: a transcript goes in, a result page comes out.
 *
 * Four brakes before any money is spent, because this is a free, public
 * endpoint and the last runaway cost us a full credit balance:
 * length limits, three checks per email and six per IP per day, and a daily
 * euro cap across everyone.
 */

const DAILY_EUR = Number(process.env.CALL_CHECK_DAILY_EUR ?? 15)
const PER_EMAIL = 3
const PER_IP = 6

const Body = z.object({
  email: z.string().email().max(200),
  firstName: z.string().max(80).optional().nullable(),
  transcript: z.string().min(1).max(250_000),
  seller: z.string().max(60).optional().nullable(),
  locale: z.enum(['de', 'en', 'es']).default('de'),
  consent: z.literal(true),
  newsletter: z.boolean().optional().default(false),
})

function err(code: string, status = 400, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, error: code, ...extra }, { status })
}

export async function POST(req: Request) {
  const parsedBody = Body.safeParse(await req.json().catch(() => ({})))
  if (!parsedBody.success) return err('invalid_input', 400, { issues: parsedBody.error.issues.map((i) => i.path.join('.')) })
  const b = parsedBody.data

  const transcript = parseTranscript(b.transcript)
  if (transcript.words < LIMITS.minWords) return err('too_short', 400, { min: LIMITS.minWords, words: transcript.words })
  if (transcript.words > LIMITS.maxWords) return err('too_long', 400, { max: LIMITS.maxWords, words: transcript.words })

  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || null
  const ipHash = hashIp(ip)
  const counts = await recentCounts(b.email, ipHash)
  if (counts.by_email >= PER_EMAIL || counts.by_ip >= PER_IP) return err('rate_limited', 429)
  if ((await spentToday()) >= DAILY_EUR) return err('daily_cap', 503)

  const publicId = newPublicId()
  await createCheck({
    publicId, email: b.email, firstName: b.firstName ?? null, locale: b.locale,
    seller: b.seller ?? null, newsletter: b.newsletter, words: transcript.words, ipHash,
  })

  // The list. Newsletter only with the separate, explicit opt-in — and then
  // through the normal double opt-in route, so there is one way onto the list.
  if (b.newsletter) {
    const origin = new URL(req.url).origin
    fetch(`${origin}/api/newsletter/subscribe`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: b.email, firstName: b.firstName ?? undefined,
        source: 'gespraechs-check', locale: b.locale, consentGiven: true,
      }),
    }).catch((e) => console.error('[call-check] newsletter signup failed:', e))
  }

  try {
    const out = await analyseTranscript({
      transcript: b.transcript, seller: b.seller ?? null, locale: b.locale, checkId: publicId,
    })
    await finishCheck(publicId, {
      status: 'done', metrics: out.metrics, result: out.result, model: out.model,
      tokensIn: out.tokensIn, tokensOut: out.tokensOut, costEur: out.costEur,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error(`[call-check] ${publicId} failed:`, message)
    await finishCheck(publicId, { status: 'error', error: message.slice(0, 2000) })
    return err('analysis_failed', 502, { id: publicId })
  }

  // The link by mail as well — the result should be findable next week.
  const base = new URL(req.url).origin
  const link = `${base}/${b.locale}/gespraechs-check/${publicId}`
  const subject = b.locale === 'en' ? 'Your call check' : b.locale === 'es' ? 'Tu análisis de conversación' : 'Dein Gesprächs-Check'
  const hello = b.firstName ? `${b.firstName}, ` : ''
  const line = b.locale === 'en'
    ? `${hello}here is your call check: ${link}`
    : b.locale === 'es'
      ? `${hello}aquí está tu análisis: ${link}`
      : `${hello}hier ist Dein Gesprächs-Check: ${link}`
  sendEmail({ to: b.email, subject, text: line, html: `<p>${line.replace(link, `<a href="${link}">${link}</a>`)}</p><p>Markus Eilers</p>` })
    .catch((e: unknown) => console.error('[call-check] mail failed:', e))

  return NextResponse.json({ ok: true, id: publicId, url: `/${b.locale}/gespraechs-check/${publicId}` })
}

/** Status for the result page while it waits. */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return err('missing_id')
  const c = await getCheck(id)
  if (!c) return err('not_found', 404)
  return NextResponse.json({ ok: true, status: c.status })
}
