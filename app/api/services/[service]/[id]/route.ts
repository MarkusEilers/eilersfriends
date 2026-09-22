import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { verifyApiKey, hasScope } from '@/lib/events/auth'
import { ensureServiceSchema, type ServiceOrder } from '@/lib/services/schema'

export const runtime = 'nodejs'
export const maxDuration = 300

/**
 * Nachfragen — und sonst nichts.
 *
 * Fruehere Fassung hat hier den Lauf mitgeschoben. Das war bequem und falsch:
 * Ein Auftrag, der nur vorankommt, wenn jemand nachfragt, laedt den
 * Besteller ein, im Sekundentakt zu fragen — und bleibt stehen, wenn er es
 * nicht tut.
 *
 * Der Antrieb liegt jetzt bei uns (lib/services/antrieb.ts). Diese Stelle
 * liest nur.
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
