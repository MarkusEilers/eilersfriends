import { NextResponse } from 'next/server'
import { after } from 'next/server'
import { auth } from '@/lib/auth'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { verifyApiKey, hasScope } from '@/lib/events/auth'
import { createOrder, listOrders, settingsFor, updateOrder } from '@/lib/services/schema'
import { AUDIT_DEFAULTS, type AuditSettings } from '@/lib/services/messaging-audit'
import { activeAgent, startRun } from '@/lib/agents/run'
import { stosseAn } from '@/lib/services/antrieb'

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
    return { kind: 'ui' as const, userId: s.user.id ?? null }
  }
  const key = await verifyApiKey(req.headers.get('authorization'))
  if (key && hasScope(key, 'services:run')) return { kind: 'crm' as const, userId: null }
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
  const { service } = await params
  const dienst = DIENSTE[service]
  if (!dienst) return NextResponse.json({ error: `Unbekannter Dienst "${service}"` }, { status: 404 })

  const ctx = await wer(req)
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = (await req.json().catch(() => ({}))) as {
    firma?: string; url?: string; orgId?: string
    externId?: string; hinweis?: string
    einstellungen?: Partial<AuditSettings>
  }
  if (!body.firma && !body.url) {
    return NextResponse.json({ error: 'firma oder url ist Pflicht' }, { status: 400 })
  }
  const firma = body.firma ?? String(body.url).replace(/^https?:\/\//, '').split('/')[0]
  const orgId = body.orgId ?? await firmaFinden(firma, body.url ?? null)

  // Geltende Einstellungen: Grundeinstellung, Kundeneinstellung, und was der
  // Aufrufer fuer diesen einen Auftrag mitschickt.
  const gespeichert = await settingsFor(service, orgId, dienst.defaults)
  const einstellungen = { ...gespeichert, ...(body.einstellungen ?? {}) }

  const order = await createOrder({
    serviceKey: service, orgId, firma, url: body.url ?? null,
    auftrag: { hinweis: body.hinweis ?? null, einstellungen },
    quelle: ctx.kind, externId: body.externId ?? null,
  })

  const agent = await activeAgent(dienst.agent)
  if (!agent) {
    await updateOrder(order.id, {
      status: 'fehler',
      fehler: `Kein aktiver Agent "${dienst.agent}" — der Auftrag ist angelegt und kann nachlaufen, `
        + 'sobald er bestueckt ist.',
    })
    return NextResponse.json({
      ok: false, auftragId: order.id, status: 'fehler',
      error: `Kein aktiver Agent "${dienst.agent}"`,
    }, { status: 503 })
  }

  const run = await startRun({
    agentKey: dienst.agent,
    input: { firma, url: body.url ?? null, hinweis: body.hinweis ?? null, einstellungen },
    orgId, productId: null, userId: ctx.userId, via: ctx.kind,
  })
  await updateOrder(order.id, { status: 'laeuft', runId: run.id })

  /**
   * Ab hier ist es unsere Sache.
   *
   * Der Besteller hat einmal bestellt — er soll nicht nachfassen muessen,
   * damit etwas passiert. Der Antrieb schiebt den Auftrag von selbst weiter,
   * Durchgang fuer Durchgang, bis er fertig ist.
   *
   * Deshalb antworten wir sofort und stossen erst danach an: Wer auf das
   * Ergebnis wartet, wartet Minuten bis Stunden und verliert unterwegs die
   * Verbindung.
   */
  after(() => stosseAn())

  return NextResponse.json({
    ok: true,
    auftragId: order.id,
    laufId: run.id,
    status: 'laeuft',
    abfragen: `/api/services/${service}/${order.id}`,
    hinweis: 'Der Auftrag läuft von selbst weiter. Abfragen ist möglich, aber nicht nötig.',
  }, { status: 202 })
}

export async function GET(req: Request, { params }: { params: Promise<{ service: string }> }) {
  const { service } = await params
  const ctx = await wer(req)
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  return NextResponse.json({ ok: true, auftraege: await listOrders(service, 50) })
}
