import { getCookieConsent } from '@/components/layout/CookieBanner'

/**
 * Besucher-ID fürs Lead-Scoring. Mit Analyse-Einwilligung: Cookie „ef_vid“ (1 Jahr).
 * Ohne: anonyme ID nur für diese Browser-Sitzung (sessionStorage). Wird die Einwilligung
 * später gegeben, übernimmt das Cookie die Sitzungs-ID, damit nichts verloren geht.
 */
function rnd() {
  try { return crypto.randomUUID() } catch { return 'v' + Math.random().toString(36).slice(2) + Date.now().toString(36) }
}
function readCookie() {
  const m = document.cookie.match(/(?:^|;\s*)ef_vid=([a-z0-9-]{8,64})/)
  return m ? m[1] : null
}
export function getVid(): { vid: string; persistent: boolean } {
  const consent = !!getCookieConsent()?.analytics
  let session: string | null = null
  try { session = sessionStorage.getItem('ef_vid_s') } catch { /* privat */ }
  if (consent) {
    let v = readCookie()
    if (!v) {
      v = session || rnd()
      document.cookie = `ef_vid=${v}; Max-Age=${60 * 60 * 24 * 365}; Path=/; SameSite=Lax; Secure`
    }
    return { vid: v, persistent: true }
  }
  if (!session) {
    session = rnd()
    try { sessionStorage.setItem('ef_vid_s', session) } catch { /* privat */ }
  }
  return { vid: session, persistent: false }
}

export function efTrack(kind: string, key = '', payload: Record<string, unknown> = {}) {
  try {
    const { vid } = getVid()
    fetch('/api/ev', {
      method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vid, kind, key, payload, path: location.pathname }),
    }).catch(() => {})
  } catch { /* nie die Seite stören */ }
}

/** Kontext für spätere Formulare (nur in dieser Sitzung, z. B. Buchung nach dem Quiz). */
export function rememberContext(c: { firstName?: string; email?: string; note?: string }) {
  try {
    const old = JSON.parse(sessionStorage.getItem('ef_ctx') || '{}')
    sessionStorage.setItem('ef_ctx', JSON.stringify({ ...old, ...Object.fromEntries(Object.entries(c).filter(([, v]) => v)) }))
  } catch { /* privat */ }
}
export function readContext(): { firstName?: string; email?: string; note?: string } {
  try { return JSON.parse(sessionStorage.getItem('ef_ctx') || '{}') } catch { return {} }
}
