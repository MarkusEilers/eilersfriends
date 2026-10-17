'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { FileSignature, Loader2 } from 'lucide-react'
import type { OfferDraft } from '@/lib/call-check/analyze'
import { createOfferFromCheckAction } from '@/lib/call-check/actions'

export interface OfferLabels {
  title: string; hint: string; results: string; challenges: string; steps: string
  costOfInaction: string; riskReversal: string; nextStep: string; missing: string; create: string; created: string
}

/** Angebots-Entwurf aus dem Gespräch. Eilers+Friends kann ihn als Angebot anlegen. */
export function OfferDraftPanel({ d, L, publicId, canCreate, offerId }: { d: OfferDraft; L: OfferLabels; publicId: string; canCreate: boolean; offerId: string | null }) {
  const [id, setId] = useState(offerId)
  const [err, setErr] = useState('')
  const [pending, start] = useTransition()
  const List = ({ title, xs }: { title: string; xs: string[] }) => xs.length ? (
    <div><p className="text-xs font-bold uppercase tracking-wider text-gray-500">{title}</p>
      <ul className="mt-2 space-y-1.5">{xs.map((x, i) => <li key={i} className="flex gap-2 text-sm text-gray-700"><span className="text-gray-300">•</span>{x}</li>)}</ul></div>
  ) : null
  const Line = ({ title, v }: { title: string; v: string }) => v ? (
    <div><p className="text-xs font-bold uppercase tracking-wider text-gray-500">{title}</p><p className="mt-1.5 text-sm text-gray-700">{v}</p></div>
  ) : null
  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900"><FileSignature size={22} className="text-[#1A5FD4]" /> {L.title}</h2>
          <p className="mt-1 text-sm text-gray-500">{L.hint}</p>
        </div>
        {canCreate && (id
          ? <Link href={`/admin/offers/${id}` as '/'} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700">{L.created} →</Link>
          : <button type="button" disabled={pending} onClick={() => start(async () => { const r = await createOfferFromCheckAction(publicId); if (r.ok && 'offerId' in r) setId(r.offerId ?? null); else setErr(('error' in r && r.error) || 'Fehler') })}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0F1E3A] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {pending && <Loader2 size={14} className="animate-spin" />}{L.create}
            </button>)}
      </div>
      {err && <p className="mt-2 text-xs text-red-600">{err}</p>}
      {d.headline && <p className="mt-6 text-xl font-bold leading-snug text-[#0F1E3A]">{d.headline}</p>}
      {d.empathy && <p className="mt-3 text-sm italic text-gray-600">{d.empathy}</p>}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <List title={L.results} xs={d.results} />
        <List title={L.challenges} xs={d.challenges} />
        <List title={L.steps} xs={d.steps} />
        <div className="space-y-4">
          <Line title={L.costOfInaction} v={d.cost_of_inaction} />
          <Line title={L.riskReversal} v={d.risk_reversal} />
          <Line title={L.nextStep} v={d.next_step} />
        </div>
      </div>
      {d.missing.length > 0 && (
        <div className="mt-6 rounded-2xl bg-[#FFF8E6] p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[#8A5F00]">{L.missing}</p>
          <ul className="mt-2 space-y-1">{d.missing.map((x, i) => <li key={i} className="text-sm text-[#6B4A00]">{x}</li>)}</ul>
        </div>
      )}
    </section>
  )
}
