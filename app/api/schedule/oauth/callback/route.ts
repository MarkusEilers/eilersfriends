import { NextRequest, NextResponse } from 'next/server'
import { exchangeCode, ADD_AUTHORITY } from '@/lib/schedule/graph'
import { verifyState } from '@/lib/schedule/crypto'
import { saveConnection, saveExtraCalendar } from '@/lib/schedule/store'
import { invalidatePerson } from '@/lib/schedule/availability-cache'
import { logError } from '@/lib/errors/store'

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
    if (!refreshToken) {
      await logError({ source: 'server', message: `OAuth: kein refresh_token (${person}, add=${isAdd})`, url: '/api/schedule/oauth/callback' })
      return NextResponse.redirect(new URL('/admin/schedule?error=no_refresh', req.url))
    }
    if (isAdd) {
      if (!email) {
        await logError({ source: 'server', message: `OAuth-Add: keine E-Mail ermittelt (${person})`, url: '/api/schedule/oauth/callback', context: { tenantId } })
        return NextResponse.redirect(new URL('/admin/schedule?error=no_email', req.url))
      }
      await saveExtraCalendar(person, email, tenantId, refreshToken)
      await invalidatePerson(person).catch(() => {})
      return NextResponse.redirect(new URL(`/admin/schedule?added=${person}`, req.url))
    }
    await saveConnection(person, refreshToken, email)
    await invalidatePerson(person).catch(() => {})
    return NextResponse.redirect(new URL(`/admin/schedule?connected=${person}`, req.url))
  } catch (e) {
    await logError({ source: 'server', message: `OAuth-Callback fehlgeschlagen (${person}, add=${isAdd}): ${String((e as Error)?.message || e)}`, url: '/api/schedule/oauth/callback' })
    return NextResponse.redirect(new URL('/admin/schedule?error=exchange', req.url))
  }
}
