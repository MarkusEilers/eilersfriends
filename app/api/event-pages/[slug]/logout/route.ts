import { NextResponse } from 'next/server'
import { cookieName } from '@/lib/event-pages/session'

export async function POST(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const res = NextResponse.json({ ok: true })
  res.cookies.set(cookieName(slug), '', { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 0 })
  return res
}
