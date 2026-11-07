import { NextResponse } from 'next/server'
import { z } from 'zod'
import { trackEvent, vidFrom, EVENT_KINDS, VID_RE } from '@/lib/scoring/core'

export const runtime = 'nodejs'

const Body = z.object({
  vid: z.string().regex(VID_RE),
  kind: z.enum(EVENT_KINDS),
  key: z.string().max(200).optional().default(''),
  payload: z.record(z.string(), z.unknown()).optional().default({}),
  path: z.string().max(300).optional(),
})

/** Ereignisse fürs Lead-Scoring (Quiz-Antworten, CTA-Klicks …). Antwortet immer schnell. */
export async function POST(req: Request) {
  const raw = await req.text().catch(() => '')
  if (raw.length > 8000) return NextResponse.json({ ok: false }, { status: 413 })
  let json: unknown = {}
  try { json = JSON.parse(raw) } catch { /* leer */ }
  const p = Body.safeParse(json)
  if (!p.success) return NextResponse.json({ ok: false }, { status: 400 })
  if (p.data.kind === 'identified' || p.data.kind === 'booking' || p.data.kind === 'optin') return NextResponse.json({ ok: false }, { status: 400 })
  const cookieVid = vidFrom(req)
  await trackEvent({ vid: cookieVid ?? p.data.vid, kind: p.data.kind, key: p.data.key, payload: p.data.payload, path: p.data.path, persistent: !!cookieVid }).catch(() => {})
  return NextResponse.json({ ok: true })
}
