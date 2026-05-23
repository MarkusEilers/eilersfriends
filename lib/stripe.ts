import Stripe from 'stripe'

let cached: Stripe | null = null

/**
 * Lazily initialize Stripe — throws if STRIPE_SECRET_KEY is missing
 * so the error surfaces at the call site (where we can return a clear
 * JSON error to the user) instead of crashing the whole route file.
 */
export function getStripe(): Stripe {
  if (cached) return cached
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY missing in Vercel env')
  }
  cached = new Stripe(key, {
    apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion,
    typescript: true,
  })
  return cached
}

export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET missing in Vercel env')
  return secret
}
