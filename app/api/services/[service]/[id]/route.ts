import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { verifyApiKey, hasScope } from '@/lib/events/auth'
import { ensureServiceSchema, updateOrder, type ServiceOrder } from '@/lib/services/schema'
import { driveRun } from '@/lib/agents/drive'

export const runtime = 'nodejs'
export const maxDuration = 300

/**
 * Nachfragen — und dabei weitertreiben.
 *
 * Wer nach dem Stand fragt, will meistens, dass es vorangeht. Also schiebt
 * jede Abfrage den Lauf ein Stueck weiter, statt nur zu berichten. Das spart
 * dem CRM eine zweite Schleife und uns eine Warteschlange.
 */
export async function GET(req: Request, { params }: { params: Promise<{ service: string; id: string }> }) {
  const { service, id } = await params

  const s = await auth()
  const istTeam = s?.user?.role === 'admin' || s?.user?.role === 'coach'
  const key = istTeam ? null : await verifyApiKey(req.headers.get('authorization'))
  if (!istTeam && !(key && hasScope(key, 'services:run'))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  await ensureServiceSchema()
  const rows = (await db.execute(sql`
    SELECT * FROM service_orders WHERE id = ${id}::uuid AND service_key = ${service} LIMIT 1`)
  ) as unknown as ServiceOrder[]
  const order = rows[0]
  if (!order) return NextResponse.json({ error: 'nicht gefunden' }, { status: 404 })

  if (order.status === 'laeuft' && order.run_ids.length) {
    const lauf = order.run_ids[order.run_ids.length - 1]
    const state = await driveRun(lauf, 4).catch(() => null)
    if (state?.status === 'fertig') {
      await updateOrder(order.id, { status: 'fertig', ergebnis: state.output })
      order.status = 'fertig'
      order.ergebnis = (state.output ?? null) as Record<string, unknown> | null
    } else if (state?.status === 'fehler') {
      await updateOrder(order.id, { status: 'fehler', fehler: 'Lauf abgebrochen — siehe Lauf-Protokoll.' })
      order.status = 'fehler'
    }
  }

  return NextResponse.json({
    ok: true,
    auftragId: order.id,
    status: order.status,
    firma: order.firma,
    ergebnis: order.status === 'fertig' ? order.ergebnis : null,
    fehler: order.fehler,
    laeufe: order.run_ids,
  })
}
