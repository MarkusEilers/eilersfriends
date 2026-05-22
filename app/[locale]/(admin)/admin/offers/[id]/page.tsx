import Link from 'next/link'
import { notFound } from 'next/navigation'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import type { OfferRow } from '@/lib/db/queries/offers'
import { ArrowLeft, Copy, ExternalLink } from 'lucide-react'

export default async function AdminOfferEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const res = await db.execute<OfferRow>(sql`SELECT * FROM offers WHERE id = ${id} LIMIT 1`)
  const offer = res.rows[0]
  if (!offer) notFound()

  const publicUrl = `/offer/${offer.access_salt}`

  return (
    <div>
      <Link href="/admin/offers" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={14} /> Alle Angebote
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-gray-400">{offer.offer_number}</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{offer.title}</h1>
          <p className="mt-1 text-sm text-gray-600">
            {offer.customer_name}{offer.customer_company ? ` · ${offer.customer_company}` : ''}
            {offer.customer_email ? ` · ${offer.customer_email}` : ''}
          </p>
        </div>
        <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest" style={{ backgroundColor: '#F3F4F6', color: '#4B5563' }}>
          {offer.status}
        </span>
      </div>

      {/* Public-link toolbar */}
      <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Öffentlicher Link für den Kunden</p>
        <div className="flex items-center gap-2 flex-wrap">
          <code className="flex-1 min-w-0 truncate rounded-lg bg-white px-3 py-2 text-xs font-mono text-gray-700 border border-gray-200">
            {publicUrl}
          </code>
          <a href={publicUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100">
            <ExternalLink size={12} /> Öffnen
          </a>
        </div>
        <p className="mt-2 text-[11px] text-gray-500">
          Nur dieser Link gibt Zugriff. Beim Senden wird der Status automatisch auf <strong>sent</strong> gesetzt.
        </p>
      </div>

      {/* Placeholder editor — full block-by-block editor folgt in der nächsten Session */}
      <div className="mt-8 rounded-3xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
        <p className="text-base font-semibold text-gray-700">Offer-Editor — Wave 2 Phase 2</p>
        <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
          Block-Editor mit Programmen, Phasen, Building-Blocks, Sweat-Equity, Timeline und AI-Suggest kommt im nächsten Schritt.
          Aktuell kannst Du das Angebot vorab teilen und der Kunde sieht den Stub auf <code className="font-mono">{publicUrl}</code>.
        </p>
      </div>
    </div>
  )
}
