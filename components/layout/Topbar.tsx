'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'

/** variant="mystery": Landingpage-Leiste in Blau, ohne Link — Text aus topbar.mystery */
export function Topbar({ variant }: { variant?: 'mystery' } = {}) {
  const [visible, setVisible] = useState(true)
  const t = useTranslations('topbar')

  if (!visible) return null

  return (
    <div
      className="relative z-50 flex items-center justify-center gap-3 px-4 py-2.5 text-sm font-medium text-white"
      style={{ backgroundColor: variant === 'mystery' ? '#1A5FD4' : '#6B5CE7' }}
    >
      <span>{variant === 'mystery' ? t('mystery') : t('message')}</span>
      {!variant && <Link
        href="/academy"
        className="underline underline-offset-2 opacity-90 hover:opacity-100 transition-opacity"
      >
        {t('link')} →
      </Link>}
      <button
        onClick={() => setVisible(false)}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Schließen"
      >
        <X size={16} />
      </button>
    </div>
  )
}
