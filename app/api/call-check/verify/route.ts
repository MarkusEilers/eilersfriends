import { NextResponse } from 'next/server'
import { markVerified, readVerifyToken } from '@/lib/call-check/store'

export const runtime = 'nodejs'

/** Double opt-in link from the result mail: confirms the address, then back to the check. */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const tok = readVerifyToken(url.searchParams.get('t') ?? '')
  if (!tok) return NextResponse.redirect(`${url.origin}/gespraechs-check?verified=invalid`)
  await markVerified(tok.email)
  const prefix = tok.locale && tok.locale !== 'de' ? `/${tok.locale}` : ''
  return NextResponse.redirect(`${url.origin}${prefix}/gespraechs-check?verified=1`)
}
