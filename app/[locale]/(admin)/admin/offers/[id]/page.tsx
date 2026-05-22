import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getOfferById } from '@/lib/db/queries/offers'
import { OfferEditor, type OfferEditorState } from '@/components/admin/OfferEditor'
import { ArrowLeft, ExternalLink } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface JsonRow {
  understanding_section: unknown
  empathy_section: unknown
  economic_results: unknown
  programs: unknown
}

export default async function AdminOfferEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const offer = await getOfferById(id) as (Awaited<ReturnType<typeof getOfferById>> & JsonRow) | null
  if (!offer) notFound()

  const publicUrl = `/offer/${offer.access_salt}`

  const initial: OfferEditorState = {
    id: offer.id,
    title: offer.title,
    subtitle: offer.subtitle ?? '',
    tagline: offer.tagline ?? '',
    customerName: offer.customer_name,
    customerCompany: offer.customer_company ?? '',
    customerEmail: offer.customer_email ?? '',
    understanding: (offer.understanding_section as OfferEditorState['understanding']) ?? {},
    empathy: (offer.empathy_section as OfferEditorState['empathy']) ?? {},
    economic: (offer.economic_results as OfferEditorState['economic']) ?? [],
    programs: (offer.programs as OfferEditorState['programs']) ?? [],
    status: offer.status,
  }

  return (
    <div>
      <Link href="/admin/offers" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={14} /> Alle Angebote
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-gray-400">{offer.offer_number}</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{offer.title}</h1>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Öffentlicher Link für den Kunden</p>
        <div className="flex items-center gap-2 flex-wrap">
          <code className="flex-1 min-w-0 truncate rounded-lg bg-white px-3 py-2 text-xs font-mono text-gray-700 border border-gray-200">{publicUrl}</code>
          <a href={publicUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100">
            <ExternalLink size={12} /> Vorschau
          </a>
        </div>
      </div>

      <div className="mt-8">
        <OfferEditor initial={initial} />
      </div>
    </div>
  )
}
