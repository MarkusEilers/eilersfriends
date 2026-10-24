import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { graphConfigured, authorizeUrl, ADD_AUTHORITY } from '@/lib/schedule/graph'
import { signState, verifyState } from '@/lib/schedule/crypto'
import { personBySlug } from '@/lib/schedule/config'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  // Einladungslink (signiert, 14 Tage gültig): die Person verbindet ihr
  // Postfach selbst, ohne Admin-Login. Sonst nur Admin/Coach.
  const invite = verifyState(req.nextUrl.searchParams.get('invite') || '')
  const inv = invite?.split(':')
  const invited = inv && inv[0] === 'invite' && personBySlug(inv[1]) && Number(inv[2]) > Date.now() ? inv[1] : null
  if (!invited) {
    const session = await auth()
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'coach')) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }
  }
  if (!graphConfigured()) return NextResponse.redirect(new URL('/admin/schedule?error=not_configured', req.url))
  const person = invited ?? (req.nextUrl.searchParams.get('person') || '')
  if (!personBySlug(person)) return NextResponse.redirect(new URL('/admin/schedule?error=bad_person', req.url))
  const add = req.nextUrl.searchParams.get('add') === '1'
  const state = signState(`${person}:${add ? 'add' : 'primary'}:${Date.now()}${invited ? ':invite' : ''}`)
  return NextResponse.redirect(authorizeUrl(state, add ? ADD_AUTHORITY : undefined))
}
