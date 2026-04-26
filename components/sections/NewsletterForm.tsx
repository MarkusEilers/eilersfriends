'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Mail, Loader2, CheckCircle } from 'lucide-react'

export function NewsletterForm() {
  const t = useTranslations('newsletter')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !consent) return
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

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <CheckCircle size={48} style={{ color: '#F05A1A' }} />
        <div>
          <p className="text-lg font-bold text-gray-900">{t('successTitle')}</p>
          <p className="mt-1 text-sm text-gray-500">{t('successNote')}</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('namePlaceholder')}
        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-colors focus:border-orange-400 focus:bg-white"
      />
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t('emailPlaceholder')}
        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-colors focus:border-orange-400 focus:bg-white"
      />
      <label className="flex gap-3 cursor-pointer">
        <div className="relative flex-shrink-0 mt-0.5">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="sr-only"
          />
          <div
            className="h-5 w-5 rounded border-2 transition-colors flex items-center justify-center"
            style={{
              borderColor: consent ? '#F05A1A' : '#D1D5DB',
              backgroundColor: consent ? '#F05A1A' : 'white',
            }}
          >
            {consent && (
              <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 12 12">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </div>
        <span className="text-xs leading-relaxed text-gray-500">
          {t('consentText')}
        </span>
      </label>
      <button
        type="submit"
        disabled={!consent || status === 'loading'}
        className="flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
        style={{ backgroundColor: '#F05A1A' }}
      >
        {status === 'loading'
          ? <Loader2 size={16} className="animate-spin" />
          : <Mail size={16} />}
        {status === 'loading' ? '...' : t('button')}
      </button>
      <p className="text-xs text-gray-400 text-center">{t('confirmationNote')}</p>
      {status === 'error' && (
        <p className="text-xs text-red-500 text-center">{t('errorNote')}</p>
      )}
    </form>
  )
}
