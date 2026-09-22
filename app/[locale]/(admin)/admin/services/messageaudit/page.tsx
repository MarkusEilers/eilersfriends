import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { Radar } from 'lucide-react'
import { listOrders, settingsFor, ensureServiceSchema } from '@/lib/services/schema'
import {
  AUDIT_DEFAULTS, QUELLEN, DIMENSIONEN, schaetzung, type AuditSettings,
} from '@/lib/services/messaging-audit'
import { AuditSettingsForm } from '@/components/admin/AuditSettingsForm'
import { AuditOrders } from '@/components/admin/AuditOrders'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default async function MessageAuditPage() {
  await ensureServiceSchema()
  const session = await auth()
  const istAdmin = session?.user?.role === 'admin'

  const [orders, settings, orgs, preise] = await Promise.all([
    listOrders('messaging-audit', 50),
    settingsFor<AuditSettings>('messaging-audit', null, AUDIT_DEFAULTS),
    istAdmin
      ? db.execute(sql`SELECT id, name FROM companies ORDER BY name LIMIT 200`)
      : Promise.resolve([] as never),
    db.execute(sql`
      SELECT DISTINCT ON (unit) unit, price_eur::float8 AS price_eur
      FROM ai_unit_prices WHERE valid_from <= current_date
      ORDER BY unit, valid_from DESC`).catch(() => [] as never),
  ])

  const s = schaetzung(settings)
  const p = Object.fromEntries(
    (preise as unknown as Array<{ unit: string; price_eur: number }>).map((x) => [x.unit, x.price_eur]))
  const kosten = s.suchen * (p.web_search ?? 0) + s.bilder * (p.bild ?? 0)

  return (
    <div>
      <div className="mb-6">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-blue-600">
          <Radar size={12} /> Dienst
        </span>
        <h1 className="mt-1.5 text-2xl font-bold text-gray-900">Messaging-Audit</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Recherche über sieben Quellenklassen, Bewertung gegen die Rubrik, zwei Berichte —
          interne Fassung und Kundenfassung. Die Broschüre entsteht daraus in einem zweiten Schritt.
        </p>
      </div>

      <AuditOrders orders={orders as never} />

      <div className="mt-10">
        <h2 className="text-lg font-bold text-gray-900">Einstellungen</h2>
        <p className="mt-1 text-sm text-gray-500">
          Gelten für alle Aufträge, solange kein Kunde eine eigene Fassung hat.
          Ein Auftrag aus dem CRM kann einzelne Werte für sich überschreiben.
        </p>
        <AuditSettingsForm
          settings={settings}
          quellen={QUELLEN}
          dimensionen={DIMENSIONEN}
          orgs={(orgs as unknown as Array<{ id: string; name: string }>) ?? []}
          schaetzung={{ ...s, kostenEur: kosten }}
        />
      </div>
    </div>
  )
}
