import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getFunnel } from '@/lib/ask/registry'
import { attachContact, getSubmission } from '@/lib/ask/store'
import { checkClaim } from '@/lib/ask/tokens'
import { sendDoiMail } from '@/lib/ask/mail'
import { workDomain } from '@/lib/util/email'
import { identify, trackEvent, vidFrom } from '@/lib/scoring/core'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const Body = z.object({
  id: z.string().uuid(),
  claim: z.string().min(10).max(64),
  email: z.string().trim().email().max(200),
  company: z.string().trim().min(2).max(160),
  phone: z.string().trim().max(40).optional().default(''),
  firstName: z.string().trim().max(80).optional().default(''),
  consent: z.literal(true),
  vid: z.string().optional(),
})

/** Kontakt an die Teilnahme hängen und die Bestätigungs-Mail schicken. Der Report öffnet sich erst nach dem Klick. */
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const f = getFunnel(slug)
  if (!f) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
  const p = Body.safeParse(await req.json().catch(() => ({})))
  if (!p.success) return NextResponse.json({ ok: false, error: 'invalid', fields: p.error.issues.map((i) => i.path.join('.')) }, { status: 400 })
  const b = p.data
  if (!checkClaim(b.id, b.claim)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  const s = await getSubmission(b.id)
  if (!s || s.funnel !== slug) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
  if (s.doiSent >= 3) return NextResponse.json({ ok: false, error: 'rate' }, { status: 429 })

  const phone = b.phone.replace(/[^\d+ ()/-]/g, '').trim()
  if (f.def.contact.phone === 'required' && phone.replace(/\D/g, '').length < 6) return NextResponse.json({ ok: false, error: 'invalid', fields: ['phone'] }, { status: 400 })
  if (phone && phone.replace(/\D/g, '').length < 6) return NextResponse.json({ ok: false, error: 'invalid', fields: ['phone'] }, { status: 400 })

  const email = b.email.toLowerCase()
  await attachContact(s.id, { email, company: b.company, phone: phone || null, firstName: b.firstName || null }, workDomain(email), null)
  const vid = vidFrom(req, b.vid) ?? s.vid
  if (vid) {
    await identify(vid, email, b.firstName || null, `ask:${slug}`).catch(() => {})
    await trackEvent({ vid, kind: 'form_start', key: `ask:${slug}:contact`, payload: { company: b.company } }).catch(() => {})
  }
  try {
    await sendDoiMail(f.def, s.id, s.lang, email, b.firstName || null)
  } catch (e) {
    console.error('[ask] DOI mail failed', e)
    return NextResponse.json({ ok: false, error: 'mail' }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}
