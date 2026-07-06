import { NextRequest, NextResponse } from 'next/server'
import { voiceAuthorized, DW_PERSONS } from '@/lib/voice/auth'
import { statusNow } from '@/lib/schedule/graph'
import { getStatusOverrides } from '@/lib/voice/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!voiceAuthorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const overrides = await getStatusOverrides()
  const dwFor: Record<string, number> = {}
  for (const [dw, slug] of Object.entries(DW_PERSONS)) dwFor[slug] = Number(dw)
  const slugs = Object.values(DW_PERSONS)
  const entries = await Promise.all(slugs.map(async slug => {
    const ov = overrides[slug]
    if (ov) return [slug, { status: ov.status, source: 'manual', until: ov.until, note: ov.note, dw: dwFor[slug] }] as const
    const st = await statusNow(slug).catch(() => 'offline' as const)
    return [slug, { status: st, source: 'calendar', dw: dwFor[slug] }] as const
  }))
  return NextResponse.json({ team: Object.fromEntries(entries) })
}
