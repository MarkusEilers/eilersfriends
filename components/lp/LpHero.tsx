'use client'

import { useState } from 'react'

interface LpHeroProps {
  content: Record<string, any>
  accent: string
  emailList: string
}

export function LpHero({ content, accent, emailList }: LpHeroProps) {
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

  const showForm = !!(content.showEmailForm)

  return (
    <section className="relative overflow-hidden px-6 py-20 sm:py-28" style={{ backgroundColor: '#FAFAF8' }}>
      {/* Orb */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -top-40 right-0 h-[500px] w-[500px] rounded-full opacity-10 blur-3xl" style={{ backgroundColor: accent }} />
      </div>

      <div className="relative mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold leading-[1.15] tracking-tight sm:text-5xl lg:text-6xl" style={{ color: '#0D0D0B' }}>
          {(content.headline as string) || 'Headline eintragen'}
        </h1>
        {content.subheadline && (
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-500">
            {content.subheadline as string}
          </p>
        )}

        {showForm ? (
          <div className="mt-10">
            {status === 'done' ? (
              <div className="rounded-2xl border border-green-200 bg-green-50 px-6 py-8">
                <p className="text-lg font-bold text-green-800">Du bist dabei! 🎉</p>
                <p className="mt-2 text-sm text-green-700">Bitte bestätige deine Email-Adresse — schau in dein Postfach.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mx-auto flex max-w-md flex-col gap-3">
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Dein Vorname"
                  className="w-full rounded-full border border-gray-200 bg-white px-5 py-3.5 text-sm shadow-sm focus:border-orange-400 focus:outline-none"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Deine Email-Adresse"
                  className="w-full rounded-full border border-gray-200 bg-white px-5 py-3.5 text-sm shadow-sm focus:border-orange-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full rounded-full py-3.5 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: accent }}
                >
                  {status === 'loading' ? 'Wird gesendet…' : ((content.ctaLabel as string) || 'Jetzt anmelden →')}
                </button>
                {status === 'error' && <p className="text-xs text-red-600">Fehler — bitte versuche es nochmal.</p>}
              </form>
            )}
          </div>
        ) : (
          content.ctaHref && (
            <div className="mt-10">
              <a
                href={content.ctaHref as string}
                className="inline-block rounded-full px-8 py-4 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90"
                style={{ backgroundColor: accent }}
              >
                {(content.ctaLabel as string) || 'Jetzt starten →'}
              </a>
            </div>
          )
        )}
      </div>
    </section>
  )
}
