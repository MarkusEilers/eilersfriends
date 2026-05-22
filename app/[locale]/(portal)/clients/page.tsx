import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { listOffersForUser } from '@/lib/db/queries/offers'
import { FileText, ExternalLink } from 'lucide-react'

export default async function ClientsDashboard() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const offers = await listOffersForUser(session.user.id)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dein Kundenbereich</h1>
      <p className="mt-2 text-sm text-gray-600">
        Hier findest Du Deine Angebote, Verträge und Rechnungen — alles an einem Ort.
      </p>

      <section className="mt-8">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-gray-500">
          Deine Angebote
        </h2>

        {offers.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
            <p className="text-base font-semibold text-gray-700">Noch keine Angebote.</p>
            <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
              Wenn Markus oder Aljona Dir ein interaktives Angebot schicken, taucht es automatisch hier auf.
            </p>
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
                  href={`/offer/${o.access_salt}` as '/'}
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
                      Gültig bis {new Date(o.valid_until).toLocaleDateString('de-DE')}
                    </div>
                  </div>
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest" style={{ backgroundColor: tone.bg, color: tone.fg }}>
                    {o.status}
                  </span>
                  <ExternalLink size={14} className="text-gray-400 flex-shrink-0" />
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
