'use client'

import { useState } from 'react'
import { CheckCircle, Loader2, Send } from 'lucide-react'

const initial = { name: '', email: '', company: '', subject: '', message: '' }

export function ContactForm() {
  const [form, setForm] = useState(initial)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg(null)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setStatus('success')
        setForm(initial)
      } else {
        const data = await res.json().catch(() => ({}))
        setStatus('error')
        setErrorMsg(data.error || 'Senden fehlgeschlagen.')
      }
    } catch {
      setStatus('error')
      setErrorMsg('Netzwerkfehler. Bitte später erneut versuchen.')
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center py-8">
        <div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: '#FFF1EB' }}
        >
          <CheckCircle size={28} style={{ color: '#F05A1A' }} />
        </div>
        <h3 className="text-xl font-bold" style={{ color: '#0D0D0B' }}>Nachricht gesendet!</h3>
        <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto">
          Vielen Dank für deine Nachricht. Wir melden uns innerhalb von
          24 Stunden bei dir.
        </p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-6 rounded-full border px-5 py-2 text-xs font-semibold"
          style={{ color: '#F05A1A', borderColor: '#FECDBB' }}
        >
          Weitere Nachricht senden
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name *" name="name" value={form.name} onChange={handleChange} required />
        <Field label="E-Mail *" type="email" name="email" value={form.email} onChange={handleChange} required />
      </div>
      <Field label="Unternehmen" name="company" value={form.company} onChange={handleChange} />
      <Field label="Betreff" name="subject" value={form.subject} onChange={handleChange} />
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5">
          Nachricht *
        </label>
        <textarea
          name="message"
          value={form.message}
          onChange={handleChange}
          required
          rows={6}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-colors focus:border-orange-400 focus:bg-white resize-y"
        />
      </div>

      {errorMsg && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
        style={{ backgroundColor: '#F05A1A' }}
      >
        {status === 'loading'
          ? <><Loader2 size={16} className="animate-spin" /> Wird gesendet…</>
          : <><Send size={16} /> Nachricht senden</>
        }
      </button>

      <p className="text-xs text-gray-400 text-center">
        Mit dem Absenden stimmst du zu, dass wir Deine Daten zur Beantwortung
        der Anfrage verarbeiten dürfen. Mehr in unserer{' '}
        <a href="/datenschutz" className="underline" style={{ color: '#F05A1A' }}>Datenschutzerklärung</a>.
      </p>
    </form>
  )
}

function Field({
  label, name, value, onChange, type = 'text', required,
}: {
  label: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-colors focus:border-orange-400 focus:bg-white"
      />
    </div>
  )
}
