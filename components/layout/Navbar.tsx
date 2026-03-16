'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Menu, X, Globe } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { Link, usePathname, useRouter } from '@/lib/i18n/navigation'
import { cn } from '@/lib/utils/cn'

const LOCALES = [
  { code: 'de', label: 'DE', flag: '🇩🇪' },
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'ru', label: 'RU', flag: '🇷🇺' },
]

const NAV_LINKS = [
  { key: 'programmes', href: '/programme' },
  { key: 'coaches', href: '#coaches' },
  { key: 'frameworks', href: '#frameworks' },
  { key: 'results', href: '#ergebnisse' },
] as const

export function Navbar() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function switchLocale(code: string) {
    router.replace(pathname, { locale: code })
    setLangOpen(false)
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full transition-all duration-300',
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm'
          : 'bg-white'
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <Image
            src="/ef-logo.png"
            alt="Eilers+Friends"
            width={160}
            height={40}
            className="h-9 w-auto"
            priority
          />
        </Link>

        {/* Desktop Nav — pill style */}
        <nav className="hidden md:flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-1.5">
          {NAV_LINKS.map(({ key, href }) => (
            <Link
              key={key}
              href={href as '/'}
              className="rounded-full px-4 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-white hover:shadow-sm hover:text-gray-900"
            >
              {t(key)}
            </Link>
          ))}
        </nav>

        {/* Right: Lang switcher + CTA */}
        <div className="hidden md:flex items-center gap-3">
          {/* Language switcher */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Globe size={15} />
              {locale.toUpperCase()}
            </button>
            {langOpen && (
              <div className="absolute right-0 mt-1 w-32 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                {LOCALES.map(({ code, label, flag }) => (
                  <button
                    key={code}
                    onClick={() => switchLocale(code)}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50',
                      locale === code ? 'font-semibold text-orange' : 'text-gray-700'
                    )}
                  >
                    <span>{flag}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CTA Button */}
          <a
            href="https://calendly.com/eilersfriends"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#F05A1A' }}
          >
            {t('cta')}
          </a>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2 text-gray-700"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menü öffnen"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-6 pb-6 pt-4">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map(({ key, href }) => (
              <Link
                key={key}
                href={href as '/'}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-3 text-base font-medium text-gray-700 hover:bg-gray-50"
              >
                {t(key)}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex items-center gap-3">
            {LOCALES.map(({ code, flag, label }) => (
              <button
                key={code}
                onClick={() => { switchLocale(code); setMobileOpen(false) }}
                className={cn(
                  'flex items-center gap-1 rounded-full px-3 py-1.5 text-sm border',
                  locale === code
                    ? 'border-orange bg-orange-bg font-semibold text-orange'
                    : 'border-gray-200 text-gray-600'
                )}
              >
                {flag} {label}
              </button>
            ))}
          </div>
          <a
            href="https://calendly.com/eilersfriends"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex w-full items-center justify-center rounded-full py-3 text-sm font-semibold text-white"
            style={{ backgroundColor: '#F05A1A' }}
          >
            {t('cta')}
          </a>
        </div>
      )}
    </header>
  )
}
