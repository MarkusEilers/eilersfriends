import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getStripe } from '@/lib/stripe'
import { addCredits, CREDIT_PACK } from '@/lib/call-check/store'
import { workDomain } from '@/lib/util/email'

export const runtime = 'nodejs'
export const maxDuration = 30

/**
 * Credit pack for the Gesprächs-Check: 10 more checks for the whole company.
 *
 * POST starts a Stripe Checkout; Stripe sends the buyer back to GET, which
 * confirms the payment and books the credits. The webhook books them as well —
 * whichever comes first, the second call is a no-op (unique session id).
 */

const Body = z.object({ email: z.string().email().max(200), locale: z.enum(['de', 'en', 'es']).default('de') })

const NAME: Record<string, string> = {
  de: 'Gesprächs-Check · 10 weitere Gespräche',
  en: 'Call Check · 10 more calls',
  es: 'Análisis de conversación · 10 conversaciones más',
}

export async function POST(req: Request) {
  const p = Body.safeParse(await req.json().catch(() => ({})))
  if (!p.success) return NextResponse.json({ ok: false, error: 'invalid_input' }, { status: 400 })
  const { email, locale } = p.data
  const domain = workDomain(email)
  if (!domain) return NextResponse.json({ ok: false, error: 'freemail' }, { status: 400 })

  const origin = new URL(req.url).origin
  try {
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'eur',
          unit_amount: CREDIT_PACK.eurNet * 100,
          tax_behavior: 'exclusive',
          product_data: { name: NAME[locale] ?? NAME.de },
        },
        quantity: 1,
      }],
      customer_email: email,
      automatic_tax: { enabled: true },
      tax_id_collection: { enabled: true },
      billing_address_collection: 'required',
      success_url: `${origin}/api/call-check/credits?session_id={CHECKOUT_SESSION_ID}&locale=${locale}`,
      cancel_url: `${origin}/${locale}/gespraechs-check`,
      metadata: { kind: 'call-check-credits', company_domain: domain, checks: String(CREDIT_PACK.checks), email },
    })
    return NextResponse.json({ ok: true, url: session.url })
  } catch (e) {
    console.error('[call-check credits] stripe failed:', e)
    return NextResponse.json({ ok: false, error: 'payment_unavailable' }, { status: 502 })
  }
}

/** Return from Stripe: confirm, book, send back to the check. */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const id = url.searchParams.get('session_id') ?? ''
  const locale = ['de', 'en', 'es'].includes(url.searchParams.get('locale') ?? '') ? url.searchParams.get('locale')! : 'de'
  const back = (q: string) => NextResponse.redirect(`${url.origin}/${locale}/gespraechs-check?${q}`)
  if (!id) return back('credits=missing')
  try {
    const s = await getStripe().checkout.sessions.retrieve(id)
    if (s.payment_status === 'paid' && s.metadata?.kind === 'call-check-credits' && s.metadata.company_domain) {
      await bookFromSession(s.id, s.metadata, s.customer_email ?? null, s.amount_total ?? null)
      return back('credits=added')
    }
    return back('credits=pending')
  } catch (e) {
    console.error('[call-check credits] confirm failed:', e)
    return back('credits=pending')
  }
}

async function bookFromSession(sessionId: string, meta: Record<string, string>, email: string | null, amountTotalCents: number | null) {
  await addCredits({
    domain: meta.company_domain,
    checks: Number(meta.checks) || CREDIT_PACK.checks,
    email: meta.email || email,
    sessionId,
    amountEur: amountTotalCents != null ? amountTotalCents / 100 : null,
  })
}
