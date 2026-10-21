import { NextResponse } from 'next/server'
import { z } from 'zod'
import { parseTranscript } from '@/lib/call-check/transcript'
import { analyseTranscript, LIMITS } from '@/lib/call-check/analyze'
import {
  createCheck, finishCheck, getCheck, hashIp, newPublicId, recentCounts, spentToday, quotaFor,
  isVerified, checksByEmail, verifyToken, CHECKS_BEFORE_DOI,
} from '@/lib/call-check/store'
import { workDomain } from '@/lib/util/email'
import { sendEmail } from '@/lib/email/resend'

export const runtime = 'nodejs'
export const maxDuration = 300

/**
 * The Gesprächs-Check: a transcript goes in, a result page comes out.
 *
 * Brakes before any money is spent, because this is a free, public endpoint
 * and the last runaway cost us a full credit balance: company addresses only,
 * length limits, a quota of 10 checks per company (more as paid packs),
 * per-day limits per email and IP, and a daily euro cap across everyone.
 */

const DAILY_EUR = Number(process.env.CALL_CHECK_DAILY_EUR ?? 15)
const PER_EMAIL = 10
const PER_IP = 15

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

  const domain = workDomain(b.email)
  if (!domain) return err('freemail', 400)

  const transcript = parseTranscript(b.transcript)
  if (transcript.words < LIMITS.minWords) return err('too_short', 400, { min: LIMITS.minWords, words: transcript.words })
  if (transcript.words > LIMITS.maxWords) return err('too_long', 400, { max: LIMITS.maxWords, words: transcript.words })

  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || null
  const ipHash = hashIp(ip)
  const counts = await recentCounts(b.email, ipHash)
  if (counts.by_email >= PER_EMAIL || counts.by_ip >= PER_IP) return err('rate_limited', 429)
  if ((await spentToday()) >= DAILY_EUR) return err('daily_cap', 503)
  // Double opt-in: without a confirmed address only the first CHECKS_BEFORE_DOI calls.
  const verified = await isVerified(b.email)
  if (!verified && (await checksByEmail(b.email)) >= CHECKS_BEFORE_DOI) {
    const sent = await sendVerifyMail(new URL(req.url).origin, b.email, b.firstName ?? null, b.locale)
    return err(sent ? 'doi_required' : 'doi_mail_failed', 403)
  }
  const quota = await quotaFor(domain)
  if (quota.remaining <= 0) return err('quota', 402, { used: quota.used, limit: quota.limit })

  const publicId = newPublicId()
  await createCheck({
    publicId, email: b.email, firstName: b.firstName ?? null, locale: b.locale,
    seller: b.seller ?? null, newsletter: b.newsletter, words: transcript.words, ipHash,
    domain, transcript: b.transcript,
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
  const confirm = verified ? null : confirmLine(base, b.email, b.locale)
  // Awaited: a serverless function is frozen after the response, a pending mail would never leave.
  await sendEmail({
    to: b.email, subject,
    text: confirm ? `${line}\n\n${confirm.text}` : line,
    html: `<p>${line.replace(link, `<a href="${link}">${link}</a>`)}</p>${confirm ? `<p>${confirm.html}</p>` : ''}<p>Markus Eilers</p>`,
  })
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

function confirmLine(origin: string, email: string, locale: string) {
  const url = `${origin}/api/call-check/verify?t=${encodeURIComponent(verifyToken(email, locale))}`
  const lead = locale === 'en'
    ? 'Please confirm your address to analyse up to 10 calls for your company:'
    : locale === 'es'
      ? 'Confirma tu dirección para analizar hasta 10 conversaciones para tu empresa:'
      : 'Bitte bestätige Deine Adresse, dann kannst Du bis zu 10 Gespräche für Euer Unternehmen auswerten:'
  return { text: `${lead} ${url}`, html: `${lead} <a href="${url}">${url}</a>` }
}

async function sendVerifyMail(origin: string, email: string, firstName: string | null, locale: string) {
  const c = confirmLine(origin, email, locale)
  const subject = locale === 'en' ? 'Confirm your address' : locale === 'es' ? 'Confirma tu dirección' : 'Bitte bestätige Deine Adresse'
  const hello = firstName ? `${firstName}, ` : ''
  try {
    await sendEmail({ to: email, subject, text: `${hello}${c.text}`, html: `<p>${hello}${c.html}</p><p>Markus Eilers</p>` })
    return true
  } catch (e) {
    console.error('[call-check] verify mail failed:', e)
    return false
  }
}
