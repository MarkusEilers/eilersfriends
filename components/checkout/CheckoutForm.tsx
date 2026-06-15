'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

export interface CheckoutTier {
  id: string
  label: string
  price: number
  currency: 'EUR' | 'USD' | 'GBP'
  billing: 'one-time' | 'monthly' | 'yearly' | 'lifetime'
  stripe_price_id: string
  is_highlighted?: boolean
  is_available: boolean
  note?: string
}

interface Props {
  programSlug: string
  programName: string
  tiers: CheckoutTier[]
  enrollmentLimit?: number | null
  enrollmentDeadline?: string | null
  freeSeatPer?: number
  bonusTiers?: { threshold: number; label: string }[]
  cities?: string[]
  maxSeats?: number
  guaranteeText?: string
  guaranteeBadge?: string
}

const COUNTRIES = ['Deutschland', 'Österreich', 'Schweiz', 'Niederlande', 'Frankreich', 'Andere EU']

function formatEUR(n: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(n)
}
function billingSuffix(b: CheckoutTier['billing']): string {
  if (b === 'monthly') return '/ Monat'
  if (b === 'yearly') return '/ Jahr'
  return 'einmalig'
}

export function CheckoutForm({ programSlug, programName, tiers, enrollmentLimit, enrollmentDeadline, freeSeatPer = 0, bonusTiers = [], cities, maxSeats = 200, guaranteeText, guaranteeBadge }: Props) {
  const initialTier = tiers.find((t) => t.is_highlighted) ?? tiers[0]
  const [selectedTierId, setSelectedTierId] = useState(initialTier?.id ?? '')
  const [seats, setSeats] = useState(1)
  const [eventCity, setEventCity] = useState(cities && cities.length ? cities[0] : '')
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [company, setCompany] = useState('')
  const [vatId, setVatId] = useState('')
  const [street, setStreet] = useState('')
  const [postal, setPostal] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('Deutschland')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedTier = tiers.find((t) => t.id === selectedTierId)
  if (!selectedTier) return <p className="text-sm text-red">Keine Tiers verfügbar.</p>

  const isVatExempt = country !== 'Deutschland' && vatId.trim().length >= 8
  const freeSeats = freeSeatPer > 0 ? Math.floor(seats / freeSeatPer) : 0
  const paidSeats = Math.max(1, seats - freeSeats)
  const subtotal = selectedTier.price * paidSeats
  const vat = isVatExempt ? 0 : Math.round(subtotal * 0.19 * 100) / 100
  const total = subtotal + vat

  const bonuses: string[] = []
  if (freeSeats >= 1) bonuses.push(`${freeSeats} ${freeSeats === 1 ? 'freier Platz' : 'freie Plätze'}`)
  for (const bt of bonusTiers) if (seats >= bt.threshold) bonuses.push(bt.label)

  async function submit() {
    if (!selectedTier) return
    setSubmitting(true); setError(null)
    try {
      const res = await fetch(`/api/checkout/${programSlug}/create-session`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tierId: selectedTier.id,
          seats,
          city: eventCity,
          email, name: `${firstName} ${lastName}`.trim(), company, vatId,
          billingAddress: { street, postal, city, country },
          acceptTerms,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) { setError(data.error || 'Fehler beim Erstellen der Stripe-Session.'); return }
      window.location.href = data.url
    } catch (e) {
      setError(String(e))
    } finally {
      setSubmitting(false)
    }
  }

  const deadlineDate = enrollmentDeadline ? new Date(enrollmentDeadline).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' }) : null

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
      {/* Tier Selector */}
      <div className="border-b border-gray-100 bg-cream px-6 py-5">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Dein Tier</p>
        <div className="space-y-2">
          {tiers.map((t) => {
            const isSelected = t.id === selectedTierId
            return (
              <label
                key={t.id}
                className={
                  'relative flex cursor-pointer items-start gap-3 rounded-xl border-2 bg-white p-3 ' +
                  (isSelected ? 'border-blue ring-2 ring-blue/15' : 'border-gray-200 hover:border-blue-border')
                }
              >
                {t.is_highlighted && (
                  <span className="absolute -top-2 right-3 rounded-full bg-blue px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white">
                    Empfohlen
                  </span>
                )}
                <input
                  type="radio"
                  name="tier"
                  checked={isSelected}
                  onChange={() => setSelectedTierId(t.id)}
                  className="mt-1 accent-blue"
                />
                <div className="flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold text-ink">{t.label}</span>
                    <span className="font-serif text-lg text-ink">
                      {formatEUR(t.price)}
                      <span className="ml-1 text-xs font-sans font-normal text-muted">{billingSuffix(t.billing)}</span>
                    </span>
                  </div>
                  {t.note && <p className="mt-1 text-xs text-muted">{t.note}</p>}
                </div>
              </label>
            )
          })}
        </div>
        {enrollmentLimit && (
          <p className="mt-4 text-[11px] text-muted">Nur {enrollmentLimit} Plätze{deadlineDate ? ` · die ersten ${enrollmentLimit} enden am ${deadlineDate}` : ''}</p>
        )}
      </div>

      {/* Seats */}
      <div className="border-b border-gray-100 px-6 py-5">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Anzahl Plätze</p>
        <div className="flex items-center gap-4">
          <div className="inline-flex items-center rounded-xl border border-gray-200">
            <button type="button" onClick={() => setSeats((v) => Math.max(1, v - 1))} disabled={seats <= 1}
              className="px-3 py-2 text-lg font-bold text-ink disabled:opacity-30" aria-label="Weniger">−</button>
            <span className="w-10 text-center font-bold text-ink">{seats}</span>
            <button type="button" onClick={() => setSeats((v) => Math.min(maxSeats, v + 1))}
              className="px-3 py-2 text-lg font-bold text-ink" aria-label="Mehr">+</button>
          </div>
          <span className="text-xs text-muted">{paidSeats} zahlbar{freeSeats > 0 ? ` · ${freeSeats} gratis` : ''}</span>
        </div>
        {bonuses.length > 0 && (
          <div className="mt-4 rounded-xl bg-blue-bg p-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-blue">Dein Bonus</p>
            <ul className="space-y-1.5">
              {bonuses.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-ink">
                  <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-blue text-[9px] font-bold text-white">✓</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Form */}
      <div className="space-y-4 px-6 py-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Deine Daten</p>

        {cities && cities.length > 0 && (
          <Field label="Termin / Stadt">
            <select value={eventCity} onChange={(e) => setEventCity(e.target.value)} className="input-base">
              {cities.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
        )}

        <Field label="Firma">
          <input type="text" value={company} onChange={(e) => setCompany(e.target.value)}
            placeholder="z.B. Eilers+Friends GmbH" className="input-base" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Vorname">
            <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="input-base" />
          </Field>
          <Field label="Nachname">
            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="input-base" />
          </Field>
        </div>

        <Field label="Email">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-base" />
        </Field>

        <Field label="USt-IdNr" help="Optional · Reverse-Charge ausserhalb DE">
          <input type="text" value={vatId} onChange={(e) => setVatId(e.target.value)}
            placeholder="DE123456789 / ATU…"
            className="input-base font-mono" />
        </Field>

        <Field label="Strasse + Nr.">
          <input type="text" value={street} onChange={(e) => setStreet(e.target.value)} className="input-base" />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="PLZ">
            <input type="text" value={postal} onChange={(e) => setPostal(e.target.value)} className="input-base" />
          </Field>
          <div className="col-span-2">
            <Field label="Stadt">
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="input-base" />
            </Field>
          </div>
        </div>

        <Field label="Land">
          <select value={country} onChange={(e) => setCountry(e.target.value)} className="input-base">
            {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>

        {/* Summary */}
        <div className="space-y-1 rounded-xl bg-cream p-4 text-sm">
          <div className="flex justify-between text-muted">
            <span>{programName} · {selectedTier.label} × {paidSeats}{freeSeats > 0 ? ` (+${freeSeats} gratis)` : ''}</span>
            <span>{formatEUR(subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>USt {isVatExempt ? '0 % (Reverse-Charge)' : '19 %'}</span>
            <span>{formatEUR(vat)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-gray-300 pt-2 text-base font-bold text-ink">
            <span>Heute zu zahlen</span>
            <span className="font-serif text-xl">{formatEUR(total)}</span>
          </div>
        </div>

        <label className="flex items-start gap-2 text-xs text-gray-700">
          <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="mt-0.5 accent-blue" />
          <span>Ich akzeptiere die <a href="/agb" target="_blank" className="text-blue underline">AGB</a> und die <a href="/datenschutz" target="_blank" className="text-blue underline">Datenschutzerklärung</a>.{guaranteeText ? ` Es gilt die ${guaranteeText}.` : ''}</span>
        </label>

        {error && <p className="text-sm text-red">{error}</p>}

        <button
          onClick={submit}
          disabled={submitting || !acceptTerms || !email || !firstName || (Boolean(cities) && !eventCity)}
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0A0D14] px-6 py-4 text-sm font-bold text-white shadow-md hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
          {submitting ? 'Weiterleitung zu Stripe…' : 'Weiter zur Zahlung →'}
        </button>

        <div className="flex items-center justify-center gap-2 pt-1 text-[10px] text-muted">
          <span>SSL · PCI-DSS</span><span>·</span>
          <span>Stripe Checkout</span>{guaranteeBadge ? <><span>·</span><span>{guaranteeBadge}</span></> : null}
        </div>
      </div>

      <style jsx>{`
        :global(.input-base) {
          width: 100%; border-radius: 0.75rem; border: 1px solid #E5E7EB;
          background: #fff; padding: 0.625rem 0.875rem; font-size: 0.875rem;
        }
        :global(.input-base:focus) { outline: none; border-color: #1A5FD4; box-shadow: 0 0 0 3px #EBF1FF; }
      `}</style>
    </div>
  )
}

function Field({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-gray-700">{label}{help && <span className="font-normal text-muted"> · {help}</span>}</span>
      {children}
    </label>
  )
}
