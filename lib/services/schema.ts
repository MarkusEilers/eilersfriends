import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

/**
 * Einstellungen je Dienst.
 *
 * Ein Dienst laeuft fuer verschiedene Kunden verschieden: andere Tiefe, andere
 * Quellen, ein anderer Ton, ein anderes Dokumentkuerzel. Das gehoert nicht in
 * den Prompt und nicht in den Code — sonst ist jede Anpassung ein Deploy.
 *
 * Zwei Ebenen, dieselbe Regel wie bei den Wissenspaketen: Ein Eintrag ohne
 * Firma gilt fuer alle, ein Eintrag mit Firma gewinnt gegen ihn. So kann ein
 * Kunde abweichen, ohne dass jemand die Grundeinstellung anfasst.
 */

let bereit = false
export async function ensureServiceSchema() {
  if (bereit) return
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS service_settings (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      service_key TEXT NOT NULL,
      org_id      UUID REFERENCES companies(id) ON DELETE CASCADE,
      settings    JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_by  UUID
    )`)
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS service_settings_unique
      ON service_settings (service_key, COALESCE(org_id, '00000000-0000-0000-0000-000000000000'::uuid))`)

  /**
   * Auftraege.
   *
   * Ein Lauf ist technisch; ein Auftrag ist das, was jemand bestellt hat. Sie
   * auseinanderzuhalten lohnt sich, weil ein Auftrag mehrere Laeufe haben kann
   * — die Recherche, das Dokument, ein Nachlauf nach einer Korrektur — und
   * weil das CRM eine Kennung braucht, die bleibt.
   */
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS service_orders (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      service_key  TEXT NOT NULL,
      org_id       UUID REFERENCES companies(id) ON DELETE SET NULL,
      firma        TEXT NOT NULL,
      url          TEXT,
      status       TEXT NOT NULL DEFAULT 'offen',
      auftrag      JSONB NOT NULL DEFAULT '{}'::jsonb,
      ergebnis     JSONB,
      fehler       TEXT,
      quelle       TEXT NOT NULL DEFAULT 'ui',
      extern_id    TEXT,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
      finished_at  TIMESTAMPTZ
    )`)
  await db.execute(sql`ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS run_ids JSONB NOT NULL DEFAULT '[]'::jsonb`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS service_orders_idx ON service_orders (service_key, created_at DESC)`)
  // Ein CRM, das einen Auftrag zweimal schickt, soll ihn nicht zweimal bezahlen.
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS service_orders_extern
      ON service_orders (service_key, extern_id) WHERE extern_id IS NOT NULL`)
  bereit = true
}

export type OrderStatus = 'offen' | 'laeuft' | 'fertig' | 'fehler' | 'abgebrochen'

export interface ServiceOrder {
  id: string
  service_key: string
  org_id: string | null
  firma: string
  url: string | null
  status: OrderStatus
  auftrag: Record<string, unknown>
  ergebnis: Record<string, unknown> | null
  fehler: string | null
  quelle: string
  extern_id: string | null
  run_ids: string[]
  created_at: string
  updated_at: string
  finished_at: string | null
}

/**
 * Die geltenden Einstellungen: Grundeinstellung, von der Firma ueberschrieben.
 *
 * Flach zusammengefuehrt und nicht tief — eine Firma, die nur den Ton aendern
 * will, soll nicht die ganze Quellenliste mitschleppen muessen.
 */
export async function settingsFor<T extends Record<string, unknown>>(
  serviceKey: string, orgId: string | null, defaults: T,
): Promise<T> {
  await ensureServiceSchema()
  const rows = (await db.execute(sql`
    SELECT org_id, settings FROM service_settings
    WHERE service_key = ${serviceKey}
      AND (org_id IS NULL OR org_id = ${orgId}::uuid)
    ORDER BY (org_id IS NOT NULL)`)) as unknown as
    Array<{ org_id: string | null; settings: Record<string, unknown> }>
  let out: Record<string, unknown> = { ...defaults }
  for (const r of rows) out = { ...out, ...(r.settings ?? {}) }
  return out as T
}

export async function saveSettings(input: {
  serviceKey: string; orgId: string | null
  settings: Record<string, unknown>; userId?: string | null
}) {
  await ensureServiceSchema()
  await db.execute(sql`
    INSERT INTO service_settings (service_key, org_id, settings, updated_by)
    VALUES (${input.serviceKey}, ${input.orgId}, ${JSON.stringify(input.settings)}::jsonb,
            ${input.userId ?? null}::uuid)
    ON CONFLICT (service_key, COALESCE(org_id, '00000000-0000-0000-0000-000000000000'::uuid))
    DO UPDATE SET settings = EXCLUDED.settings, updated_by = EXCLUDED.updated_by, updated_at = now()`)
}

export async function listOrders(serviceKey: string, limit = 50): Promise<ServiceOrder[]> {
  await ensureServiceSchema()
  const rows = await db.execute(sql`
    SELECT o.*, c.name AS org_name FROM service_orders o
    LEFT JOIN companies c ON c.id = o.org_id
    WHERE o.service_key = ${serviceKey}
    ORDER BY o.created_at DESC LIMIT ${limit}`)
  return rows as unknown as ServiceOrder[]
}

export async function createOrder(input: {
  serviceKey: string; orgId: string | null; firma: string; url?: string | null
  auftrag: Record<string, unknown>; quelle: string; externId?: string | null
}): Promise<ServiceOrder> {
  await ensureServiceSchema()
  const rows = (await db.execute(sql`
    INSERT INTO service_orders (service_key, org_id, firma, url, auftrag, quelle, extern_id)
    VALUES (${input.serviceKey}, ${input.orgId}, ${input.firma}, ${input.url ?? null},
            ${JSON.stringify(input.auftrag)}::jsonb, ${input.quelle}, ${input.externId ?? null})
    ON CONFLICT (service_key, extern_id) WHERE extern_id IS NOT NULL
    DO UPDATE SET updated_at = now()
    RETURNING *`)) as unknown as ServiceOrder[]
  return rows[0]
}

export async function updateOrder(id: string, patch: {
  status?: OrderStatus; ergebnis?: unknown; fehler?: string | null; runId?: string
}) {
  await ensureServiceSchema()
  if (patch.runId) {
    await db.execute(sql`
      UPDATE service_orders SET run_ids = run_ids || ${JSON.stringify([patch.runId])}::jsonb,
        updated_at = now() WHERE id = ${id}`)
  }
  if (patch.status || patch.ergebnis !== undefined || patch.fehler !== undefined) {
    await db.execute(sql`
      UPDATE service_orders SET
        status = COALESCE(${patch.status ?? null}, status),
        ergebnis = COALESCE(${patch.ergebnis === undefined ? null : JSON.stringify(patch.ergebnis)}::jsonb, ergebnis),
        fehler = ${patch.fehler ?? null},
        finished_at = CASE WHEN ${patch.status ?? null} IN ('fertig','fehler','abgebrochen')
                           THEN now() ELSE finished_at END,
        updated_at = now()
      WHERE id = ${id}`)
  }
}
