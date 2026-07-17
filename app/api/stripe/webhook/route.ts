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
      case 'invoice.paid':
      case 'invoice.finalized':
      case 'invoice.payment_failed': {
        const inv = event.data.object as Stripe.Invoice
        const subId = typeof inv.subscription === 'string' ? inv.subscription : null
        const paidAt = inv.status_transitions?.paid_at ? new Date(inv.status_transitions.paid_at * 1000).toISOString() : null
        await db.execute(sql`
          INSERT INTO billing_invoices (stripe_invoice_id, stripe_subscription_id, customer_email, number, amount_due, amount_paid, currency, status, hosted_invoice_url, invoice_pdf, period_start, period_end, paid_at, raw)
          VALUES (${inv.id}, ${subId}, ${inv.customer_email ?? null}, ${inv.number ?? null}, ${(inv.amount_due ?? 0) / 100}, ${(inv.amount_paid ?? 0) / 100}, ${inv.currency ?? 'eur'}, ${inv.status ?? null}, ${inv.hosted_invoice_url ?? null}, ${inv.invoice_pdf ?? null},
            ${inv.period_start ? new Date(inv.period_start * 1000).toISOString() : null}, ${inv.period_end ? new Date(inv.period_end * 1000).toISOString() : null}, ${paidAt}, ${JSON.stringify(inv)}::jsonb)
          ON CONFLICT (stripe_invoice_id) DO UPDATE SET amount_paid=excluded.amount_paid, status=excluded.status, hosted_invoice_url=excluded.hosted_invoice_url, invoice_pdf=excluded.invoice_pdf, paid_at=excluded.paid_at, raw=excluded.raw
        `)
        break
      }
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent
        const email = pi.receipt_email ?? (typeof pi.customer === 'string' ? null : null)
        await db.execute(sql`
          INSERT INTO billing_payments (stripe_id, kind, customer_email, amount, currency, status, description, paid_at, raw)
          VALUES (${pi.id}, 'payment_intent', ${email}, ${(pi.amount_received ?? pi.amount ?? 0) / 100}, ${pi.currency ?? 'eur'}, ${pi.status ?? null}, ${pi.description ?? null}, now(), ${JSON.stringify(pi)}::jsonb)
          ON CONFLICT (stripe_id) DO UPDATE SET amount=excluded.amount, status=excluded.status, raw=excluded.raw
        `)
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        let email: string | null = null
        try { if (typeof sub.customer === 'string') { const cust = await stripe.customers.retrieve(sub.customer); if (cust && !('deleted' in cust && cust.deleted)) email = (cust as Stripe.Customer).email ?? null } } catch { /* ignore */ }
        const item = sub.items?.data?.[0]
        const amount = item?.price?.unit_amount != null ? item.price.unit_amount / 100 : null
        const interval = item?.price?.recurring?.interval ?? null
        await db.execute(sql`
          INSERT INTO billing_subscriptions (stripe_subscription_id, customer_email, status, amount, currency, interval, current_period_start, current_period_end, cancel_at, cancel_at_period_end, canceled_at, raw)
          VALUES (${sub.id}, ${email}, ${sub.status}, ${amount}, ${sub.currency ?? 'eur'}, ${interval},
            ${sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : null}, ${sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null},
            ${sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null}, ${sub.cancel_at_period_end ?? false}, ${sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null}, ${JSON.stringify(sub)}::jsonb)
          ON CONFLICT (stripe_subscription_id) DO UPDATE SET customer_email=COALESCE(excluded.customer_email, billing_subscriptions.customer_email), status=excluded.status, amount=excluded.amount, interval=excluded.interval, current_period_start=excluded.current_period_start, current_period_end=excluded.current_period_end, cancel_at=excluded.cancel_at, cancel_at_period_end=excluded.cancel_at_period_end, canceled_at=excluded.canceled_at, raw=excluded.raw, updated_at=now()
        `)
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
