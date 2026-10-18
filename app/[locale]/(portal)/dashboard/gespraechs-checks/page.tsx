import Link from 'next/link'
import { redirect } from 'next/navigation'
import { MessagesSquare, ArrowRight, FileText } from 'lucide-react'
import { auth } from '@/lib/auth'
import { listChecks, quotaFor } from '@/lib/call-check/store'
import { workDomain } from '@/lib/util/email'

export const dynamic = 'force-dynamic'

const OUTCOME: Record<string, string> = {
  won: 'Auftrag', follow_up: 'Folgetermin', offer_requested: 'Angebot angefragt', nothing: 'Nichts passiert', lost: 'Abgesagt',
}

/** All calls this person has had checked — with result, transcript and the company's quota. */
export default async function MyCallChecksPage({ params, searchParams }: {
  params: Promise<{ locale: string }>; searchParams?: Promise<{ domain?: string }>
}) {
  const { locale } = await params
  const session = await auth()
  if (!session?.user?.email) redirect('/auth/login')
  const isEf = session.user.role === 'admin' || session.user.role === 'coach'
  const sp = (await searchParams) ?? {}
  // Eilers+Friends can look at a whole company (?domain=…) for quality assurance.
  const domain = isEf && sp.domain ? sp.domain : null
  const rows = await listChecks(domain ? { domain } : { email: session.user.email })
  const own = workDomain(session.user.email)
  const quota = domain ? await quotaFor(domain) : own ? await quotaFor(own) : null

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Gesprächs-Check</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{domain ? `Gespräche · ${domain}` : 'Deine Gespräche'}</h1>
          <p className="mt-1 text-sm text-gray-500">Jede Auswertung mit Ergebnis und Transkript. Das Transkript kannst Du jederzeit löschen, die Auswertung bleibt.</p>
        </div>
        {quota ? (
          <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm">
            <span className="font-bold text-gray-900">{quota.remaining}</span>
            <span className="text-gray-500"> von {quota.limit} Gesprächen frei{domain || own ? ` · ${domain ?? own}` : ''}</span>
          </div>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <MessagesSquare size={22} className="mx-auto text-[#1A5FD4]" />
          <p className="mt-3 text-sm text-gray-600">Noch kein Gespräch ausgewertet.</p>
          <a href={`/${locale}/gespraechs-check`} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#1A5FD4] px-5 py-2.5 text-sm font-bold text-white">
            Gespräch hochladen <ArrowRight size={14} />
          </a>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.public_id} className="rounded-2xl border border-gray-100 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-400">
                    {new Date(r.created_at).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })}
                    {' · '}{r.word_count} Wörter{domain ? ` · ${r.email}` : ''}
                    {r.status !== 'done' ? ` · ${r.status === 'running' ? 'läuft' : 'fehlgeschlagen'}` : ''}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-800">{r.summary ?? '—'}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {r.probability != null ? <span className="rounded-full bg-[#EBF1FF] px-2.5 py-1 text-xs font-bold text-[#1A5FD4]">{Math.round(r.probability)} %</span> : null}
                  {r.outcome ? <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">{OUTCOME[r.outcome] ?? r.outcome}</span> : null}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {r.status === 'done' ? (
                  <a href={`/${locale}/gespraechs-check/${r.public_id}`} className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold text-[#1A5FD4] hover:bg-blue-50">
                    Auswertung <ArrowRight size={11} />
                  </a>
                ) : null}
                {r.has_transcript ? (
                  <Link href={`/dashboard/gespraechs-checks/${r.public_id}` as '/'} className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                    <FileText size={11} /> Transkript
                  </Link>
                ) : <span className="px-1 py-1 text-xs text-gray-400">Transkript gelöscht</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
