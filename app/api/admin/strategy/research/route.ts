import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { researchVoc } from '@/lib/strategy/research/voc'
import { researchCompete } from '@/lib/strategy/research/compete'

export const runtime = 'nodejs'
// 300 Sekunden ist die Obergrenze des Tarifs. Die Kaskade braucht heute rund 75:
// acht Suchanfragen nacheinander, danach drei Agenten. Wenn sie waechst, wird der
// Sammellauf in zwei Aufrufe geteilt — nicht die Grenze erhoeht.
export const maxDuration = 300

/**
 * Die Recherche-Stufe: sammeln, ablegen, auswerten.
 *
 * Sie laeuft lange — acht Suchanfragen nacheinander, danach drei Agenten. Das ist
 * Absicht: die Alternative waere, alles parallel zu feuern und bei einem Fehler
 * nicht mehr zu wissen, welche Quelle geschwiegen hat.
 */
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.role || (session.user.role !== 'admin' && session.user.role !== 'coach')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const { companyId, productId, stepKey } = (await req.json().catch(() => ({}))) ?? {}
  if (!companyId) return NextResponse.json({ error: 'companyId ist Pflicht' }, { status: 400 })

  try {
    const res = await researchVoc({
      companyId, productId: productId ?? null, stepKey: stepKey ?? 'research',
      userId: session.user.id ?? null,
    })
    return NextResponse.json({
      ok: true,
      quellen: res.findings.map((f) => ({
        quelle: f.source, belege: f.citations.length, zeichen: f.text.length, fehler: f.error ?? null,
      })),
      leer: res.empty, fehlgeschlagen: res.failed,
      agenten: Object.fromEntries(
        Object.entries(res.agents ?? {}).map(([k, v]) => [k, { ok: v.ok, facts: v.facts, error: v.error }]),
      ),
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

/**
 * Die Wettbewerbs-Recherche. Eigener Aufruf, weil sie eine andere Frage stellt:
 * dort was Kunden empfinden, hier was Anbieter behaupten.
 */
export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user?.role || (session.user.role !== 'admin' && session.user.role !== 'coach')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const { companyId, productId, stepKey } = (await req.json().catch(() => ({}))) ?? {}
  if (!companyId) return NextResponse.json({ error: 'companyId ist Pflicht' }, { status: 400 })
  try {
    const res = await researchCompete({
      companyId, productId: productId ?? null, stepKey: stepKey ?? 'compete',
      userId: session.user.id ?? null,
    })
    return NextResponse.json({
      ok: true,
      quellen: res.findings.map((f) => ({ quelle: f.source, belege: f.citations.length, fehler: f.error ?? null })),
      agenten: Object.fromEntries(
        Object.entries(res.agents ?? {}).map(([k, v]) => [k, { ok: v.ok, facts: v.facts, error: v.error }]),
      ),
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
