import { NextResponse } from 'next/server'
import { z } from 'zod'
import { workDomain } from '@/lib/util/email'
import { identify, trackEvent, vidFrom } from '@/lib/scoring/core'
import { createLead, hasCompanyBooked, getAvailability, nextQuarterLabel } from '@/lib/mystery-shopping/slots'

export const runtime = 'nodejs'

const Body = z.object({ email: z.string().email().max(200), firstName: z.string().max(80).optional().default(''), source: z.string().max(60).optional().default('mystery-shopping'), vid: z.string().max(64).optional(), locale: z.string().max(5).optional() })

/** Opt-in der Squeeze-Seite: Firmenadresse prüfen, Doppelbuchung und Ausgebucht früh melden, Lead anlegen. */
const MSG = {
  de: { bad: 'Bitte gebt Vorname und eine gültige Firmen-E-Mail an.', free: 'Bitte nutzt Eure Firmen-E-Mail-Adresse. Das Mystery Shopping gibt es einmal pro Firma.', dup: 'Eure Firma hat das Mystery Shopping bereits gebucht. Es gibt es einmal pro Firma.', sold: (q: string) => `Dieses Quartal ist ausgebucht. Der nächste Durchgang startet im ${q}.` },
  en: { bad: 'Please enter your first name and a valid work email.', free: 'Please use your work email address. Mystery Shopping is available once per company.', dup: 'Your company has already booked Mystery Shopping. It is available once per company.', sold: (q: string) => `This quarter is sold out. The next round starts in ${q}.` },
  es: { bad: 'Indica tu nombre y un email de empresa válido.', free: 'Usa tu email de empresa. El Mystery Shopping está disponible una vez por empresa.', dup: 'Tu empresa ya ha reservado el Mystery Shopping. Está disponible una vez por empresa.', sold: (q: string) => `Este trimestre está agotado. La próxima ronda empieza en ${q}.` },
}

export async function POST(req: Request) {
  const raw = await req.json().catch(() => ({}))
  const M = MSG[(raw?.locale === 'en' || raw?.locale === 'es') ? raw.locale as 'en' | 'es' : 'de']
  const p = Body.safeParse(raw)
  if (!p.success) return NextResponse.json({ error: M.bad }, { status: 400 })
  const domain = workDomain(p.data.email)
  if (!domain) return NextResponse.json({ error: M.free }, { status: 400 })
  if (await hasCompanyBooked(domain)) return NextResponse.json({ error: M.dup }, { status: 409 })
  const a = await getAvailability()
  if (a.soldOut) return NextResponse.json({ error: M.sold(nextQuarterLabel(a.quarter)) }, { status: 409 })
  const lead = await createLead({ email: p.data.email, firstName: p.data.firstName, domain, source: p.data.source })
  const vid = vidFrom(req, p.data.vid)
  if (vid) {
    await identify(vid, p.data.email, p.data.firstName, 'mystery-shopping').catch(() => {})
    await trackEvent({ vid, kind: 'optin', key: 'mystery-shopping', payload: { source: p.data.source } }).catch(() => {})
  }
  return NextResponse.json({ ok: true, lead })
}
