import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { getOfferBySalt, recordOfferEvent, getSignerByDoi, listSigners } from '@/lib/db/queries/offers'
import { finalizeOffer } from '@/lib/offer/finalize'
import { appendAudit } from '@/lib/offer/audit'

export const runtime = 'nodejs'

function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'unknown'
}

export async function GET(req: Request, ctx: { params: Promise<{ secret: string }> }) {
  const { secret } = await ctx.params
  const token = new URL(req.url).searchParams.get('token')
  if (!token) return NextResponse.redirect(new URL(`/offer/${secret}?error=confirm`, req.url), 303)

  const offer = await getOfferBySalt(secret)
  if (!offer) return NextResponse.redirect(new URL(`/offer/${secret}?error=confirm`, req.url), 303)

  // ── Bestätigung eines einzelnen Unterzeichners ───────────────────────────
  const signer = await getSignerByDoi(token)
  if (signer && signer.offer_id === offer.id) {
    const ipC = clientIp(req)
    await db.execute(sql`
      UPDATE offer_signers SET status='signed', signed_at=now(), ip=COALESCE(${ipC}, ip), doi_token=NULL, updated_at=now()
      WHERE id=${signer.id}`)
    await recordOfferEvent(offer.id, 'signer_signed', signer.email, { signerId: signer.id, ip: ipC })
    await appendAudit({
      offerId: offer.id, signerId: signer.id, event: 'signed',
      actorName: signer.name, actorEmail: signer.email, ip: ipC,
      userAgent: req.headers.get('user-agent'), payload: { confirmedVia: 'doi-link', acceptHash: signer.accept_hash },
    })

    const all = await listSigners(offer.id)
    const open = all.filter((s) => s.status !== 'signed')
    if (open.length === 0) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin
      const res = await finalizeOffer(offer.id, baseUrl)
      if (res.checkoutUrl) return NextResponse.redirect(res.checkoutUrl, 303)
      return NextResponse.redirect(new URL(`/offer/${secret}?accepted=1`, req.url), 303)
    }
    // Bei 'sequential' den Nächsten einladen
    const order = (offer as unknown as { signing_order?: string }).signing_order ?? 'parallel'
    if (order === 'sequential') {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin
      try {
        await fetch(`${baseUrl}/api/admin/offers/${offer.id}/signers/send`, { method: 'POST' }).catch(() => {})
      } catch { /* Einladung wird sonst manuell ausgelöst */ }
    }
    return NextResponse.redirect(new URL(`/offer/${secret}?s=${signer.sign_token}&signed=1&waiting=${open.length}`, req.url), 303)
  }

  const rows = (await db.execute(sql`
    SELECT id, email, name, status FROM offer_acceptances
    WHERE offer_id = ${offer.id} AND doi_token = ${token} LIMIT 1
  `)) as unknown as { id: string; email: string | null; name: string | null; status: string }[]
  const acc = rows[0]
  if (!acc) return NextResponse.redirect(new URL(`/offer/${secret}?error=confirm`, req.url), 303)
  if (acc.status === 'confirmed') return NextResponse.redirect(new URL(`/offer/${secret}?accepted=1`, req.url), 303)

  const ip = clientIp(req)
  await db.execute(sql`
    UPDATE offer_acceptances SET status='confirmed', confirmed_at=now(), confirmed_ip=${ip}, doi_token=NULL WHERE id=${acc.id}
  `)
  await db.execute(sql`
    UPDATE offers SET status='signed', signed_at=now(), signed_by_name=${acc.name}, signed_by_email=${acc.email}, updated_at=now()
    WHERE id=${offer.id} AND status <> 'paid'
  `)
  await recordOfferEvent(offer.id, 'accept_confirmed', acc.email, { acceptanceId: acc.id })
  return NextResponse.redirect(new URL(`/offer/${secret}?accepted=1`, req.url), 303)
}
