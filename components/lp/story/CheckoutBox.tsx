'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { ST, storyLang } from '@/lib/lp/story-i18n'
import { getVid, readContext } from '@/components/analytics/visitor'

/**
 * Bestellformular der Checkout-Seite. Startet die Stripe-Checkout-Session
 * (Karte, Rechnungsadresse und USt-ID erfasst Stripe). Die Plätze-Logik
 * (Firmen-Domain, einmal pro Firma, ausgebucht) prüft der Server.
 */
export function CheckoutBox({ slug, tierId, button, note, prefill, soldOut = false, nextOpens }: {
  slug: string; tierId: string; button: string; note?: string
  prefill?: { email?: string; firstName?: string }
  soldOut?: boolean; nextOpens?: string
}) {
  const lang = storyLang(useLocale())
  const T = ST[lang]
  const [firstName, setFirstName] = useState(prefill?.firstName ?? '')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState(prefill?.email ?? '')
  const [company, setCompany] = useState('')
  const [terms, setTerms] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Was in dieser Sitzung schon bekannt ist (Opt-in, Quiz) — nur leere Felder füllen
  useEffect(() => {
    const k = readContext()
    if (k.firstName) setFirstName((v) => v || k.firstName || '')
    if (k.email) setEmail((v) => v || k.email || '')
  }, [])

  if (soldOut) {
    return <div className="soldout">{T.soldOutBox(nextOpens ?? '')}</div>
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!terms) { setError(T.errTerms); return }
    setBusy(true); setError(null)
    try {
      const res = await fetch(`/api/checkout/${slug}/create-session`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tierId, seats: 1, vid: getVid().vid, email, name: `${firstName} ${lastName}`.trim(), company, acceptTerms: terms }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.url) { setError(data.error ?? T.errPay); return }
      window.location.href = data.url
    } catch {
      setError(T.errPay)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="two">
        <label className="field"><span>{T.first}</span><input className="in" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" required /></label>
        <label className="field"><span>{T.last}</span><input className="in" value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" required /></label>
      </div>
      <label className="field"><span>{T.workEmail}</span><input className="in" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></label>
      <label className="field"><span>{T.company}</span><input className="in" value={company} onChange={(e) => setCompany(e.target.value)} autoComplete="organization" required /></label>
      <label className="terms"><input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} /> <span>{T.terms(<a href={lang === 'de' ? '/agb' : `/${lang}/agb`} target="_blank">{T.agb}</a>, <a href={lang === 'de' ? '/datenschutz' : `/${lang}/datenschutz`} target="_blank">{T.privacy}</a>)}</span></label>
      <button className="btn blue full" type="submit" disabled={busy}>{busy ? T.toStripe : button}</button>
      {error && <p className="err">{error}</p>}
      {note && <small>{note}</small>}
    </form>
  )
}
