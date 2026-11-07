'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { ST, storyLang } from '@/lib/lp/story-i18n'
import { getVid, rememberContext } from '@/components/analytics/visitor'

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
  const lang = storyLang(useLocale())
  const T = ST[lang]

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null)
    try {
      const res = await fetch('/api/mystery-shopping/lead', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, email, source, vid: getVid().vid, locale: lang }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.lead) { setError(data.error ?? T.errGeneric); return }
      rememberContext({ firstName, email })
      const url = new URL(lang !== 'de' && next.startsWith('/') && !next.startsWith(`/${lang}/`) ? `/${lang}${next}` : next, window.location.origin)
      url.searchParams.set('lead', data.lead)
      window.location.href = url.pathname + url.search
    } catch {
      setError(T.errGeneric)
    } finally {
      setBusy(false)
    }
  }

  if (soldOut) return <p className="opt-h" style={{ fontSize: 16, fontWeight: 500 }}>{T.quarterSoldOut}</p>

  const fields = (
    <>
      <input className="in" name="firstName" placeholder={T.first} autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
      <input className="in" name="email" type="email" placeholder={T.workEmail} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <button className="btn go" type="submit" disabled={busy}>{busy ? T.wait : button}</button>
    </>
  )
  return (
    <form onSubmit={submit} noValidate={false}>
      {bare ? <div className="optin dark">{fields}</div> : <div className="optin">{fields}</div>}
      {error && <p className="err">{error}</p>}
    </form>
  )
}
