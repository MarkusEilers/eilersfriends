import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { getOfferById, listSigners, pendingSigners, recordOfferEvent } from '@/lib/db/queries/offers'
import { sendEmail } from '@/lib/email/resend'

export const runtime = 'nodejs'
export const maxDuration = 60

/** Verschickt personalisierte Signing-Links. Bei 'sequential' nur an den Nächsten. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.role || (session.user.role !== 'admin' && session.user.role !== 'coach')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const { id } = await ctx.params
  const offer = await getOfferById(id)
  if (!offer) return NextResponse.json({ error: 'offer not found' }, { status: 404 })

  const all = await listSigners(id)
  if (!all.length) return NextResponse.json({ error: 'keine Unterzeichner hinterlegt' }, { status: 400 })

  const order = (offer as unknown as { signing_order?: string }).signing_order ?? 'parallel'
  const targets = await pendingSigners(id, order)
  if (!targets.length) return NextResponse.json({ ok: true, sent: 0, note: 'alle haben bereits unterschrieben' })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin
  const co = (offer as unknown as { customer_company?: string; customer_name: string })
  const forWhom = co.customer_company || co.customer_name

  let sent = 0
  for (const s of targets) {
    const link = `${baseUrl}/offer/${(offer as unknown as { access_salt: string }).access_salt}?s=${s.sign_token}`
    const others = all.filter((x) => x.id !== s.id).map((x) => x.name)
    try {
      await sendEmail({
        to: s.email,
        subject: `Zur Unterschrift: Angebot ${offer.offer_number}`,
        html: `
          <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#0D0D0B">
            <p>Hallo ${s.name},</p>
            <p>für <strong>${forWhom}</strong> liegt das Angebot <strong>${offer.offer_number}</strong> zur Unterschrift bereit.</p>
            ${others.length ? `<p style="font-size:14px;color:#4B5563">Mitzeichnend: ${others.join(', ')}. Das Angebot gilt als angenommen, sobald alle unterschrieben haben.</p>` : ''}
            <p style="margin:28px 0">
              <a href="${link}" style="background:#1A5FD4;color:#fff;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:bold">Angebot ansehen und unterschreiben</a>
            </p>
            <p style="font-size:12px;color:#9CA3AF">Dieser Link ist persönlich für Dich und nicht übertragbar.</p>
          </div>`,
        text: `Hallo ${s.name},\n\nfür ${forWhom} liegt das Angebot ${offer.offer_number} zur Unterschrift bereit:\n${link}\n\n${others.length ? `Mitzeichnend: ${others.join(', ')}.\n` : ''}Dieser Link ist persönlich.`,
      })
      await db.execute(sql`UPDATE offer_signers SET status = CASE WHEN status='pending' THEN 'invited' ELSE status END, invited_at = now(), updated_at = now() WHERE id = ${s.id}`)
      await recordOfferEvent(id, 'signer_invited', s.email, { signerId: s.id })
      sent++
    } catch (err) {
      await recordOfferEvent(id, 'signer_invite_failed', s.email, { error: err instanceof Error ? err.message : 'mail_error' })
    }
  }
  return NextResponse.json({ ok: true, sent, order })
}
