import { NextResponse } from 'next/server'
import { after } from 'next/server'
import { auth } from '@/lib/auth'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { verifyApiKey, hasScope } from '@/lib/events/auth'
import {
  createOrder, listOrders, settingsFor, updateOrder, logCall, finishCall,
} from '@/lib/services/schema'
import { AUDIT_DEFAULTS, type AuditSettings } from '@/lib/services/messaging-audit'
import { activeAgent, startRun } from '@/lib/agents/run'
import { kick } from '@/lib/services/driver'

export const runtime = 'nodejs'
export const maxDuration = 300

/**
 * Der Eingang fuer Dienste.
 *
 * Ein CRM bestellt hier einen Auftrag und bekommt sofort eine Kennung zurueck —
 * nicht das Ergebnis. Ein Audit braucht Minuten bis Stunden; eine Verbindung
 * so lange offenzuhalten ist der sicherste Weg, beides zu verlieren.
 *
 * Danach fragt der Aufrufer nach, oder er hinterlegt eine Rueckrufadresse.
 */

const DIENSTE: Record<string, { agent: string; defaults: Record<string, unknown> }> = {
  'messaging-audit': { agent: 'messaging-audit', defaults: AUDIT_DEFAULTS },
}

async function wer(req: Request) {
  const s = await auth()
  if (s?.user?.role === 'admin' || s?.user?.role === 'coach') {
    return {
      kind: 'ui' as const, userId: s.user.id ?? null, orgId: null, frei: true,
      keyId: null as string | null, keyName: null as string | null,
    }
  }
  const key = await verifyApiKey(req.headers.get('authorization'))
  if (key && hasScope(key, 'services:run')) {
    // Ein interner Schluessel darf fuer jede Firma bestellen. Einer mit Firma
    // bestellt nur fuer sie, egal was im Rumpf steht — sonst ginge die
    // Rechnung an den Falschen.
    return {
      kind: 'crm' as const, userId: null, orgId: key.orgId, frei: key.intern === true,
      keyId: key.id as string | null, keyName: key.name as string | null,
    }
  }
  return null
}

/** Firma finden oder anlegen — ein Audit ohne Firma waere ein Bericht ohne Adressat. */
async function firmaFinden(name: string, url: string | null): Promise<string | null> {
  const domain = url ? url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] : null
  const rows = (await db.execute(sql`
    SELECT id FROM companies
    WHERE (${domain}::text IS NOT NULL AND domain = ${domain})
       OR lower(name) = lower(${name})
    LIMIT 1`)) as unknown as Array<{ id: string }>
  if (rows[0]) return rows[0].id
  const neu = (await db.execute(sql`
    INSERT INTO companies (name, domain, website) VALUES (${name}, ${domain}, ${url})
    RETURNING id`)) as unknown as Array<{ id: string }>
  return neu[0]?.id ?? null
}

export async function POST(req: Request, { params }: { params: Promise<{ service: string }> }) {
  const begonnen = Date.now()
  const { service } = await params
  const dienst = DIENSTE[service]

  const roh = (await req.json().catch(() => ({}))) as Record<string, unknown>

  /**
   * Erst schreiben, dass jemand angeklopft hat. Dann pruefen.
   *
   * Die Reihenfolge ist der ganze Punkt: Am 23.09. kam eine Bestellung an, die
   * Route starb zwischen Firma-Anlegen und Auftrag-Anlegen, und danach gab es
   * keine einzige Zeile, die das bezeugt haette. Ein Protokoll, das erst
   * geschrieben wird, wenn alles gutgegangen ist, protokolliert nichts.
   */
  const callId = await logCall({
    serviceKey: service,
    firma: typeof roh.firma === 'string' ? roh.firma : null,
    externId: typeof roh.externId === 'string' ? roh.externId : null,
    rumpf: roh,
  })
  /**
   * Wer es war, steht erst nach der Auth fest — also wird es nachgetragen.
   * Ohne Name im Protokoll ist bei drei Schluesseln nicht zu klaeren, welches
   * System angeklopft hat.
   */
  let wesen: { keyId: string | null; keyName: string | null; orgId: string | null } =
    { keyId: null, keyName: null, orgId: null }
  const abschluss = async (status: number, patch: { orderId?: string | null; fehler?: string | null } = {}) => {
    await finishCall(callId, { status, dauerMs: Date.now() - begonnen, ...wesen, ...patch })
  }

  if (!dienst) {
    await abschluss(404, { fehler: `Unbekannter Dienst "${service}"` })
    return NextResponse.json({ error: `Unbekannter Dienst "${service}"` }, { status: 404 })
  }

  const ctx = await wer(req)
  if (!ctx) {
    await abschluss(401, { fehler: 'unauthorized' })
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  wesen = { keyId: ctx.keyId, keyName: ctx.keyName, orgId: ctx.orgId }

  const body = roh as {
    firma?: string; url?: string; orgId?: string
    externId?: string; hinweis?: string; test?: boolean
    einstellungen?: Partial<AuditSettings>
    crm?: Record<string, unknown>
    vorhandenes?: Array<{
      titel: string; inhalt?: string; url?: string
      art?: 'audit' | 'notiz' | 'transkript' | 'angebot' | 'analyse' | 'sonstiges'
      stand?: string; deckt?: string[]
    }>
  }
  if (!body.firma && !body.url) {
    await abschluss(400, { fehler: 'firma oder url ist Pflicht' })
    return NextResponse.json({ error: 'firma oder url ist Pflicht' }, { status: 400 })
  }
  const firma = body.firma ?? String(body.url).replace(/^https?:\/\//, '').split('/')[0]

  /**
   * Der Auftrag entsteht jetzt — vor allem anderen.
   *
   * Vorher stand er am Ende einer Kette aus Firma suchen, Einstellungen laden,
   * Agent pruefen, Lauf starten. Jeder dieser Schritte konnte werfen, und dann
   * gab es nichts, in das der Fehler haette geschrieben werden koennen. Jetzt
   * ist die Reihenfolge umgedreht: erst die Zeile, dann die Arbeit. Was
   * schiefgeht, landet sichtbar in derselben Zeile.
   *
   * `org_id` bleibt zunaechst leer. Sie zu ermitteln ist selbst ein Schritt,
   * der scheitern kann — und ein Auftrag ohne Firmenzuordnung ist immer noch
   * besser als kein Auftrag.
   */
  let order
  try {
    order = await createOrder({
      serviceKey: service, orgId: null, firma, url: body.url ?? null,
      auftrag: { hinweis: body.hinweis ?? null, roh: true },
      quelle: body.test === true ? 'test' : ctx.kind,
      externId: body.externId ?? null,
    })
  } catch (e) {
    const text = e instanceof Error ? e.message : String(e)
    await abschluss(500, { fehler: `Auftrag konnte nicht angelegt werden: ${text}` })
    return NextResponse.json({ error: 'Auftrag konnte nicht angelegt werden', detail: text }, { status: 500 })
  }

  try {
    // Ein gebundener Schluessel bestellt fuer seine Firma. Was im Rumpf steht,
    // waere sonst eine Einladung, fuer jemand anderen zu bestellen — und die
    // Rechnung ginge an den Falschen.
    const orgId = ctx.frei
      ? (body.orgId ?? await firmaFinden(firma, body.url ?? null))
      : ctx.orgId

    const gespeichert = await settingsFor(service, orgId, dienst.defaults)
    const einstellungen = { ...gespeichert, ...(body.einstellungen ?? {}) }

    const crm = body.crm ?? null
    const vorhandenes = (body.vorhandenes ?? []).filter((v) => v?.titel && (v.inhalt || v.url))

    await updateOrder(order.id, {
      orgId,
      auftrag: { hinweis: body.hinweis ?? null, einstellungen, crm, vorhandenes },
    })

    // Was das CRM mitbringt, gehoert auch an die Firma — dann steht es beim
    // naechsten Auftrag schon da, ohne dass jemand es nochmal schickt.
    if (orgId && crm && (crm.branche || crm.groesse)) {
      await db.execute(sql`
        UPDATE companies SET
          industry = COALESCE(NULLIF(${(crm.branche as string) ?? null}::text, ''), industry),
          size = COALESCE(NULLIF(${(crm.groesse as string) ?? null}::text, ''), size),
          updated_at = now()
        WHERE id = ${orgId}::uuid`).catch(() => {})
    }

    const agent = await activeAgent(dienst.agent)
    if (!agent) {
      const text = `Kein aktiver Agent "${dienst.agent}" — der Auftrag ist angelegt und kann `
        + 'nachlaufen, sobald er bestueckt ist.'
      await updateOrder(order.id, { status: 'fehler', fehler: text })
      await abschluss(503, { orderId: order.id, fehler: text })
      return NextResponse.json({
        ok: false, auftragId: order.id, status: 'fehler', error: text,
      }, { status: 503 })
    }

    const run = await startRun({
      agentKey: dienst.agent,
      input: { firma, url: body.url ?? null, hinweis: body.hinweis ?? null, einstellungen, crm, vorhandenes },
      orgId, productId: null, userId: ctx.userId, via: ctx.kind,
    })
    await updateOrder(order.id, { status: 'laeuft', runId: run.id })

    /**
     * Ab hier ist es unsere Sache.
     *
     * Der Besteller hat einmal bestellt — er soll nicht nachfassen muessen,
     * damit etwas passiert. Der Antrieb schiebt den Auftrag von selbst weiter,
     * Durchgang fuer Durchgang, bis er fertig ist.
     */
    after(() => kick())

    await abschluss(202, { orderId: order.id })
    return NextResponse.json({
      ok: true,
      auftragId: order.id,
      laufId: run.id,
      status: 'laeuft',
      abfragen: `/api/services/${service}/${order.id}`,
      hinweis: 'Der Auftrag läuft von selbst weiter. Abfragen ist möglich, aber nicht nötig.',
    }, { status: 202 })
  } catch (e) {
    /**
     * Was hier ankommt, ist ein Absturz nach der Bestellung.
     *
     * Er gehoert in den Auftrag, nicht ins Nichts: Der Besteller bekommt eine
     * Kennung, unter der er nachsehen kann, und wir sehen auf der Dienstseite,
     * dass etwas liegengeblieben ist — statt es Wochen spaeter aus der
     * Firmentabelle zu rekonstruieren.
     */
    const text = e instanceof Error ? `${e.message}\n${e.stack ?? ''}` : String(e)
    console.error(`[services/${service}] Auftrag ${order.id} abgestuerzt:`, e)
    await updateOrder(order.id, { status: 'fehler', fehler: text.slice(0, 4000) })
    await abschluss(500, { orderId: order.id, fehler: text.slice(0, 2000) })
    return NextResponse.json({
      ok: false, auftragId: order.id, status: 'fehler',
      error: 'Der Auftrag ist angelegt, die Vorbereitung ist gescheitert.',
      detail: e instanceof Error ? e.message : String(e),
    }, { status: 500 })
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ service: string }> }) {
  const { service } = await params
  const ctx = await wer(req)
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  return NextResponse.json({ ok: true, auftraege: await listOrders(service, 50) })
}
