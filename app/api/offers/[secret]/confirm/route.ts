import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { getOfferBySalt, recordOfferEvent } from '@/lib/db/queries/offers'

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
