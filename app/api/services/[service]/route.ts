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
    return { kind: 'ui' as const, userId: s.user.id ?? null, orgId: null, frei: true }
  }
  const key = await verifyApiKey(req.headers.get('authorization'))
  if (key && hasScope(key, 'services:run')) {
    // Ein interner Schluessel darf fuer jede Firma bestellen. Einer mit Firma
    // bestellt nur fuer sie, egal was im Rumpf steht — sonst ginge die
    // Rechnung an den Falschen.
    return { kind: 'crm' as const, userId: null, orgId: key.orgId, frei: key.intern === true }
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
  const { service } = await params
  const dienst = DIENSTE[service]
  if (!dienst) return NextResponse.json({ error: `Unbekannter Dienst "${service}"` }, { status: 404 })

  const ctx = await wer(req)
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = (await req.json().catch(() => ({}))) as {
    firma?: string; url?: string; orgId?: string
    externId?: string; hinweis?: string
    einstellungen?: Partial<AuditSettings>
    /**
     * Was das CRM schon weiss.
     *
     * Ein Audit, das die Branche erst recherchiert, obwohl sie im Lead-Satz
     * steht, verbrennt Suchanfragen fuer eine Antwort, die schon vorlag. Alles
     * hier ist freiwillig — was fehlt, wird recherchiert.
     *
     * Wichtig und im Agenten hart hinterlegt: Diese Angaben stuetzen das
     * Urteil, erscheinen aber nie in der Kundenfassung. Ein Kunde, der in
     * seinem Audit einen Satz aus unserem CRM wiederfindet, ist kein Kunde
     * mehr.
     */
    crm?: {
      branche?: string
      groesse?: string
      umsatz?: string
      ansprechpartner?: string
      rolle?: string
      deal_stand?: string
      lead_quelle?: string
      notizen?: string
      gespraeche?: string[]
      wettbewerber?: string[]
      [k: string]: unknown
    }
    /**
     * Was schon da ist.
     *
     * Im CRM liegt oft mehr als ein Lead-Satz: ein frueherer Audit, eine
     * Gespraechsnotiz, ein Angebot, eine Website-Analyse, ein Transkript.
     * Das alles nochmal zu recherchieren kostet Suchanfragen fuer Antworten,
     * die schon vorliegen — und liefert schlechtere, weil ein Transkript
     * Dinge enthaelt, die keine Website hergibt.
     *
     * `deckt` ist der wichtige Teil: Steht dort eine Quellenklasse, ueberspringt
     * die Recherche sie. Wer ein halbes Jahr altes Audit mitschickt, will nicht,
     * dass die Website nochmal von vorne gelesen wird.
     */
    vorhandenes?: Array<{
      titel: string
      inhalt?: string
      url?: string
      art?: 'audit' | 'notiz' | 'transkript' | 'angebot' | 'analyse' | 'sonstiges'
      stand?: string
      deckt?: string[]
    }>
  }
  if (!body.firma && !body.url) {
    return NextResponse.json({ error: 'firma oder url ist Pflicht' }, { status: 400 })
  }
  const firma = body.firma ?? String(body.url).replace(/^https?:\/\//, '').split('/')[0]
  // Ein gebundener Schluessel bestellt fuer seine Firma. Was im Rumpf steht,
  // waere sonst eine Einladung, fuer jemand anderen zu bestellen — und die
  // Rechnung ginge an den Falschen.
  const orgId = ctx.frei
    ? (body.orgId ?? await firmaFinden(firma, body.url ?? null))
    : ctx.orgId

  // Geltende Einstellungen: Grundeinstellung, Kundeneinstellung, und was der
  // Aufrufer fuer diesen einen Auftrag mitschickt.
  const gespeichert = await settingsFor(service, orgId, dienst.defaults)
  const einstellungen = { ...gespeichert, ...(body.einstellungen ?? {}) }

  const crm = body.crm ?? null
  const vorhandenes = (body.vorhandenes ?? []).filter((v) => v?.titel && (v.inhalt || v.url))
  const order = await createOrder({
    serviceKey: service, orgId, firma, url: body.url ?? null,
    auftrag: { hinweis: body.hinweis ?? null, einstellungen, crm, vorhandenes },
    quelle: ctx.kind, externId: body.externId ?? null,
  })

  // Was das CRM mitbringt, gehoert auch an die Firma — dann steht es beim
  // naechsten Auftrag schon da, ohne dass jemand es nochmal schickt.
  if (orgId && crm && (crm.branche || crm.groesse)) {
    await db.execute(sql`
      UPDATE companies SET
        industry = COALESCE(NULLIF(${crm.branche ?? null}::text, ''), industry),
        size = COALESCE(NULLIF(${crm.groesse ?? null}::text, ''), size),
        updated_at = now()
      WHERE id = ${orgId}::uuid`).catch(() => {})
  }

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
