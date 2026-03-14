'use client'

import { useState, useEffect } from 'react'
import { Cookie } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function CookieBanner() {
  const [show, setShow] = useState(false)
  const t = useTranslations('cookie')

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) setShow(true)
  }, [])

  function accept() {
    localStorage.setItem('cookie-consent', 'accepted')
    setShow(false)
  }

  function reject() {
    localStorage.setItem('cookie-consent', 'rejected')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-6 md:max-w-sm">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center gap-2">
          <Cookie size={18} className="text-orange flex-shrink-0" style={{ color: '#F05A1A' }} />
          <span className="font-semibold text-sm text-gray-900">{t('title')}</span>
        </div>
        <p className="mb-4 text-xs text-gray-600 leading-relaxed">{t('text')}</p>
        <div className="flex gap-2">
          <button
            onClick={reject}
            className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {t('reject')}
          </button>
          <button
            onClick={accept}
            className="flex-1 rounded-xl px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#F05A1A' }}
          >
            {t('accept')}
          </button>
        </div>
      </div>
    </div>
  )
}
