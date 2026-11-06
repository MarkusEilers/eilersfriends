import { NextResponse } from 'next/server'
import { z } from 'zod'
import { saveQuizLead } from '@/lib/academy/quiz'

export const runtime = 'nodejs'

const Body = z.object({
  email: z.string().email().max(200),
  firstName: z.string().max(80).optional().default(''),
  answers: z.record(z.string().max(60), z.string().max(300)).optional().default({}),
  challenge: z.string().max(2000).optional().default(''),
  stage: z.string().max(120).optional(),
  recommendation: z.string().max(200).optional(),
  consent: z.boolean(),
  page: z.string().max(200).optional(),
})

/** Quiz der Academy-Seite: Antworten und Einwilligung speichern. Ohne Einwilligung nichts. */
export async function POST(req: Request) {
  const p = Body.safeParse(await req.json().catch(() => ({})))
  if (!p.success) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  if (!p.data.consent) return NextResponse.json({ error: 'consent' }, { status: 400 })
  await saveQuizLead(p.data)
  return NextResponse.json({ ok: true })
}
