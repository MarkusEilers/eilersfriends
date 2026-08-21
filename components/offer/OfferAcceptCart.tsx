'use client'

import { useMemo, useState } from 'react'
import { Check, Star, FileText, CreditCard } from 'lucide-react'

interface PricingOption {
  type?: string
  title?: string
  description?: string
  price?: number
  monthlyDuration?: number
  recommended?: boolean
}
interface ProgramSummary { title?: string; pricing?: PricingOption[] }

type Rhythm = 'monthly' | 'upfront'
type Method = 'invoice' | 'card'

const INK = '#0D0D0B'
const ACCENT = '#1A5FD4'
const eur = (n: number) => `€${Math.round(n).toLocaleString('de-DE')}`

export function OfferAcceptCart({
  offerSecret, status, programs,
  paymentCardEnabled, paymentInvoiceEnabled,
  rhythmUpfrontEnabled, rhythmMonthlyEnabled,
  upfrontDiscountPct, customerName, customerEmail, noticeDomain,
}: {
  offerSecret: string
  status: string
  programs: ProgramSummary[]
  paymentCardEnabled: boolean
  paymentInvoiceEnabled: boolean
  rhythmUpfrontEnabled: boolean
  rhythmMonthlyEnabled: boolean
  upfrontDiscountPct: number
  customerName?: string | null
  customerEmail?: string | null
  signerToken?: string | null
  signerName?: string | null
  signerStatus?: string | null
  signers?: { name: string; status: string }[]
  lockedRhythm?: string | null
  lockedMethod?: string | null
  noticeDomain?: boolean
}) {
  const option = useMemo<PricingOption | null>(() => {
    const all = programs.flatMap((p) => p.pricing ?? [])
    return all.find((o) => o.recommended) ?? all[0] ?? null
  }, [programs])

  const duration = option?.monthlyDuration && option.monthlyDuration > 1 ? option.monthlyDuration : 1
  const monthlyRate = option?.price ?? 0
  const totalMonthly = monthlyRate * duration
  const discount = Math.max(0, Math.min(100, upfrontDiscountPct || 0))
  const upfrontTotal = Math.round(totalMonthly * (1 - discount / 100))

  const rhythms = ([
    rhythmMonthlyEnabled && duration > 1 ? 'monthly' : null,
    rhythmUpfrontEnabled ? 'upfront' : null,
  ].filter(Boolean)) as Rhythm[]
  const methods = ([
    paymentInvoiceEnabled ? 'invoice' : null,
    paymentCardEnabled ? 'card' : null,
  ].filter(Boolean)) as Method[]

  const locked = Boolean(lockedRhythm && lockedMethod)
  const [rhythm, setRhythm] = useState<Rhythm>((lockedRhythm as Rhythm) ?? rhythms[0] ?? 'upfront')
  const [method, setMethod] = useState<Method>((lockedMethod as Method) ?? methods[0] ?? 'invoice')
  const [name, setName] = useState(signerName ?? customerName ?? '')
  const [email, setEmail] = useState(customerEmail ?? '')

  const chosenTotal = rhythm === 'monthly' ? totalMonthly : upfrontTotal
  const canSubmit = !!option && name.trim().length > 1 && /.+@.+\..+/.test(email) && rhythms.length > 0 && methods.length > 0

  if (status === 'signed' || status === 'paid') {
    return (
      <section className="px-6 py-20" style={{ backgroundColor: '#0F1E3A' }}>
        <div className="mx-auto max-w-2xl text-center text-white">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(147, 184, 245,0.15)' }}>
            <Check size={28} style={{ color: '#93B8F5' }} />
          </div>
          <h2 className="mt-5 text-2xl font-bold">Bestätigt — vielen Dank!</h2>
          <p className="mt-3 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>Wir melden uns mit den nächsten Schritten und dem Onboarding bei Euch.</p>
        </div>
      </section>
    )
  }

  if (signerStatus === 'signed') {
    return (
      <section className="px-6 py-20" style={{ backgroundColor: '#0F1E3A' }}>
        <div className="mx-auto max-w-2xl text-center text-white">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(147,184,245,0.15)' }}>
            <Check size={28} style={{ color: '#93B8F5' }} />
          </div>
          <h2 className="mt-5 text-2xl font-bold">Danke — Deine Unterschrift liegt vor.</h2>
          <p className="mt-3 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {signers.filter((p) => p.status !== 'signed').length > 0
              ? `Sobald ${signers.filter((p) => p.status !== 'signed').map((p) => p.name).join(' und ')} unterschrieben ${signers.filter((p) => p.status !== 'signed').length > 1 ? 'haben' : 'hat'}, ist das Angebot verbindlich angenommen.`
              : 'Alle Unterschriften liegen vor. Wir melden uns mit den nächsten Schritten.'}
          </p>
        </div>
      </section>
    )
  }

  if (!option) return null

  return (
    <section className="px-6 py-20" style={{ background: 'linear-gradient(180deg, #FAFAF8 0%, #FFFFFF 100%)' }}>
      <div className="mx-auto max-w-3xl">
        {signers.length > 1 && (
          <div className="mb-8 rounded-2xl border px-5 py-4" style={{ borderColor: '#BBCFF5', backgroundColor: '#F5F8FF' }}>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: ACCENT }}>Unterschriften</p>
            <p className="mt-1 text-sm" style={{ color: INK }}>
              Dieses Angebot wird von {signers.length} Personen gezeichnet. Es gilt als angenommen, sobald alle unterschrieben haben.
            </p>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
              {signers.map((p, i) => (
                <li key={i} className="flex items-center gap-1.5 text-sm" style={{ color: p.status === 'signed' ? '#067647' : '#6B7280' }}>
                  {p.status === 'signed' ? <Check size={13} /> : <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#D1D5DB' }} />}
                  {p.name}{p.status === 'signed' ? '' : ' — offen'}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: ACCENT }}>{signerName ? `Unterschrift von ${signerName}` : 'Angebot annehmen'}</span>
          <h2 className="mt-2 text-3xl font-bold" style={{ color: INK }}>Zahlweise wählen und bestätigen.</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed" style={{ color: '#6B7280' }}>
            Wählen Sie Ihre bevorzugte Zahlweise und bestätigen Sie das Angebot mit Ihren Daten.
          </p>
        </div>

        {rhythms.length > 1 && !locked && (
          <div className="mt-10">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>Zahlungsrhythmus</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {rhythms.map((r) => {
                const active = rhythm === r
                const isMonthly = r === 'monthly'
                return (
                  <button key={r} type="button" onClick={() => setRhythm(r)}
                    className="relative rounded-2xl border bg-white p-5 text-left transition-all"
                    style={{ borderColor: active ? ACCENT : '#E5E7EB', boxShadow: active ? '0 8px 28px -12px rgba(26,95,212,0.45)' : 'none', borderWidth: active ? 2 : 1 }}>
                    {isMonthly && <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white" style={{ backgroundColor: '#0F1E3A' }}><Star size={9} fill="#fff" /> Empfohlen</span>}
                    <p className="text-sm font-bold" style={{ color: INK }}>{isMonthly ? 'Monatlich' : 'Einmalzahlung'}</p>
                    <p className="mt-1 text-2xl font-bold" style={{ color: INK }}>
                      {isMonthly ? `${eur(monthlyRate)}` : eur(upfrontTotal)}
                      {isMonthly && <span className="text-sm font-normal" style={{ color: '#6B7280' }}> / Monat</span>}
                    </p>
                    <p className="mt-1 text-xs" style={{ color: '#6B7280' }}>
                      {isMonthly ? `Gesamt ${eur(totalMonthly)} über ${duration} Monate` : (discount > 0 ? `${discount}% Rabatt · einmalig statt ${eur(totalMonthly)}` : 'einmalig')}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {methods.length > 1 && !locked && (
          <div className="mt-8">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>Zahlart</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {methods.map((m) => {
                const active = method === m
                const Icon = m === 'invoice' ? FileText : CreditCard
                return (
                  <button key={m} type="button" onClick={() => setMethod(m)}
                    className="flex items-center gap-3 rounded-2xl border bg-white p-4 text-left transition-all"
                    style={{ borderColor: active ? ACCENT : '#E5E7EB', borderWidth: active ? 2 : 1 }}>
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: '#EBF1FF', color: ACCENT }}><Icon size={16} /></span>
                    <span className="text-sm font-semibold" style={{ color: INK }}>{m === 'invoice' ? 'Per Rechnung' : 'Per Kreditkarte'}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>Ihre Auswahl</p>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-sm" style={{ color: INK }}>{programs[0]?.title ?? option.title}</span>
            <span className="text-sm" style={{ color: '#6B7280' }}>{rhythm === 'monthly' ? `${eur(monthlyRate)} / Monat · ${duration} Mon.` : `${eur(upfrontTotal)} einmalig`}</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between border-t border-gray-100 pt-3">
            <span className="text-sm font-semibold" style={{ color: INK }}>Gesamt {method === 'invoice' ? '(Rechnung)' : '(Kreditkarte)'}</span>
            <span className="text-2xl font-bold" style={{ color: INK }}>{eur(chosenTotal)}</span>
          </div>
          <p className="mt-2 text-xs" style={{ color: '#9CA3AF' }}>zuzüglich der gesetzlichen Umsatzsteuer (derzeit 19&nbsp;%)</p>
        </div>

        {noticeDomain && (
          <div className="mt-6 rounded-xl border px-4 py-3 text-sm" style={{ borderColor: '#F5B5B0', backgroundColor: '#FEF2F2', color: '#B42318' }}>
            Für die Annahme per Rechnung nutzen Sie bitte eine E-Mail-Adresse Ihrer Firmen-Domain.
          </div>
        )}
        <form action={`/api/offers/${offerSecret}/accept`} method="POST" className="mt-8 rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>Unterschrift</p>
          <p className="mt-1 text-sm" style={{ color: '#6B7280' }}>Bestätigen Sie das Angebot mit Ihren Daten.</p>
          {signerToken && <input type="hidden" name="signerToken" value={signerToken} />}
          <input type="hidden" name="method" value={method} />
          <input type="hidden" name="rhythm" value={rhythm} />
          <input type="hidden" name="selectedPricingOption" value={option.type ?? ''} />
          <input type="hidden" name="amount" value={chosenTotal} />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input name="signedByName" value={name} onChange={(e) => setName(e.target.value)} placeholder="Vollständiger Name" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
            <input name="signedByEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-Mail-Adresse" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
          </div>
          <button type="submit" disabled={!canSubmit}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white transition-opacity disabled:opacity-40"
            style={{ backgroundColor: method === 'card' ? ACCENT : '#0F1E3A' }}>
            {method === 'card' ? 'Angebot annehmen & zur Zahlung →' : 'Angebot verbindlich annehmen →'}
          </button>
          <p className="mt-3 text-center text-xs" style={{ color: '#9CA3AF' }}>
            {method === 'invoice'
              ? 'Bei Annahme per Rechnung protokollieren wir Zeitpunkt und Bestätigung als Nachweis.'
              : 'Sie werden nach der Bestätigung sicher zu Stripe weitergeleitet.'}
          </p>
        </form>
      </div>
    </section>
  )
}
