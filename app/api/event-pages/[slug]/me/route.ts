import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSecretFor } from '@/lib/event-pages/store'
import { cookieName, verify } from '@/lib/event-pages/session'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const person = verify(slug, (await cookies()).get(cookieName(slug))?.value)
  if (person === null) return NextResponse.json({ ok: false }, { status: 401 })
  const data = await getSecretFor(slug, person)
  if (!data) return NextResponse.json({ ok: false }, { status: 404 })
  return NextResponse.json({ ok: true, data }, { headers: { 'Cache-Control': 'private, no-store' } })
}
