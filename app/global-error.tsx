'use client'
import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    try {
      fetch('/api/log/error', { method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
        body: JSON.stringify({ level: 'fatal', source: 'client', message: error?.message || 'global-error', stack: error?.stack, url: typeof location !== 'undefined' ? location.href : undefined, context: { digest: error?.digest } }) }).catch(() => {})
    } catch { /* ignore */ }
  }, [error])
  return (
    <html>
      <body style={{ fontFamily: 'system-ui, sans-serif', display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', margin: 0, background: '#FAFAF8' }}>
        <div style={{ textAlign: 'center', maxWidth: 420, padding: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0D0D0B' }}>Etwas ist schiefgelaufen.</h1>
          <p style={{ marginTop: 8, color: '#555' }}>Wir wurden automatisch informiert. Bitte versuche es erneut.</p>
          <button onClick={() => reset()} style={{ marginTop: 20, background: '#1A5FD4', color: '#fff', border: 0, borderRadius: 9999, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>Erneut versuchen</button>
        </div>
      </body>
    </html>
  )
}
