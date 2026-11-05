import { NextResponse } from 'next/server'
import { z } from 'zod'
import { workDomain } from '@/lib/util/email'
import { createLead, hasCompanyBooked, getAvailability, nextQuarterLabel } from '@/lib/mystery-shopping/slots'

export const runtime = 'nodejs'

const Body = z.object({ email: z.string().email().max(200), firstName: z.string().max(80).optional().default(''), source: z.string().max(60).optional().default('mystery-shopping') })

/** Opt-in der Squeeze-Seite: Firmenadresse prüfen, Doppelbuchung und Ausgebucht früh melden, Lead anlegen. */
export async function POST(req: Request) {
  const p = Body.safeParse(await req.json().catch(() => ({})))
  if (!p.success) return NextResponse.json({ error: 'Bitte gebt Vorname und eine gültige Firmen-E-Mail an.' }, { status: 400 })
  const domain = workDomain(p.data.email)
  if (!domain) return NextResponse.json({ error: 'Bitte nutzt Eure Firmen-E-Mail-Adresse. Das Mystery Shopping gibt es einmal pro Firma.' }, { status: 400 })
  if (await hasCompanyBooked(domain)) return NextResponse.json({ error: 'Eure Firma hat das Mystery Shopping bereits gebucht. Es gibt es einmal pro Firma.' }, { status: 409 })
  const a = await getAvailability()
  if (a.soldOut) return NextResponse.json({ error: `Dieses Quartal ist ausgebucht. Der nächste Durchgang startet im ${nextQuarterLabel(a.quarter)}.` }, { status: 409 })
  const lead = await createLead({ email: p.data.email, firstName: p.data.firstName, domain, source: p.data.source })
  return NextResponse.json({ ok: true, lead })
}
