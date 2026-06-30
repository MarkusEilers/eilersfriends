import { NextRequest, NextResponse } from 'next/server'
import { exchangeCode } from '@/lib/schedule/graph'
import { verifyState } from '@/lib/schedule/crypto'
import { saveConnection } from '@/lib/schedule/store'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const stateTok = req.nextUrl.searchParams.get('state') || ''
  const state = verifyState(stateTok)
  if (!code || !state) return NextResponse.redirect(new URL('/admin/schedule?error=oauth', req.url))
  const person = state.split(':')[0]
  try {
    const { refreshToken, email } = await exchangeCode(code)
    if (!refreshToken) return NextResponse.redirect(new URL('/admin/schedule?error=no_refresh', req.url))
    await saveConnection(person, refreshToken, email)
    return NextResponse.redirect(new URL(`/admin/schedule?connected=${person}`, req.url))
  } catch {
    return NextResponse.redirect(new URL('/admin/schedule?error=exchange', req.url))
  }
}
