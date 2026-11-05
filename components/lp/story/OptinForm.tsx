'use client'

import { useState } from 'react'

/**
 * Opt-in der Squeeze-Seite: Vorname + Firmen-E-Mail. Legt einen Lead an,
 * prüft Firmenadresse und „schon gebucht“, und leitet mit Lead-ID zum Checkout
 * weiter (keine personenbezogenen Daten in der URL).
 */
export function OptinForm({ button, next, source, soldOut = false, bare = false }: { button: string; next: string; source: string; soldOut?: boolean; bare?: boolean }) {
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null)
    try {
      const res = await fetch('/api/mystery-shopping/lead', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, email, source }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.lead) { setError(data.error ?? 'Das hat nicht geklappt. Bitte versucht es noch einmal.'); return }
      const url = new URL(next, window.location.origin)
      url.searchParams.set('lead', data.lead)
      window.location.href = url.pathname + url.search
    } catch {
      setError('Das hat nicht geklappt. Bitte versucht es noch einmal.')
    } finally {
      setBusy(false)
    }
  }

  if (soldOut) return <p className="opt-h" style={{ fontSize: 16, fontWeight: 500 }}>Dieses Quartal ist ausgebucht.</p>

  const fields = (
    <>
      <input className="in" name="firstName" placeholder="Vorname" autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
      <input className="in" name="email" type="email" placeholder="Firmen-E-Mail" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <button className="btn go" type="submit" disabled={busy}>{busy ? 'Einen Moment …' : button}</button>
    </>
  )
  return (
    <form onSubmit={submit} noValidate={false}>
      {bare ? <div className="optin dark">{fields}</div> : <div className="optin">{fields}</div>}
      {error && <p className="err">{error}</p>}
    </form>
  )
}
