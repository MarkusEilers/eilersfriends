import { NextResponse } from 'next/server'
import { getSubmission } from '@/lib/ask/store'
import { checkClaim } from '@/lib/ask/tokens'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Logo und Farbe für die Vorschau nach dem Formular — nur für die eigene Teilnahme (claim). */
export async function GET(req: Request) {
  const u = new URL(req.url)
  const id = u.searchParams.get('id') ?? '', claim = u.searchParams.get('claim') ?? ''
  if (!/^[0-9a-f-]{36}$/.test(id) || !checkClaim(id, claim)) return NextResponse.json({ ok: false }, { status: 403 })
  const s = await getSubmission(id)
  if (!s) return NextResponse.json({ ok: false }, { status: 404 })
  return NextResponse.json({ ok: true, done: s.brand.done, logo: s.brand.logo, color: s.brand.color, company: s.company })
}
