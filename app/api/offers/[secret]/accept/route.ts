import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { getOfferBySalt, recordOfferEvent } from '@/lib/db/queries/offers'
import { getStripe } from '@/lib/stripe'

export const runtime = 'nodejs'

interface PricingOption {
  type?: string
  title?: string
  description?: string
  price?: number
  monthlyDuration?: number
  features?: string[]
  recommended?: boolean
}

interface Program {
  title?: string
  pricing?: PricingOption[]
}

export async function POST(req: Request, ctx: { params: Promise<{ secret: string }> }) {
  const { secret } = await ctx.params
  const offer = await getOfferBySalt(secret)
  if (!offer) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const form = await req.formData().catch(() => null)
  const signedByName = form?.get('signedByName')?.toString() || offer.customer_name
  const signedByEmail = form?.get('signedByEmail')?.toString() || offer.customer_email || null
  const selectedPricingOption = form?.get('selectedPricingOption')?.toString() || null

  // Mark as signed
  await db.execute(sql`
    UPDATE offers
    SET status = 'signed',
        signed_at = now(),
        signed_by_name = ${signedByName},
        signed_by_email = ${signedByEmail},
        selected_pricing_option = COALESCE(${selectedPricingOption}, selected_pricing_option),
        updated_at = now()
    WHERE access_salt = ${secret}
  `)
  await recordOfferEvent(offer.id, 'signed', signedByEmail, { selectedPricingOption })

  // Try to start Stripe Checkout if a pricing option with a real price is selected
  const programs = (offer as unknown as { programs?: Program[] }).programs ?? []
  const pricingOption =
    programs[0]?.pricing?.find((p) => p.type === (selectedPricingOption ?? offer.selected_pricing_option))
    ?? programs[0]?.pricing?.find((p) => p.recommended)
    ?? programs[0]?.pricing?.[0]

  const baseUrl = new URL(req.url).origin

  if (pricingOption && (pricingOption.price ?? 0) > 0) {
    try {
      const stripe = getStripe()
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        success_url: `${baseUrl}/offer/${secret}?paid=1`,
        cancel_url: `${baseUrl}/offer/${secret}?cancelled=1`,
        customer_email: signedByEmail ?? undefined,
        client_reference_id: offer.id,
        metadata: {
          offerId: offer.id,
          offerNumber: offer.offer_number,
          selectedPricingOption: pricingOption.type ?? '',
        },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: 'eur',
              unit_amount: Math.round((pricingOption.price ?? 0) * 100),
              product_data: {
                name: `${programs[0]?.title ?? offer.title} · ${pricingOption.title ?? pricingOption.type ?? 'Option'}`,
                description: pricingOption.description ?? offer.subtitle ?? undefined,
                metadata: { offerNumber: offer.offer_number },
              },
            },
          },
        ],
      })

      await db.execute(sql`
        UPDATE offers
        SET stripe_checkout_session_id = ${session.id}, updated_at = now()
        WHERE id = ${offer.id}
      `)
      await recordOfferEvent(offer.id, 'checkout_started', signedByEmail, { sessionId: session.id })

      if (session.url) {
        return NextResponse.redirect(session.url, 303)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'stripe_error'
      // Non-fatal — fall through to the success page; admin will see the error in events
      await recordOfferEvent(offer.id, 'checkout_failed', signedByEmail, { error: msg })
      const url = new URL(`/offer/${secret}?error=stripe`, req.url)
      return NextResponse.redirect(url, 303)
    }
  }

  // No Stripe path — redirect back to the signed offer page.
  const url = new URL(`/offer/${secret}`, req.url)
  return NextResponse.redirect(url, 303)
}
