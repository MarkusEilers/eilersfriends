import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { graphConfigured, authorizeUrl } from '@/lib/schedule/graph'
import { signState } from '@/lib/schedule/crypto'
import { personBySlug } from '@/lib/schedule/config'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user.role !== 'admin' && session.user.role !== 'coach')) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }
  if (!graphConfigured()) return NextResponse.redirect(new URL('/admin/schedule?error=not_configured', req.url))
  const person = req.nextUrl.searchParams.get('person') || ''
  if (!personBySlug(person)) return NextResponse.redirect(new URL('/admin/schedule?error=bad_person', req.url))
  const state = signState(`${person}:${Date.now()}`)
  return NextResponse.redirect(authorizeUrl(state))
}
