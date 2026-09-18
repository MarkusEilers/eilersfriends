import { NextResponse } from 'next/server'
import { verifyApiKey, hasScope } from '@/lib/events/auth'
import { auth } from '@/lib/auth'
import { driveRun } from '@/lib/agents/drive'

export const runtime = 'nodejs'
export const maxDuration = 300

/**
 * Die Stelle, an die eine Warteschlange klopft.
 *
 * Bewusst getrennt vom Lauf-Endpunkt: Wer hier anruft, will nicht das Ergebnis,
 * sondern nur, dass es weitergeht. So kann ein Dienst wie QStash je Schritt
 * zurueckrufen, ohne dass er etwas ueber Agenten wissen muss.
 */
export async function POST(req: Request) {
  const s = await auth()
  const isTeam = s?.user?.role === 'admin' || s?.user?.role === 'coach'
  const key = isTeam ? null : await verifyApiKey(req.headers.get('authorization'))
  const secret = process.env.CRON_SECRET
  const viaCron = secret && req.headers.get('authorization') === `Bearer ${secret}`
  if (!isTeam && !viaCron && !(key && hasScope(key, 'agents:run'))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { runId, steps } = (await req.json().catch(() => ({}))) ?? {}
  if (!runId) return NextResponse.json({ error: 'runId ist Pflicht' }, { status: 400 })
  const state = await driveRun(runId, Number(steps ?? 6))
  return NextResponse.json({ ok: true, run: state }, { status: state.status === 'fertig' ? 200 : 202 })
}
