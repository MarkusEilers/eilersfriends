'use client'

import { useState } from 'react'

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
  const [firstName, setFirstName] = useState(prefill?.firstName ?? '')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState(prefill?.email ?? '')
  const [company, setCompany] = useState('')
  const [terms, setTerms] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (soldOut) {
    return <div className="soldout"><b>Ausgebucht.</b> Der nächste Durchgang startet im {nextOpens}. Schreibt uns an <a href="mailto:team@eilersfriends.com">team@eilersfriends.com</a>, dann merken wir Euch vor.</div>
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!terms) { setError('Bitte bestätigt die AGB und die Datenschutzerklärung.'); return }
    setBusy(true); setError(null)
    try {
      const res = await fetch(`/api/checkout/${slug}/create-session`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tierId, seats: 1, email, name: `${firstName} ${lastName}`.trim(), company, acceptTerms: terms }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.url) { setError(data.error ?? 'Die Zahlung konnte nicht gestartet werden.'); return }
      window.location.href = data.url
    } catch {
      setError('Die Zahlung konnte nicht gestartet werden.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="two">
        <label className="field"><span>Vorname</span><input className="in" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" required /></label>
        <label className="field"><span>Nachname</span><input className="in" value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" required /></label>
      </div>
      <label className="field"><span>Firmen-E-Mail</span><input className="in" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></label>
      <label className="field"><span>Firma</span><input className="in" value={company} onChange={(e) => setCompany(e.target.value)} autoComplete="organization" required /></label>
      <label className="terms"><input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} /> <span>Ich akzeptiere die <a href="/agb" target="_blank">AGB</a> und habe die <a href="/datenschutz" target="_blank">Datenschutzerklärung</a> gelesen.</span></label>
      <button className="btn blue full" type="submit" disabled={busy}>{busy ? 'Weiter zu Stripe …' : button}</button>
      {error && <p className="err">{error}</p>}
      {note && <small>{note}</small>}
    </form>
  )
}
