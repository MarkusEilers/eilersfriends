import { NextResponse } from 'next/server'
import { sweep } from '@/lib/agents/drive'
import { einDurchgang, stosseAn } from '@/lib/services/antrieb'

export const runtime = 'nodejs'
export const maxDuration = 300

/** Sicherheitsnetz, kein Motor: einmal taeglich das aufheben, was liegen blieb. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  // Erst die Laeufe, dann die Auftraege — ein Auftrag, dessen Kette gerissen
  // ist, findet hier wieder Anschluss.
  const aufgeraeumt = await sweep()
  const auftraege = await einDurchgang().catch(() => ({ bearbeitet: 0, offenGeblieben: 0 }))
  if (auftraege.offenGeblieben > 0) stosseAn()
  return NextResponse.json({ ok: true, aufgeraeumt, auftraege })
}
