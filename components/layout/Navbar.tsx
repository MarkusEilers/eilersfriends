'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Menu, X, Globe, ChevronRight, ArrowRight } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { Link, usePathname, useRouter } from '@/lib/i18n/navigation'

const LOCALES = [
  { code: 'de', label: 'DE', flag: '🇩🇪' },
  { code: 'en', label: 'EN', flag: '🇬🇧' },
] as const

// Top-level desktop nav items
const DESKTOP_LINKS = [
  { key: 'programmes', href: '/#programme' },
  { key: 'coaches', href: '/#coaches' },
  { key: 'frameworks', href: '/frameworks' },
  { key: 'results', href: '/#ergebnisse' },
] as const

// Mobile menu structure with sub-groups
type MobileItem =
  | { kind: 'link'; key: string; href: string }
  | { kind: 'group'; label: string; items: { key: string; href: string }[] }

const MOBILE_ITEMS: MobileItem[] = [
  { kind: 'link', key: 'home', href: '/' },
  { kind: 'link', key: 'programmes', href: '/#programme' },
  {
    kind: 'group',
    label: 'team',
    items: [
      { key: 'aljona', href: '/aljona' },
      { key: 'markus', href: '/markus' },
    ],
  },
  {
    kind: 'group',
    label: 'resources',
    items: [
      { key: 'salesmadeFramework', href: '/frameworks' },
      { key: 'liquidLeadership', href: '/aljona#liquid' },
    ],
  },
  { kind: 'link', key: 'results', href: '/#ergebnisse' },
  { kind: 'link', key: 'contact', href: '/kontakt' },
]

export function Navbar() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close mobile menu on route change + lock body scroll while open
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [mobileOpen])

  function switchLocale(code: string) {
    router.replace(pathname, { locale: code })
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/ef-logo.png"
              alt="Eilers+Friends"
              width={180}
              height={46}
              className="h-12 w-auto"
              priority
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {DESKTOP_LINKS.map((link) => (
              <Link
                key={link.key}
                href={link.href as '/'}
                className="text-sm font-normal transition-colors hover:text-orange-600"
                style={{ color: '#1F2937' }}
              >
                {t(link.key)}
              </Link>
            ))}
          </nav>

          {/* Right side: language + CTA */}
          <div className="flex items-center gap-3">

            {/* Language switcher (desktop) */}
            <div className="hidden lg:flex items-center gap-1 text-xs">
              <Globe size={14} className="text-gray-400" />
              {LOCALES.map((l, i) => (
                <button
                  key={l.code}
                  onClick={() => switchLocale(l.code)}
                  className={`font-semibold transition-colors ${
                    locale === l.code ? '' : 'text-gray-400 hover:text-gray-700'
                  }`}
                  style={locale === l.code ? { color: '#F05A1A' } : undefined}
                >
                  {l.label}
                  {i < LOCALES.length - 1 && <span className="mx-1 text-gray-200">·</span>}
                </button>
              ))}
            </div>

            {/* CTA button (desktop) */}
            <a
              href="https://calendly.com/eilersfriends"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#F05A1A' }}
            >
              {t('cta')}
            </a>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 -mr-2 text-gray-700"
              aria-label="Menü öffnen"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer */}
          <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <Image src="/ef-logo.png" alt="" width={150} height={40} className="h-10 w-auto" />
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 -mr-2 text-gray-700"
                aria-label="Menü schließen"
              >
                <X size={22} />
              </button>
            </div>

            {/* Scrollable item list */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <ul className="space-y-1">
                {MOBILE_ITEMS.map((item) => {
                  if (item.kind === 'link') {
                    return (
                      <li key={item.key}>
                        <Link
                          href={item.href as '/'}
                          className="flex items-center justify-between py-3.5 text-base font-medium transition-colors hover:text-orange-600"
                          style={{ color: '#0D0D0B' }}
                        >
                          <span>{t(item.key)}</span>
                          <ChevronRight size={16} className="text-gray-400" />
                        </Link>
                      </li>
                    )
                  }
                  return (
                    <li key={item.label} className="py-2">
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 px-1">
                        {t(item.label)}
                      </p>
                      <ul className="space-y-0.5">
                        {item.items.map((sub) => (
                          <li key={sub.key}>
                            <Link
                              href={sub.href as '/'}
                              className="flex items-center justify-between py-2.5 pl-1 text-base font-medium transition-colors hover:text-orange-600"
                              style={{ color: '#0D0D0B' }}
                            >
                              <span>{t(sub.key)}</span>
                              <ChevronRight size={16} className="text-gray-400" />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Footer of drawer: language picker + CTA */}
            <div className="border-t border-gray-100 px-6 py-5 space-y-4">
              <div>
                <p className="text-xs text-gray-400 mb-2">{t('languagePicker')}</p>
                <div className="grid grid-cols-2 gap-2">
                  {LOCALES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => switchLocale(l.code)}
                      className={`flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold transition-colors ${
                        locale === l.code ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      style={locale === l.code ? { backgroundColor: '#F05A1A' } : undefined}
                    >
                      <span>{l.flag}</span>
                      <span>{l.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <a
                href="https://calendly.com/eilersfriends"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#F05A1A' }}
              >
                {t('bookCta')} <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
