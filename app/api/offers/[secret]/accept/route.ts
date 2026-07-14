import { NextResponse } from 'next/server'
import { createHash, randomUUID } from 'crypto'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { getOfferBySalt, recordOfferEvent } from '@/lib/db/queries/offers'
import { getStripe } from '@/lib/stripe'
import { sendEmail } from '@/lib/email/resend'

export const runtime = 'nodejs'

interface PricingOption { type?: string; title?: string; description?: string; price?: number; monthlyDuration?: number; recommended?: boolean }
interface Program { title?: string; pricing?: PricingOption[] }

function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'unknown'
}
const domainOf = (email?: string | null) => (email && email.includes('@') ? email.split('@')[1].toLowerCase().trim() : '')
const eur = (n: number) => `€${Math.round(n).toLocaleString('de-DE')}`

export async function POST(req: Request, ctx: { params: Promise<{ secret: string }> }) {
  const { secret } = await ctx.params
  const offer = await getOfferBySalt(secret)
  if (!offer) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const form = await req.formData().catch(() => null)
  const signedByName = form?.get('signedByName')?.toString().trim() || offer.customer_name
  const signedByEmail = form?.get('signedByEmail')?.toString().trim() || offer.customer_email || null
  const selectedPricingOption = form?.get('selectedPricingOption')?.toString() || null
  const method = (form?.get('method')?.toString() === 'card') ? 'card' : 'invoice'
  const rhythm = (form?.get('rhythm')?.toString() === 'monthly') ? 'monthly' : 'upfront'
  const amount = Number(form?.get('amount')?.toString() || '0') || 0

  const baseUrl = new URL(req.url).origin
  const ip = clientIp(req)
  const ts = new Date().toISOString()
  const acceptHash = createHash('sha256').update(`${offer.id}|${signedByEmail ?? ''}|${ip}|${ts}`).digest('hex').slice(0, 32)
  const userAgent = req.headers.get('user-agent') || null

  const programs = (offer as unknown as { programs?: Program[] }).programs ?? []
  const opt = programs[0]?.pricing?.find((p) => p.type === (selectedPricingOption ?? offer.selected_pricing_option))
    ?? programs[0]?.pricing?.find((p) => p.recommended) ?? programs[0]?.pricing?.[0]

  // ── RECHNUNG: Domain-Check → Nachweis (pending) → DOI-Mail, noch nicht signiert ──
  if (method === 'invoice') {
    const custDomain = domainOf(offer.customer_email)
    if (custDomain && domainOf(signedByEmail) !== custDomain) {
      await recordOfferEvent(offer.id, 'accept_domain_rejected', signedByEmail, { expected: custDomain })
      return NextResponse.redirect(new URL(`/offer/${secret}?error=domain`, req.url), 303)
    }
    const doiToken = randomUUID()
    await db.execute(sql`
      INSERT INTO offer_acceptances (offer_id, name, email, method, rhythm, amount, ip, accept_hash, user_agent, status, doi_token)
      VALUES (${offer.id}, ${signedByName}, ${signedByEmail}, 'invoice', ${rhythm}, ${amount || null}, ${ip}, ${acceptHash}, ${userAgent}, 'pending', ${doiToken})
    `)
    await recordOfferEvent(offer.id, 'accept_pending', signedByEmail, { rhythm, amount, acceptHash })

    const confirmUrl = `${baseUrl}/api/offers/${secret}/confirm?token=${doiToken}`
    if (signedByEmail) {
      try {
        await sendEmail({
          to: signedByEmail,
          subject: `Bitte bestätigen: Annahme Angebot ${offer.offer_number}`,
          html: `
            <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#0D0D0B">
              <p>Hallo ${signedByName},</p>
              <p>bitte bestätige die verbindliche Annahme des Angebots <strong>${offer.offer_number}</strong> mit einem Klick:</p>
              <p style="margin:28px 0">
                <a href="${confirmUrl}" style="background:#0F1E3A;color:#fff;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:bold">Annahme bestätigen</a>
              </p>
              <p style="font-size:13px;color:#6B7280">
                Zahlweise: ${rhythm === 'monthly' ? 'monatlich' : 'Einmalzahlung'} · Gesamt ${eur(amount)} · per Rechnung.<br/>
                Nachweis: ${ts} · Referenz ${acceptHash}
              </p>
              <p style="font-size:12px;color:#9CA3AF">Falls du das nicht warst, ignoriere diese E-Mail einfach.</p>
            </div>`,
          text: `Bitte bestätige die Annahme des Angebots ${offer.offer_number}: ${confirmUrl}\nZahlweise: ${rhythm === 'monthly' ? 'monatlich' : 'Einmalzahlung'} · Gesamt ${eur(amount)} · per Rechnung.\nNachweis: ${ts} · Referenz ${acceptHash}`,
        })
      } catch (err) {
        await recordOfferEvent(offer.id, 'accept_mail_failed', signedByEmail, { error: err instanceof Error ? err.message : 'mail_error' })
      }
    }
    return NextResponse.redirect(new URL(`/offer/${secret}?pending=1`, req.url), 303)
  }

  // ── KREDITKARTE: sofort signieren + Stripe (Abo bei monatlich, Einmal bei Upfront) ──
  await db.execute(sql`
    INSERT INTO offer_acceptances (offer_id, name, email, method, rhythm, amount, ip, accept_hash, user_agent, status, confirmed_at, confirmed_ip)
    VALUES (${offer.id}, ${signedByName}, ${signedByEmail}, 'card', ${rhythm}, ${amount || null}, ${ip}, ${acceptHash}, ${userAgent}, 'confirmed', now(), ${ip})
  `)
  await db.execute(sql`
    UPDATE offers SET status='signed', signed_at=now(), signed_by_name=${signedByName}, signed_by_email=${signedByEmail},
      selected_pricing_option=COALESCE(${selectedPricingOption}, selected_pricing_option), updated_at=now()
    WHERE access_salt=${secret}
  `)
  await recordOfferEvent(offer.id, 'signed', signedByEmail, { method: 'card', rhythm, amount, acceptHash })

  const monthlyRate = opt?.price ?? 0
  const durationMonths = opt?.monthlyDuration && opt.monthlyDuration > 1 ? opt.monthlyDuration : 1
  try {
    const stripe = getStripe()
    const productName = `${programs[0]?.title ?? offer.title} · ${opt?.title ?? opt?.type ?? 'Option'}`
    const common = {
      success_url: `${baseUrl}/offer/${secret}?paid=1`,
      cancel_url: `${baseUrl}/offer/${secret}?cancelled=1`,
      customer_email: signedByEmail ?? undefined,
      client_reference_id: offer.id,
      metadata: { offerId: offer.id, offerNumber: offer.offer_number, rhythm, durationMonths: String(durationMonths), selectedPricingOption: opt?.type ?? '' },
    }
    let session
    if (rhythm === 'monthly' && monthlyRate > 0) {
      session = await stripe.checkout.sessions.create({
        ...common, mode: 'subscription',
        line_items: [{ quantity: 1, price_data: { currency: 'eur', unit_amount: Math.round(monthlyRate * 100), recurring: { interval: 'month' }, product_data: { name: productName } } }],
      })
    } else {
      const charge = amount > 0 ? amount : (opt?.price ?? 0)
      session = await stripe.checkout.sessions.create({
        ...common, mode: 'payment',
        line_items: [{ quantity: 1, price_data: { currency: 'eur', unit_amount: Math.round(charge * 100), product_data: { name: `${productName} (Einmalzahlung)` } } }],
      })
    }
    await db.execute(sql`UPDATE offers SET stripe_checkout_session_id=${session.id}, updated_at=now() WHERE id=${offer.id}`)
    await recordOfferEvent(offer.id, 'checkout_started', signedByEmail, { sessionId: session.id, mode: rhythm === 'monthly' ? 'subscription' : 'payment' })
    if (session.url) return NextResponse.redirect(session.url, 303)
  } catch (err) {
    await recordOfferEvent(offer.id, 'checkout_failed', signedByEmail, { error: err instanceof Error ? err.message : 'stripe_error' })
    return NextResponse.redirect(new URL(`/offer/${secret}?error=stripe`, req.url), 303)
  }
  return NextResponse.redirect(new URL(`/offer/${secret}?accepted=1`, req.url), 303)
}
