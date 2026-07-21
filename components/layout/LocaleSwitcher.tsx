'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { usePathname, useRouter } from '@/lib/i18n/navigation'
import { ChevronDown } from 'lucide-react'

const LOCALES = [
  { code: 'de', label: 'DE', flag: '🇩🇪', name: 'Deutsch' },
  { code: 'en', label: 'EN', flag: '🇬🇧', name: 'English' },
  { code: 'es', label: 'ES', flag: '🇪🇸', name: 'Español' },
]

export function LocaleSwitcher({ className = '' }: { className?: string }) {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0]

  function switchTo(code: string) {
    router.replace(pathname, { locale: code })
    setOpen(false)
  }

  return (
    <div className={`relative ${className}`}>
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-2.5 py-1.5 text-sm hover:bg-gray-50"
        aria-label="Sprache wählen">
        <span className="text-base leading-none">{current.flag}</span>
        <span className="text-xs font-semibold text-gray-600">{current.label}</span>
        <ChevronDown size={13} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 z-20 mt-1 w-36 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
            {LOCALES.map((l) => (
              <button key={l.code} onClick={() => switchTo(l.code)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-sm ${l.code === locale ? 'font-semibold text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span>{l.flag}</span><span>{l.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
