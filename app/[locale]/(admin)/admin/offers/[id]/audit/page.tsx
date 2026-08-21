import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ShieldCheck, ShieldAlert, FileDown, Fingerprint } from 'lucide-react'
import { getOfferById } from '@/lib/db/queries/offers'
import { listAudit, verifyChain, listArchives } from '@/lib/offer/audit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const LABEL: Record<string, string> = {
  invited: 'Link versendet', opened: 'Angebot geöffnet', submitted: 'Unterschrift abgeschickt',
  signed: 'Unterschrift bestätigt', finalized: 'Angebot angenommen',
}

export default async function OfferAuditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const offer = await getOfferById(id)
  if (!offer) notFound()

  const [audit, chain, archives] = await Promise.all([
    listAudit(id), verifyChain(id), listArchives(id),
  ])

  return (
    <div className="space-y-6">
      <Link href={`/admin/offers/${id}` as '/'} className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-700">
        <ArrowLeft size={13} /> Zurück zum Angebot
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Beweiskette</h1>
        <p className="mt-1 text-sm text-gray-500">{offer.offer_number} · {offer.customer_company || offer.customer_name}</p>
      </div>

      {/* Prüfergebnis */}
      <div className="flex items-center gap-4 rounded-2xl border p-5"
        style={chain.ok
          ? { borderColor: '#ABEFC6', backgroundColor: '#F6FEF9' }
          : { borderColor: '#FECDCA', backgroundColor: '#FEF3F2' }}>
        {chain.ok
          ? <ShieldCheck size={26} style={{ color: '#067647' }} />
          : <ShieldAlert size={26} style={{ color: '#B42318' }} />}
        <div className="min-w-0">
          <p className="text-sm font-bold" style={{ color: chain.ok ? '#067647' : '#B42318' }}>
            {chain.ok ? 'Kette unversehrt' : `Kette gebrochen ab Eintrag #${chain.brokenAt}`}
          </p>
          <p className="text-xs text-gray-500">
            {chain.entries} Einträge geprüft{chain.head ? ` · Kopf ${chain.head.slice(0, 24)}…` : ''}
          </p>
        </div>
      </div>

      {/* Archiv */}
      {archives.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-bold text-gray-900">Archiv</h2>
          <div className="mt-3 space-y-2">
            {archives.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <Fingerprint size={15} className="flex-shrink-0 text-gray-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-gray-800">
                    {a.kind === 'signed_pdf' ? 'Abschluss-PDF' : 'Inhalts-Snapshot'} · {new Date(a.created_at).toLocaleString('de-DE')}
                  </p>
                  <code className="block truncate text-[10px] text-gray-400">SHA-256 {a.sha256}</code>
                </div>
                {a.url && (
                  <a href={a.url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: '#1A5FD4' }}>
                    <FileDown size={13} /> PDF
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ereignisse */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-bold text-gray-900">Ereignisse</h2>
        {audit.length === 0 && <p className="mt-2 text-xs text-gray-400">Noch keine Ereignisse — sie entstehen, sobald Signing-Links verschickt werden.</p>}
        <ol className="mt-4 space-y-4">
          {audit.map((a) => (
            <li key={a.seq} className="flex gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-gray-500">{a.seq}</span>
              <div className="min-w-0 flex-1 border-b border-gray-100 pb-3">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <p className="text-sm font-bold text-gray-900">{LABEL[a.event] ?? a.event}</p>
                  <span className="text-xs text-gray-400">{new Date(a.occurred_at).toLocaleString('de-DE')}</span>
                </div>
                <p className="mt-0.5 text-xs text-gray-500">
                  {[a.actor_name, a.actor_email].filter(Boolean).join(' · ')}{a.ip ? ` · IP ${a.ip}` : ''}
                </p>
                <code className="mt-1 block truncate text-[10px] text-gray-400">{a.entry_hash}</code>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <p className="text-xs text-gray-400">
        Einfache elektronische Signatur mit Beweiskette. Kein qualifiziertes Zertifikat nach eIDAS —
        für die meisten B2B-Verträge ausreichend, für formgebundene Geschäfte nicht.
      </p>
    </div>
  )
}
