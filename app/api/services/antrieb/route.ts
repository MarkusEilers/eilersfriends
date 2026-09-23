import { NextResponse } from 'next/server'
import { after } from 'next/server'
import { einDurchgang, stosseAn } from '@/lib/services/antrieb'

export const runtime = 'nodejs'
export const maxDuration = 300

/**
 * Der Motor.
 *
 * Zwei Wege herein, und das ist kein Zufall:
 *
 *   Der Cron klopft alle zwei Minuten an. Das ist der Herzschlag — er haengt
 *   an nichts, was schiefgehen kann, und faengt jeden Auftrag auf, der liegen
 *   geblieben ist.
 *
 *   Die Kette stoesst sich selbst an, solange etwas offen ist. Das ist die
 *   Geschwindigkeit: Ein Auftrag laeuft in einem Zug durch, statt alle zwei
 *   Minuten ein Stueck.
 *
 * Bis zum Tarifwechsel gab es nur den zweiten Weg, und als eine
 * Umgebungsvariable fehlte, stand alles still. Jetzt ist die Kette eine
 * Beschleunigung und keine Voraussetzung mehr: Faellt sie aus, dauert es
 * laenger. Es haengt nichts.
 *
 * Vercel ruft Cron-Jobs mit GET auf — deshalb beide Verben auf denselben Kern.
 */
async function lauf(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const r = await einDurchgang()
  // Nachlegen nur, wenn es sich lohnt. Der Cron kommt ohnehin gleich wieder.
  if (r.offenGeblieben > 0) after(() => stosseAn())
  return NextResponse.json({ ok: true, ...r })
}

export const GET = lauf
export const POST = lauf
