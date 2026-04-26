'use client'

import { useState } from 'react'

interface LpEmailCaptureProps {
  content: Record<string, unknown>
  accent: string
  emailList: string
}

export function LpEmailCapture({ content, accent, emailList }: LpEmailCaptureProps) {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName, source: emailList }),
      })
      setStatus(res.ok ? 'done' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section className="px-6 py-16" style={{ backgroundColor: '#0A0D14' }}>
      <div className="mx-auto max-w-lg text-center">
        {content.headline && (
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
            {content.headline as string}
          </h2>
        )}
        {content.subtext && (
          <p className="mb-8 text-gray-400">{content.subtext as string}</p>
        )}

        {status === 'done' ? (
          <div className="rounded-2xl border border-white/20 bg-white/10 p-8">
            <p className="text-xl font-bold text-white">Perfekt! 🎉</p>
            <p className="mt-2 text-gray-300">Schau in dein Postfach und bestätige deine Email.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Dein Vorname"
              className="w-full rounded-full border border-white/20 bg-white/10 px-5 py-3.5 text-sm text-white placeholder-gray-500 focus:border-white/40 focus:outline-none"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Deine Email-Adresse"
              className="w-full rounded-full border border-white/20 bg-white/10 px-5 py-3.5 text-sm text-white placeholder-gray-500 focus:border-white/40 focus:outline-none"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full rounded-full py-3.5 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: accent }}
            >
              {status === 'loading' ? 'Wird gesendet…' : ((content.buttonLabel as string) || 'Kostenlos anmelden →')}
            </button>
            {content.privacyNote && (
              <p className="mt-1 text-xs text-gray-500">{content.privacyNote as string}</p>
            )}
            {status === 'error' && <p className="text-xs text-red-400">Fehler — bitte versuche es nochmal.</p>}
          </form>
        )}
      </div>
    </section>
  )
}
