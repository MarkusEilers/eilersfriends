import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { getOfferBySalt, recordOfferEvent } from '@/lib/db/queries/offers'
import { getStripe } from '@/lib/stripe'

export const runtime = 'nodejs'

interface PricingOption { type?: string; title?: string; description?: string; price?: number; monthlyDuration?: number; recommended?: boolean }
interface Program { title?: string; pricing?: PricingOption[] }

function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'unknown'
}
const domainOf = (email?: string | null) => (email && email.includes('@') ? email.split('@')[1].toLowerCase().trim() : '')

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

  // Invoice: E-Mail muss zur Kunden-Domain passen (Domain-Limit).
  const custDomain = domainOf(offer.customer_email)
  if (method === 'invoice' && custDomain && domainOf(signedByEmail) !== custDomain) {
    await recordOfferEvent(offer.id, 'accept_domain_rejected', signedByEmail, { expected: custDomain })
    return NextResponse.redirect(new URL(`/offer/${secret}?error=domain`, req.url), 303)
  }

  const ip = clientIp(req)
  const ts = new Date().toISOString()
  const acceptHash = createHash('sha256').update(`${offer.id}|${signedByEmail ?? ''}|${ip}|${ts}`).digest('hex').slice(0, 32)
  const userAgent = req.headers.get('user-agent') || null

  // Annahme-Nachweis speichern (v.a. für Rechnung)
  await db.execute(sql`
    INSERT INTO offer_acceptances (offer_id, name, email, method, rhythm, amount, ip, accept_hash, user_agent)
    VALUES (${offer.id}, ${signedByName}, ${signedByEmail}, ${method}, ${rhythm}, ${amount || null}, ${ip}, ${acceptHash}, ${userAgent})
  `)

  // Angebot als angenommen markieren
  await db.execute(sql`
    UPDATE offers
    SET status = 'signed', signed_at = now(), signed_by_name = ${signedByName}, signed_by_email = ${signedByEmail},
        selected_pricing_option = COALESCE(${selectedPricingOption}, selected_pricing_option), updated_at = now()
    WHERE access_salt = ${secret}
  `)
  await recordOfferEvent(offer.id, 'signed', signedByEmail, { selectedPricingOption, method, rhythm, amount, acceptHash })

  // Kreditkarte → direkt zu Stripe
  if (method === 'card') {
    const programs = (offer as unknown as { programs?: Program[] }).programs ?? []
    const opt = programs[0]?.pricing?.find((p) => p.type === (selectedPricingOption ?? offer.selected_pricing_option))
      ?? programs[0]?.pricing?.find((p) => p.recommended) ?? programs[0]?.pricing?.[0]
    const charge = amount > 0 ? amount : (opt?.price ?? 0)
    if (charge > 0) {
      try {
        const stripe = getStripe()
        const session = await stripe.checkout.sessions.create({
          mode: 'payment',
          success_url: `${baseUrl}/offer/${secret}?paid=1`,
          cancel_url: `${baseUrl}/offer/${secret}?cancelled=1`,
          customer_email: signedByEmail ?? undefined,
          client_reference_id: offer.id,
          metadata: { offerId: offer.id, offerNumber: offer.offer_number, rhythm, selectedPricingOption: opt?.type ?? '' },
          line_items: [{
            quantity: 1,
            price_data: {
              currency: 'eur',
              unit_amount: Math.round(charge * 100),
              product_data: {
                name: `${programs[0]?.title ?? offer.title} · ${opt?.title ?? opt?.type ?? 'Option'}`,
                description: (rhythm === 'monthly' ? 'Monatliche Zahlung' : 'Einmalzahlung'),
              },
            },
          }],
        })
        await db.execute(sql`UPDATE offers SET stripe_checkout_session_id = ${session.id}, updated_at = now() WHERE id = ${offer.id}`)
        await recordOfferEvent(offer.id, 'checkout_started', signedByEmail, { sessionId: session.id })
        if (session.url) return NextResponse.redirect(session.url, 303)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'stripe_error'
        await recordOfferEvent(offer.id, 'checkout_failed', signedByEmail, { error: msg })
        return NextResponse.redirect(new URL(`/offer/${secret}?error=stripe`, req.url), 303)
      }
    }
  }

  // Rechnung (oder kein Preis) → zurück zur bestätigten Angebotsseite
  return NextResponse.redirect(new URL(`/offer/${secret}?accepted=1`, req.url), 303)
}
