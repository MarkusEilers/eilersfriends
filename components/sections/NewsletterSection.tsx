'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Mail, Loader2 } from 'lucide-react'
import { SectionHeader } from '@/components/blocks/SectionHeader'

export function NewsletterSection() {
  const t = useTranslations('newsletter')
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
        body: JSON.stringify({ email }),
      })
      setStatus(res.ok ? 'success' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section id="newsletter" className="bg-white px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <SectionHeader
          eyebrow={t('eyebrow')}
          headline={t('headline')}
          subtext={t('subtext')}
          color="purple"
        />

        {status === 'success' ? (
          <div className="mt-8 rounded-2xl bg-green-50 border border-green-200 p-6">
            <p className="font-semibold text-green-800">Erfolgreich angemeldet! 🎉</p>
            <p className="mt-1 text-sm text-green-700">Check deine E-Mails für die Bestätigung.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('placeholder')}
                className="w-full rounded-full border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm outline-none transition-colors focus:border-purple focus:ring-2 focus:ring-purple/20"
                style={{ '--tw-ring-color': '#6B5CE7' } as React.CSSProperties}
              />
            </div>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="flex items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: '#6B5CE7' }}
            >
              {status === 'loading' ? <Loader2 size={16} className="animate-spin" /> : null}
              {t('button')}
            </button>
          </form>
        )}
        <p className="mt-3 text-xs text-gray-400">{t('note')}</p>
      </div>
    </section>
  )
}
