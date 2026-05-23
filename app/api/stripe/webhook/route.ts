import { NextRequest, NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { getStripe, getStripeWebhookSecret } from '@/lib/stripe'
import { recordOfferEvent } from '@/lib/db/queries/offers'
import type Stripe from 'stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Stripe Webhook — receives signed events.
 * Configure in Stripe Dashboard → Webhooks → endpoint:
 *   https://<your-domain>/api/stripe/webhook
 * Select event: `checkout.session.completed` (other events optional).
 * Copy the signing secret into STRIPE_WEBHOOK_SECRET on Vercel.
 */
export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'missing_signature' }, { status: 400 })
  }

  let stripe
  let secret: string
  try {
    stripe = getStripe()
    secret = getStripeWebhookSecret()
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'stripe_init_failed' }, { status: 500 })
  }

  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'invalid_signature'
    return NextResponse.json({ error: 'webhook_signature_check_failed', detail: msg }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const offerId = session.client_reference_id ?? session.metadata?.offerId
        if (offerId) {
          await db.execute(sql`
            UPDATE offers
            SET status = 'paid',
                paid_at = now(),
                stripe_payment_intent_id = ${typeof session.payment_intent === 'string' ? session.payment_intent : null},
                updated_at = now()
            WHERE id = ${offerId}
          `)
          await recordOfferEvent(offerId, 'paid', session.customer_email ?? null, { sessionId: session.id })
        }
        break
      }
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        const offerId = session.client_reference_id ?? session.metadata?.offerId
        if (offerId) {
          await recordOfferEvent(offerId, 'checkout_expired', session.customer_email ?? null, { sessionId: session.id })
        }
        break
      }
      default:
        // Ignore other event types
        break
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'event_handling_failed'
    console.error('[stripe-webhook] handler error', msg)
    // Still return 200 so Stripe doesn't retry on our DB hiccups
  }

  return NextResponse.json({ ok: true })
}
