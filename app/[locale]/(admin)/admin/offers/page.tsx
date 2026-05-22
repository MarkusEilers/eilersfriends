import Link from 'next/link'
import { listOffersForAdmin } from '@/lib/db/queries/offers'
import { createOfferAction } from '@/lib/actions/offers'
import { FileText, ExternalLink, Plus } from 'lucide-react'

export default async function AdminOffersPage() {
  const offers = await listOffersForAdmin()

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Angebote</h1>
          <p className="mt-2 text-sm text-gray-600">
            Interaktive Angebote für Kunden — versendbar per geheimem Link, signierbar, Stripe-bezahlbar.
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700" style={{ border: '1px solid #BBCFF5' }}>
          {offers.length} {offers.length === 1 ? 'Angebot' : 'Angebote'}
        </span>
      </div>

      {/* Quick-create form */}
      <section className="mb-10 rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-gray-500">
          Neues Angebot erstellen
        </h2>
        <form action={createOfferAction} className="grid grid-cols-12 gap-3 items-end">
          <div className="col-span-3">
            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Kunde</label>
            <input name="customerName" required placeholder="ACME GmbH" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
          </div>
          <div className="col-span-3">
            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Firma (optional)</label>
            <input name="customerCompany" placeholder="ACME Holding AG" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
          </div>
          <div className="col-span-3">
            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">E-Mail (optional)</label>
            <input name="customerEmail" type="email" placeholder="kontakt@acme.com" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
          </div>
          <div className="col-span-3">
            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Titel</label>
            <input name="title" required placeholder="SalesMade Academy für ACME" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
          </div>
          <div className="col-span-12">
            <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
              <Plus size={14} /> Angebot anlegen
            </button>
          </div>
        </form>
      </section>

      {/* Existing offers */}
      <section>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-gray-500">
          Alle Angebote
        </h2>
        {offers.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center text-gray-400">
            Noch keine Angebote. Erstelle das erste über das Formular oben.
          </div>
        ) : (
          <div className="space-y-3">
            {offers.map((o) => {
              const tone =
                o.status === 'paid'   ? { bg: '#ECFDF5', fg: '#047857' } :
                o.status === 'signed' ? { bg: '#EFF6FF', fg: '#1D4ED8' } :
                o.status === 'sent'   ? { bg: '#FFF7ED', fg: '#C2410C' } :
                o.status === 'viewed' ? { bg: '#FEF9C3', fg: '#A16207' } :
                                        { bg: '#F3F4F6', fg: '#4B5563' }
              return (
                <Link
                  key={o.id}
                  href={`/admin/offers/${o.id}` as '/'}
                  className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-sm"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: '#EBF1FF', color: '#1A5FD4' }}>
                    <FileText size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900 truncate">{o.title}</span>
                      <span className="text-xs text-gray-400 font-mono">{o.offer_number}</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500 truncate">
                      {o.customer_name}{o.customer_company ? ` · ${o.customer_company}` : ''}
                      {o.customer_email ? ` · ${o.customer_email}` : ''}
                    </div>
                  </div>
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                    style={{ backgroundColor: tone.bg, color: tone.fg }}>
                    {o.status}
                  </span>
                  <a
                    href={`/offer/${o.access_salt}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                    title="Öffentlicher Link"
                  >
                    <ExternalLink size={12} /> Link
                  </a>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
