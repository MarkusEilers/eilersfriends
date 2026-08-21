import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { getOfferById, listSigners, recordOfferEvent } from '@/lib/db/queries/offers'
import { getStripe } from '@/lib/stripe'
import { sendEmail } from '@/lib/email/resend'

interface PricingOption { type?: string; title?: string; price?: number; monthlyDuration?: number; recommended?: boolean }

/**
 * Abschluss eines Angebots — läuft erst, wenn ALLE Unterzeichner signiert haben.
 * Rechnung: Bestätigungsmails an alle. Karte: Stripe-Session, deren URL zurückgegeben
 * wird, damit der zuletzt Bestätigende direkt zur Zahlung geleitet werden kann.
 */
export async function finalizeOffer(offerId: string, baseUrl: string): Promise<{ done: boolean; checkoutUrl?: string }> {
  const offer = await getOfferById(offerId)
  if (!offer) return { done: false }
  const o = offer as unknown as Record<string, unknown>

  const signers = await listSigners(offerId)
  if (signers.length && !signers.every((s) => s.status === 'signed')) return { done: false }

  const names = signers.map((s) => s.name).join(', ') || String(o.customer_name ?? '')
  const emails = signers.map((s) => s.email).filter(Boolean)

  await db.execute(sql`
    UPDATE offers SET status='signed', signed_at=COALESCE(signed_at, now()),
      signed_by_name=${names}, signed_by_email=${emails[0] ?? null}, updated_at=now()
    WHERE id=${offerId} AND status <> 'paid'
  `)
  await recordOfferEvent(offerId, 'signed', emails[0] ?? null, { signers: signers.length, names })

  const method = String(o.chosen_method ?? 'invoice')
  const rhythm = String(o.chosen_rhythm ?? 'upfront')
  const amount = Number(o.chosen_amount ?? 0) || 0

  // Alle Beteiligten informieren
  for (const s of signers) {
    try {
      await sendEmail({
        to: s.email,
        subject: `Angenommen: Angebot ${String(o.offer_number)}`,
        html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#0D0D0B">
            <p>Hallo ${s.name},</p>
            <p>alle Unterschriften liegen vor — das Angebot <strong>${String(o.offer_number)}</strong> ist damit verbindlich angenommen.</p>
            <p style="font-size:13px;color:#6B7280">Unterzeichnet von: ${names}<br/>
            Zahlweise: ${rhythm === 'monthly' ? 'monatlich' : 'Einmalzahlung'} · ${method === 'card' ? 'per Kreditkarte' : 'per Rechnung'}</p>
            <p>Wir melden uns mit den nächsten Schritten und dem Onboarding.</p>
          </div>`,
        text: `Alle Unterschriften liegen vor — Angebot ${String(o.offer_number)} ist verbindlich angenommen.\nUnterzeichnet von: ${names}`,
      })
    } catch { /* Mailfehler darf den Abschluss nicht blockieren */ }
  }

  if (method !== 'card') return { done: true }

  // Kreditkarte: Checkout-Session anlegen
  try {
    const programs = (o.programs ?? []) as { title?: string; pricing?: PricingOption[] }[]
    const opt = programs[0]?.pricing?.find((p) => p.recommended) ?? programs[0]?.pricing?.[0]
    const monthlyRate = opt?.price ?? 0
    const stripe = getStripe()
    const productName = `${programs[0]?.title ?? String(o.title)} · ${opt?.title ?? 'Option'}`
    const common = {
      success_url: `${baseUrl}/offer/${String(o.access_salt)}?paid=1`,
      cancel_url: `${baseUrl}/offer/${String(o.access_salt)}?cancelled=1`,
      customer_email: emails[0] ?? undefined,
      client_reference_id: offerId,
      metadata: { offerId, offerNumber: String(o.offer_number), rhythm },
    }
    const session = rhythm === 'monthly' && monthlyRate > 0
      ? await stripe.checkout.sessions.create({ ...common, mode: 'subscription',
          line_items: [{ quantity: 1, price_data: { currency: 'eur', unit_amount: Math.round(monthlyRate * 100), recurring: { interval: 'month' }, product_data: { name: productName } } }] })
      : await stripe.checkout.sessions.create({ ...common, mode: 'payment',
          line_items: [{ quantity: 1, price_data: { currency: 'eur', unit_amount: Math.round((amount || opt?.price || 0) * 100), product_data: { name: `${productName} (Einmalzahlung)` } } }] })

    await db.execute(sql`UPDATE offers SET stripe_checkout_session_id=${session.id}, updated_at=now() WHERE id=${offerId}`)
    await recordOfferEvent(offerId, 'checkout_started', emails[0] ?? null, { sessionId: session.id })
    return { done: true, checkoutUrl: session.url ?? undefined }
  } catch (err) {
    await recordOfferEvent(offerId, 'checkout_failed', emails[0] ?? null, { error: err instanceof Error ? err.message : 'stripe_error' })
    return { done: true }
  }
}
