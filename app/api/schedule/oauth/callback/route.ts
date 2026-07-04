import { NextRequest, NextResponse } from 'next/server'
import { exchangeCode, ADD_AUTHORITY } from '@/lib/schedule/graph'
import { verifyState } from '@/lib/schedule/crypto'
import { saveConnection, saveExtraCalendar } from '@/lib/schedule/store'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const stateTok = req.nextUrl.searchParams.get('state') || ''
  const state = verifyState(stateTok)
  if (!code || !state) return NextResponse.redirect(new URL('/admin/schedule?error=oauth', req.url))
  const parts = state.split(':')
  const person = parts[0]
  const isAdd = parts[1] === 'add'
  try {
    const { refreshToken, email, tenantId } = await exchangeCode(code, isAdd ? ADD_AUTHORITY : undefined)
    if (!refreshToken) return NextResponse.redirect(new URL('/admin/schedule?error=no_refresh', req.url))
    if (isAdd) {
      if (!email) return NextResponse.redirect(new URL('/admin/schedule?error=no_email', req.url))
      await saveExtraCalendar(person, email, tenantId, refreshToken)
      return NextResponse.redirect(new URL(`/admin/schedule?added=${person}`, req.url))
    }
    await saveConnection(person, refreshToken, email)
    return NextResponse.redirect(new URL(`/admin/schedule?connected=${person}`, req.url))
  } catch {
    return NextResponse.redirect(new URL('/admin/schedule?error=exchange', req.url))
  }
}
