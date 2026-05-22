import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { getOfferBySalt, recordOfferEvent } from '@/lib/db/queries/offers'

export const runtime = 'nodejs'

export async function POST(req: Request, ctx: { params: Promise<{ secret: string }> }) {
  const { secret } = await ctx.params
  const offer = await getOfferBySalt(secret)
  if (!offer) return NextResponse.json({ error: 'not found' }, { status: 404 })

  // Read optional pricing-option choice + signer info from the form body
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

  // Stripe checkout will be wired in next session; for now redirect back to the offer page.
  // The page will render the "Bestätigt — vielen Dank" state because status is now 'signed'.
  const url = new URL(`/offer/${secret}`, req.url)
  return NextResponse.redirect(url, 303)
}
