import { NextResponse } from 'next/server'
import { getFunnel } from '@/lib/ask/registry'
import { compute, validateAnswers, shortResult, asLang } from '@/lib/ask/engine'
import { createSubmission, getCalibration, recentByIp } from '@/lib/ask/store'
import { claimToken } from '@/lib/ask/tokens'
import { hashIp } from '@/lib/call-check/store'
import { trackEvent, vidFrom } from '@/lib/scoring/core'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Antworten rein, Kurzergebnis raus. Speichert die Teilnahme anonym. */
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const f = getFunnel(slug)
  if (!f) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const answers = validateAnswers(f.def, body.answers)
  if (!answers) return NextResponse.json({ ok: false, error: 'incomplete' }, { status: 400 })
  const lang = asLang(String(body.lang ?? ''))
  const ipHash = hashIp(req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null)
  if ((await recentByIp(ipHash)) >= 30) return NextResponse.json({ ok: false, error: 'rate' }, { status: 429 })

  const cal = await getCalibration(slug)
  const result = compute(f.def, cal, answers)
  const vid = vidFrom(req, body.vid)
  const str = (v: unknown, n: number) => (typeof v === 'string' && v ? v.slice(0, n) : null)
  const id = await createSubmission({ funnel: slug, lang, answers, result, vid, source: str(body.source, 80), variant: str(body.variant, 40), ipHash })

  if (vid) {
    const first = result.first ? f.def.stages.find((s) => s.key === result.first)!.name.de : null
    await trackEvent({
      vid, kind: 'quiz_complete', key: `ask:${slug}`, path: `/check/${slug}`, persistent: !!vidFrom(req),
      payload: { funnel: slug, first: result.first, redCount: result.redCount, rec: result.cta, lang, stageLabel: first ? `Engpass ${first}` : 'kein Engpass', recLabel: f.def.ctas[result.cta]?.title.de },
    }).catch(() => {})
  }
  return NextResponse.json({ ok: true, id, claim: claimToken(id), short: shortResult(f.def, result, lang) })
}
