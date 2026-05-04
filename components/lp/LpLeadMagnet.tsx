'use client'

import { useState } from 'react'
import { Download, Loader2, CheckCircle, FileText } from 'lucide-react'

interface Props {
  content: Record<string, any>
  accent: string
  emailList: string
}

export function LpLeadMagnet({ content, accent, emailList }: Props) {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setStatus('loading')
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          firstName,
          source: emailList,
        }),
      })
      setStatus(res.ok ? 'done' : 'error')
    } catch {
      setStatus('error')
    }
  }

  const benefits: string[] = Array.isArray(content.benefits) ? content.benefits : []

  return (
    <section className="px-6 py-20" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="mx-auto max-w-4xl">
        <div className="grid gap-10 md:grid-cols-[280px_1fr] md:items-center">

          {/* Deliverable preview — left column */}
          <div className="text-center md:text-left">
            <div
              className="mx-auto md:mx-0 inline-flex h-44 w-32 flex-col items-center justify-between rounded-lg p-4 shadow-md transform -rotate-3"
              style={{ backgroundColor: 'white', border: `2px solid ${accent}` }}
            >
              <FileText size={32} style={{ color: accent }} />
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: accent }}>
                  {(content.format as string) || 'PDF'}
                </p>
                <p className="text-[9px] text-gray-400 mt-1">
                  {(content.size as string) || ''}
                </p>
              </div>
            </div>
          </div>

          {/* Form + content — right column */}
          <div>
            {content.eyebrow && (
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
                {content.eyebrow as string}
              </span>
            )}
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              {(content.headline as string) || 'Hol dir den Bauplan.'}
            </h2>
            {content.subheadline && (
              <p className="mt-3 text-base leading-relaxed text-gray-600">
                {content.subheadline as string}
              </p>
            )}

            {benefits.length > 0 && (
              <ul className="mt-6 space-y-2">
                {benefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle size={16} className="mt-0.5 flex-shrink-0" style={{ color: accent }} />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Form */}
            {status === 'done' ? (
              <div
                className="mt-6 rounded-2xl border-l-4 p-5 text-sm"
                style={{ borderColor: accent, backgroundColor: 'white' }}
              >
                <p className="font-bold" style={{ color: '#0D0D0B' }}>Check deine Mailbox 📬</p>
                <p className="mt-1 text-gray-600">
                  Wir haben dir den Download-Link an <strong>{email}</strong> geschickt. Bitte
                  bestätige deine Email — der Link kommt direkt danach.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 grid gap-3 sm:grid-cols-[1fr_140px]">
                <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder="Vorname (optional)"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-300"
                  />
                  <input
                    type="email"
                    required
                    placeholder="Deine Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-300"
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: accent }}
                >
                  {status === 'loading'
                    ? <><Loader2 size={16} className="animate-spin" /> Wird gesendet…</>
                    : <><Download size={16} /> {(content.ctaLabel as string) || 'Jetzt kostenlos holen'}</>
                  }
                </button>
              </form>
            )}

            {status === 'error' && (
              <p className="mt-3 text-xs text-red-600">
                Fehler beim Anmelden. Bitte später erneut versuchen.
              </p>
            )}

            <p className="mt-4 text-xs text-gray-500">
              {(content.privacyNote as string) ||
                'Kein Spam. Abmeldung mit einem Klick. Wir teilen deine Email niemals mit Dritten.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
