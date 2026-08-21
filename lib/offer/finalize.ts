import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { getOfferById, listSigners, recordOfferEvent } from '@/lib/db/queries/offers'
import { getStripe } from '@/lib/stripe'
import { sendEmail } from '@/lib/email/resend'
import { appendAudit, listAudit, verifyChain, saveArchive, sha256 } from './audit'
import { buildCertificatePdf } from './certificate'

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
  // ── Beweiskette abschliessen, Inhalt einfrieren, PDF archivieren ────────
  await appendAudit({
    offerId, event: 'finalized', actorName: names, actorEmail: emails[0] ?? null,
    payload: { method, rhythm, amount, signers: signers.map((s) => ({ name: s.name, email: s.email, signedAt: s.signed_at, ip: s.ip })) },
  })
  const chain = await verifyChain(offerId)
  const audit = await listAudit(offerId)
  const snapshot = {
    offer_number: o.offer_number, title: o.title, subtitle: o.subtitle,
    customer_name: o.customer_name, customer_company: o.customer_company,
    understanding_section: o.understanding_section, empathy_section: o.empathy_section,
    programs: o.programs, economic_results: o.economic_results, track: o.track,
    guarantee_text: o.guarantee_text, guarantee_tiers: o.guarantee_tiers,
    chosen_method: method, chosen_rhythm: rhythm, chosen_amount: amount,
    frozen_at: new Date().toISOString(),
  }
  try {
    const pdfBytes = await buildCertificatePdf({
      offerNumber: String(o.offer_number),
      title: String(o.title ?? ''),
      customer: String(o.customer_company || o.customer_name || ''),
      amountLabel: amount ? `${amount.toLocaleString('de-DE')} EUR (${rhythm === 'monthly' ? 'monatlich' : 'einmalig'})` : undefined,
      signers: signers.map((s) => ({ name: s.name, email: s.email, signedAt: s.signed_at, ip: s.ip, hash: s.accept_hash })),
      audit, chainHead: chain.head,
    })
    const buf = Buffer.from(pdfBytes)
    const digest = sha256(buf)
    let url: string | null = null
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN
    if (blobToken) {
      const { put } = await import('@vercel/blob')
      const blob = await put(`offers/${String(o.offer_number)}-${digest.slice(0, 12)}.pdf`, buf, {
        access: 'public', contentType: 'application/pdf', token: blobToken,
      })
      url = blob.url
    }
    await saveArchive({ offerId, url, sha256: digest, byteSize: buf.length, snapshot, chainHead: chain.head ?? null })
    await recordOfferEvent(offerId, 'archived', emails[0] ?? null, { sha256: digest, url, chainOk: chain.ok })
  } catch (err) {
    // Archivierung darf den Abschluss nicht blockieren — Snapshot trotzdem sichern.
    await saveArchive({ offerId, kind: 'snapshot_only', url: null, sha256: sha256(JSON.stringify(snapshot)), snapshot, chainHead: chain.head ?? null }).catch(() => {})
    await recordOfferEvent(offerId, 'archive_failed', emails[0] ?? null, { error: err instanceof Error ? err.message : 'pdf_error' })
  }



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
