'use client'

import { useState } from 'react'
import { ArrowRight, CheckCircle, Download, Play, Loader2 } from 'lucide-react'

const STEPS = [
  'Definiere, wen du wirklich bedienst',
  'Identifiziere den stärksten Schmerzpunkt',
  'Formuliere deinen Transformation-Promise',
  'Baue deinen Proof-Stack auf',
  'Gestalte dein Angebot-Paket',
  'Entwickle deinen Preis-Anker',
  'Erstelle deine Angebots-Präsentation',
  'Teste und iteriere in echten Gesprächen',
]

export default function B2BAngebotePage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setStatus('loading')
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName: name.trim() || undefined }),
      })
      setStatus(res.ok ? 'success' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>
      {/* Hero */}
      <section className="px-6 py-20" style={{ backgroundColor: '#0F1E3A' }}>
        <div className="mx-auto max-w-4xl text-center">
          <span
            className="inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-6"
            style={{ backgroundColor: 'rgba(26,95,212,0.25)', color: '#93B8F5' }}
          >
            Kostenlos · Sofort verfügbar
          </span>
          <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
            Unwiderstehliche B2B Angebote<br />
            <span style={{ color: '#F05A1A' }}>in 8 einfachen Schritten</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Der komplette Bauplan für B2B-Angebote, die sich von selbst verkaufen — inkl. Video-Masterclass von Markus Eilers.
          </p>
        </div>
      </section>

      {/* Main content */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl grid gap-12 lg:grid-cols-2 lg:items-start">

          {/* Left: What you get + Steps */}
          <div>
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#0D0D0B' }}>
              Was du bekommst
            </h2>

            {/* Deliverables */}
            <div className="space-y-3 mb-10">
              {[
                { icon: Download, label: 'Bauplan PDF', desc: 'Der komplette 8-Schritte-Bauplan als druckfähiges PDF' },
                { icon: Play, label: 'Video-Masterclass', desc: '47 Minuten mit Markus — praxisnah und direkt umsetzbar' },
                { icon: CheckCircle, label: 'Angebots-Template', desc: 'Sofort einsatzfähige Vorlage für dein B2B-Angebot' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: '#FFF1EB' }}>
                    <Icon size={18} style={{ color: '#F05A1A' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#0D0D0B' }}>{label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* 8 Steps */}
            <h2 className="text-xl font-bold mb-5" style={{ color: '#0D0D0B' }}>
              Die 8 Schritte
            </h2>
            <div className="space-y-3">
              {STEPS.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white mt-0.5"
                    style={{ backgroundColor: '#F05A1A' }}
                  >
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-700 pt-1">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Opt-in form */}
          <div className="lg:sticky lg:top-8">
            <div className="rounded-3xl bg-white p-8 shadow-xl border border-gray-100">
              {status === 'success' ? (
                <div className="flex flex-col items-center gap-4 py-8 text-center">
                  <CheckCircle size={52} style={{ color: '#F05A1A' }} />
                  <div>
                    <p className="text-xl font-bold" style={{ color: '#0D0D0B' }}>Zugang wird gesendet!</p>
                    <p className="mt-2 text-sm text-gray-500">
                      Schau in dein Postfach — wir schicken dir den Bauplan + Video-Link sofort zu.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-bold mb-2" style={{ color: '#0D0D0B' }}>
                    Jetzt kostenlos holen
                  </h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Trag dich ein und erhalte sofort Zugang zu Bauplan + Video.
                  </p>
                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Dein Vorname"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-colors focus:border-orange-400 focus:bg-white"
                    />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Deine E-Mail-Adresse"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-colors focus:border-orange-400 focus:bg-white"
                    />
                    <button
                      type="submit"
                      disabled={status === 'loading'}
                      className="flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                      style={{ backgroundColor: '#F05A1A' }}
                    >
                      {status === 'loading'
                        ? <Loader2 size={16} className="animate-spin" />
                        : <ArrowRight size={16} />
                      }
                      Bauplan + Video senden
                    </button>
                    {status === 'error' && (
                      <p className="text-center text-xs text-red-500">Etwas ist schiefgelaufen. Bitte erneut versuchen.</p>
                    )}
                    <p className="text-center text-xs text-gray-400">
                      Kein Spam. Jederzeit abmeldbar. DSGVO-konform.
                    </p>
                  </form>
                </>
              )}
            </div>

            {/* Social proof */}
            <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {['#F05A1A', '#1A5FD4', '#D4192B', '#B07C0A'].map((c) => (
                    <div key={c} className="h-8 w-8 rounded-full border-2 border-white" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  <span className="font-semibold text-gray-900">867+</span> Gründer haben diesen Bauplan bereits genutzt
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>
    </main>
  )
}
