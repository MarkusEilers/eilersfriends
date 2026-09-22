import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { verifyApiKey, hasScope } from '@/lib/events/auth'
import { ensureServiceSchema } from '@/lib/services/schema'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Die Statusabfrage fuers CRM.
 *
 * Bewusst EIN Endpunkt fuer alle Auftraege statt einer je Auftrag: Wer alle
 * drei bis fuenf Minuten nachsieht, soll einen Aufruf machen und nicht
 * dreissig. Und er soll nur das bekommen, was sich seit dem letzten Mal
 * geaendert hat.
 *
 *   GET /api/services/status?seit=2026-09-23T10:00:00Z
 *
 * Ohne `seit` kommen die letzten vierundzwanzig Stunden. Die Antwort traegt
 * `stand` — das gehoert beim naechsten Mal ins `seit`, dann entsteht keine
 * Luecke und nichts kommt doppelt.
 *
 * Hier wird nichts angetrieben. Die Auftraege bewegen sich von selbst
 * (lib/services/antrieb.ts); diese Stelle sieht nur nach.
 */
export async function GET(req: Request) {
  const s = await auth()
  const istTeam = s?.user?.role === 'admin' || s?.user?.role === 'coach'
  const key = istTeam ? null : await verifyApiKey(req.headers.get('authorization'))
  if (!istTeam && !(key && hasScope(key, 'services:run'))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const seitRoh = url.searchParams.get('seit')
  const dienst = url.searchParams.get('dienst')
  const nurFertige = url.searchParams.get('nur') === 'fertig'

  const seit = seitRoh && !Number.isNaN(Date.parse(seitRoh))
    ? new Date(seitRoh)
    : new Date(Date.now() - 24 * 3600_000)

  // Der Stand wird VOR der Abfrage genommen. Andersherum entginge uns, was
  // sich waehrend der Abfrage aendert — und das faellt niemandem auf.
  const stand = new Date().toISOString()

  const rows = await db.execute(sql`
    SELECT o.id, o.service_key, o.firma, o.url, o.status, o.extern_id,
           o.fehler, o.created_at, o.updated_at, o.finished_at,
           c.name AS kunde,
           jsonb_array_length(o.run_ids) AS laeufe
    FROM service_orders o
    LEFT JOIN companies c ON c.id = o.org_id
    WHERE o.updated_at >= ${seit.toISOString()}::timestamptz
      ${dienst ? sql`AND o.service_key = ${dienst}` : sql``}
      ${nurFertige ? sql`AND o.status IN ('fertig','fehler')` : sql``}
    ORDER BY o.updated_at ASC
    LIMIT 200`)

  const auftraege = (rows as unknown as Array<Record<string, unknown>>).map((r) => ({
    auftragId: r.id,
    dienst: r.service_key,
    externId: r.extern_id,
    firma: r.firma,
    kunde: r.kunde,
    status: r.status,
    fehler: r.fehler,
    bestellt: r.created_at,
    geaendert: r.updated_at,
    fertig: r.finished_at,
    // Das Ergebnis steht bewusst nicht hier. Eine Statusliste soll klein
    // bleiben; wer ein fertiges Audit abholen will, holt es einzeln.
    abholen: r.status === 'fertig' ? `/api/services/${r.service_key}/${r.id}` : null,
  }))

  return NextResponse.json({
    ok: true,
    stand,
    seit: seit.toISOString(),
    anzahl: auftraege.length,
    auftraege,
    hinweis: auftraege.length >= 200
      ? 'Grenze erreicht — mit dem jüngsten „geaendert" als „seit" weiterblättern.'
      : undefined,
  })
}
