import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { Radar } from 'lucide-react'
import { LeadRadar } from '@/components/leadradar/LeadRadar'
import { ensureLeadRadarSchema } from '@/lib/leadradar/schema'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default async function LeadRadarPage({
  searchParams,
}: { searchParams: Promise<{ company?: string }> }) {
  const sp = await searchParams
  await ensureLeadRadarSchema()

  // Der Kunde, dessen Radar laeuft. Ohne Angabe der mit den meisten Signalen —
  // in der Regel genau der, den man sehen will.
  const rows = (await db.execute(sql`
    SELECT c.id, c.name, COUNT(l.id)::int AS leads
    FROM companies c LEFT JOIN lead_radar l ON l.company_id = c.id
    ${sp.company ? sql`WHERE c.id = ${sp.company}::uuid` : sql``}
    GROUP BY c.id, c.name
    ORDER BY leads DESC, c.name
    LIMIT 1`)) as unknown as Array<{ id: string; name: string; leads: number }>
  const company = rows[0]

  if (!company) {
    return <div className="p-8 text-sm text-gray-500">Kein Kunde gefunden.</div>
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-emerald-600">
            <Radar size={12} /> Lead-Radar
          </span>
          <h1 className="mt-1.5 text-2xl font-bold text-gray-900 sm:text-3xl">{company.name}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Signale aus Stellenanzeigen, Registerdaten, Zuschlägen, Audits und Bewertungen im deutschsprachigen Raum.
          </p>
        </div>
      </div>
      <LeadRadar companyId={company.id} companyName={company.name} />
    </div>
  )
}
