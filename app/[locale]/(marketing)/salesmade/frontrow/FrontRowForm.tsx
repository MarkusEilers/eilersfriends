'use client'

import { useState } from 'react'
import { Loader2, CheckCircle, ArrowRight } from 'lucide-react'

const QUESTION_LIMIT = 280

export function FrontRowForm() {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [question, setQuestion] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const charsLeft = QUESTION_LIMIT - question.length

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setStatus('loading')
    setErrorMsg(null)
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          firstName: firstName.trim() || undefined,
          source: 'frontrow',
          question: question.trim() || undefined,
          consentGiven: true,
        }),
      })
      if (res.ok) {
        setStatus('done')
        return
      }
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || `HTTP ${res.status}`)
    } catch (err) {
      setStatus('error')
      setErrorMsg((err as Error).message)
    }
  }

  if (status === 'done') {
    return (
      <div className="rounded-2xl border-2 p-8 text-center" style={{ borderColor: '#1A5FD4', backgroundColor: '#EBF1FF' }}>
        <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-white">
          <CheckCircle size={26} style={{ color: '#1A5FD4' }} />
        </div>
        <h3 className="text-xl font-bold" style={{ color: '#0D0D0B' }}>Du bist auf der Liste.</h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-700 max-w-md mx-auto">
          Schau in dein Postfach und bestätige deine Email. Danach kommt die Welcome-Mail von
          Markus mit dem ersten Bonus — dem Influence-Triangle-Poster.
        </p>
        <p className="mt-3 text-xs text-gray-500">
          Keine Bestätigungsmail? Check Spam, dann antworte direkt auf eine andere Mail an
          markus@eilersfriends.com — ich trag dich manuell ein.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5">
          Email *
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="markus@beispiel.de"
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-blue-300"
        />
      </div>
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5">
          Vorname (optional)
        </label>
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Markus"
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-blue-300"
        />
      </div>
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5">
          Optionale Frage
        </label>
        <p className="text-sm text-gray-700 mb-2">
          Welche Frage zu ersten Gesprächen hat dir noch niemand beantwortet?
        </p>
        <textarea
          value={question}
          onChange={(e) => {
            if (e.target.value.length <= QUESTION_LIMIT) setQuestion(e.target.value)
          }}
          rows={4}
          placeholder="Optional. Lass leer wenn du noch keine hast — kommt mit der Zeit."
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-blue-300 resize-y"
        />
        <div className="mt-1 flex justify-end">
          <span className={`text-xs ${charsLeft < 20 ? 'text-orange-600' : 'text-gray-400'}`}>
            {charsLeft} / {QUESTION_LIMIT}
          </span>
        </div>
      </div>

      {errorMsg && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'loading' || !email}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-sm font-semibold text-white shadow-md transition-opacity disabled:opacity-50"
        style={{ backgroundColor: '#1A5FD4' }}
      >
        {status === 'loading'
          ? <><Loader2 size={16} className="animate-spin" /> Trage dich ein…</>
          : <>In die Front Row <ArrowRight size={14} /></>
        }
      </button>
      <p className="text-xs text-center text-gray-500 leading-relaxed">
        Deine Email geht nirgendwohin außer Kapitel-Drafts. Jederzeit abmelden. Kein Tracking-Pixel
        außer einem Signup-Counter. Kein Upsell.
      </p>
    </form>
  )
}
