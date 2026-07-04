'use client'
import { useEffect } from 'react'

export default function LocaleError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    try {
      fetch('/api/log/error', { method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
        body: JSON.stringify({ level: 'error', source: 'client', message: error?.message || 'segment-error', stack: error?.stack, url: typeof location !== 'undefined' ? location.href : undefined, context: { digest: error?.digest } }) }).catch(() => {})
    } catch { /* ignore */ }
  }, [error])
  return (
    <div style={{ background: '#FAFAF8', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 440 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0D0D0B' }}>Etwas ist schiefgelaufen.</h1>
        <p style={{ marginTop: 8, color: '#555' }}>Wir wurden automatisch benachrichtigt und schauen uns das an. Bitte versuche es erneut.</p>
        <button onClick={() => reset()} style={{ marginTop: 20, background: '#1A5FD4', color: '#fff', border: 0, borderRadius: 9999, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>Erneut versuchen</button>
      </div>
    </div>
  )
}
