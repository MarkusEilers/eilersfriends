import { NextResponse } from 'next/server'
import { checkPassword } from '@/lib/event-pages/store'
import { cookieName, sign } from '@/lib/event-pages/session'

export const dynamic = 'force-dynamic'

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const body = (await req.json().catch(() => ({}))) as { password?: string }
  const person = await checkPassword(slug, String(body.password ?? ''))
  if (person === null) {
    // Bremse gegen Durchprobieren (zusätzlich zu bcrypt)
    await new Promise((r) => setTimeout(r, 800))
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  const { value, maxAge } = sign(slug, person)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(cookieName(slug), value, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge })
  return res
}
