import { NextResponse } from 'next/server'
import { hiddenLinks } from '@/lib/links/check'

export const runtime = 'nodejs'
export const revalidate = 600

/** Liste der gerade ausgeblendeten externen Links (für BrokenLinkGuard). */
export async function GET() {
  const urls = await hiddenLinks().catch(() => [])
  return NextResponse.json({ urls }, { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' } })
}
