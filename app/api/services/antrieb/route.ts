import { NextResponse } from 'next/server'
import { after } from 'next/server'
import { einDurchgang, stosseAn } from '@/lib/services/antrieb'

export const runtime = 'nodejs'
export const maxDuration = 300

/**
 * Der Motor.
 *
 * Niemand von aussen ruft das hier auf. Es stoesst sich selbst an, solange
 * etwas offen ist, und der taegliche Cron faengt auf, was durchgerutscht ist.
 *
 * Die Kette bricht von selbst ab: Wenn nichts mehr offen ist, wird nicht mehr
 * angestossen — und ein Auftrag, der sich sechzig Mal geschoben hat, wird
 * nicht mehr aufgegriffen.
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const r = await einDurchgang()
  if (r.offenGeblieben > 0) after(() => stosseAn())
  return NextResponse.json({ ok: true, ...r })
}
