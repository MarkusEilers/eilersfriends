'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import {
  Menu, X, ChevronRight, ChevronDown, ArrowRight, User,
  Briefcase, Sparkles, Users, MessageCircle,
  LayoutGrid, ClipboardCheck, BookOpen, Newspaper,
  type LucideIcon,
} from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { Link, usePathname, useRouter } from '@/lib/i18n/navigation'

const LOCALES = [
  { code: 'de', label: 'DE', flag: '🇩🇪' },
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'es', label: 'ES', flag: '🇪🇸' },
] as const

/* ─── Navigation IA ─────────────────────────────────────────────────────────
   5 top-level items:
   - Programme (mega)
   - Frameworks (mega)
   - Team (mega)
   - Ergebnisse (direct link)
   - Kontakt (direct link)
   ─────────────────────────────────────────────────────────────────────────── */

interface MegaLink {
  key: string
  descKey: string
  href: string
  icon: LucideIcon
  accent: string
  /** Optional Avatar — wenn gesetzt, wird das Bild statt des Icons gezeigt. */
  avatar?: string
}

interface MegaItem {
  kind: 'mega'
  key: string
  eyebrowKey: string
  headingKey: string
  links: MegaLink[]
  featured?: {
    titleKey: string
    bodyKey: string
    ctaKey: string
    href: string
    accent: string
    bg: string
  }
}

interface DirectItem {
  kind: 'link'
  key: string
  href: string
}

type NavItem = MegaItem | DirectItem

const NAV_ITEMS: NavItem[] = [
  {
    kind: 'mega',
    key: 'programmes',
    eyebrowKey: 'programmesEyebrow',
    headingKey: 'programmesHeading',
    links: [
      { key: 'salesmade',        descKey: 'salesmadeDesc',        href: '/salesmade',  icon: Briefcase,      accent: '#1A5FD4' },
      { key: 'liquidLeadership', descKey: 'liquidLeadershipDesc', href: '/aljona',     icon: Sparkles,       accent: '#D4192B' },
      { key: 'teamCoaching',     descKey: 'teamCoachingDesc',     href: '/kontakt',    icon: Users,          accent: '#6B5CE7' },
      { key: 'oneOnOne',         descKey: 'oneOnOneDesc',         href: '/kontakt',    icon: MessageCircle,  accent: '#B07C0A' },
    ],
    featured: {
      titleKey: 'featuredProgrammesTitle',
      bodyKey:  'featuredProgrammesBody',
      ctaKey:   'featuredProgrammesCta',
      href: '/salesmade#pricing',
      accent: '#1A5FD4',
      bg: 'linear-gradient(135deg, #EBF1FF 0%, #BBCFF5 100%)',
    },
  },
  {
    kind: 'mega',
    key: 'frameworks',
    eyebrowKey: 'frameworksEyebrow',
    headingKey: 'frameworksHeading',
    links: [
      { key: 'frameworksHub',      descKey: 'frameworksHubDesc',      href: '/frameworks',         icon: LayoutGrid,    accent: '#1A5FD4' },
      { key: 'salesmadeFramework', descKey: 'salesmadeFrameworkDesc', href: '/frameworks',          icon: Briefcase,     accent: '#1A5FD4' },
      { key: 'discoveryScorecard', descKey: 'discoveryScorecardDesc', href: '/frameworks',          icon: ClipboardCheck, accent: '#0F1E3A' },
      { key: 'blog',               descKey: 'blogDesc',               href: '/blog',               icon: Newspaper,     accent: '#6B5CE7' },
    ],
  },
  {
    kind: 'mega',
    key: 'team',
    eyebrowKey: 'teamEyebrow',
    headingKey: 'teamHeading',
    links: [
      { key: 'aljona', descKey: 'aljonaDesc', href: '/aljona', icon: Sparkles, accent: '#D4192B', avatar: '/aljona-photo.jpg' },
      { key: 'markus', descKey: 'markusDesc', href: '/markus', icon: Briefcase, accent: '#1A5FD4', avatar: '/markus-photo.jpg' },
      { key: 'about',  descKey: 'aboutDesc',  href: '/#coaches', icon: BookOpen, accent: '#0F1E3A' },
    ],
  },
  { kind: 'link', key: 'results', href: '/#ergebnisse' },
  { kind: 'link', key: 'contact', href: '/kontakt' },
]

export function Navbar({ calendlyUrl }: { calendlyUrl: string }) {
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [openMega, setOpenMega] = useState<string | null>(null)
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null)
  const langRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setMobileOpen(false); setOpenMega(null) }, [pathname])

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [mobileOpen])

  useEffect(() => {
    if (!langOpen) return
    function handleClick(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [langOpen])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpenMega(null)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  function switchLocale(code: string) {
    router.replace(pathname, { locale: code })
  }

  function handleMegaEnter(key: string) {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null }
    setOpenMega(key)
  }
  function handleMegaLeave() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setOpenMega(null), 150)
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image src="/ef-logo.png" alt="Eilers+Friends" width={200} height={56}
              className="h-14 md:h-16 w-auto object-contain" priority />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Hauptnavigation">
            {NAV_ITEMS.map((item) => {
              if (item.kind === 'link') {
                return (
                  <Link key={item.key} href={item.href as '/'}
                    className="px-3.5 py-2 text-sm font-medium rounded-full transition-colors hover:text-blue-600 hover:bg-gray-50"
                    style={{ color: '#1F2937' }}>
                    {t(item.key)}
                  </Link>
                )
              }
              const isOpen = openMega === item.key
              return (
                <div key={item.key}
                  className="relative"
                  onMouseEnter={() => handleMegaEnter(item.key)}
                  onMouseLeave={handleMegaLeave}>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 px-3.5 py-2 text-sm font-medium rounded-full transition-colors hover:text-blue-600 hover:bg-gray-50"
                    style={{ color: '#1F2937' }}
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                    onFocus={() => handleMegaEnter(item.key)}
                  >
                    {t(item.key)}
                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              )
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {LOCALES.length > 1 && (
              <div ref={langRef} className="hidden lg:block relative">
                <button onClick={() => setLangOpen((v) => !v)}
                  className="flex items-center gap-1.5 rounded-full px-2 py-1.5 text-sm transition-colors hover:bg-gray-50"
                  aria-label="Sprache wechseln" aria-expanded={langOpen}>
                  <span className="text-base leading-none">{LOCALES.find((l) => l.code === locale)?.flag ?? '🌐'}</span>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
                </button>
                {langOpen && (
                  <div className="absolute right-0 top-full mt-2 w-44 rounded-2xl bg-white p-2 shadow-lg" style={{ border: '1px solid #E5E7EB' }}>
                    {LOCALES.map((l) => {
                      const active = locale === l.code
                      return (
                        <button key={l.code}
                          onClick={() => { switchLocale(l.code); setLangOpen(false) }}
                          className="flex w-full items-center gap-3 rounded-full px-3 py-2 text-sm transition-colors"
                          style={active ? { backgroundColor: '#EBF1FF', color: '#1A5FD4', fontWeight: 600 } : { color: '#1F2937' }}>
                          <span className="text-base leading-none">{l.flag}</span>
                          <span>{l.code === 'de' ? 'Deutsch' : l.code === 'en' ? 'English' : 'Español'}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            <Link href="/clients" className="hidden lg:inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50">
              <User size={13} /> {t('clients')}
            </Link>

            <a href={calendlyUrl} target="_blank" rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#1A5FD4' }}>
              {t('cta')}
            </a>

            <button onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 -mr-2 text-gray-700" aria-label="Menü öffnen">
              <Menu size={22} />
            </button>
          </div>
        </div>

        {/* ─── Mega-menu panels (one shared overlay area) ─── */}
        <div
          className="hidden lg:block absolute inset-x-0 top-full"
          onMouseEnter={() => { if (openMega) handleMegaEnter(openMega) }}
          onMouseLeave={handleMegaLeave}
        >
          {NAV_ITEMS.filter((i): i is MegaItem => i.kind === 'mega').map((item) => {
            const isOpen = openMega === item.key
            return (
              <div
                key={item.key}
                className={`pointer-events-${isOpen ? 'auto' : 'none'} transition-all duration-200 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'}`}
                style={{ position: isOpen ? 'relative' : 'absolute', inset: 0 }}
                aria-hidden={!isOpen}
              >
                {isOpen && (
                  <div className="bg-white border-b border-gray-100 shadow-2xl">
                    <div className="mx-auto max-w-7xl px-6 py-8">
                      <div className={`grid gap-8 ${item.featured ? 'lg:grid-cols-[1fr_360px]' : ''}`}>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: '#1A5FD4' }}>
                            {t(item.eyebrowKey)}
                          </p>
                          <h3 className="mt-2 text-xl font-bold" style={{ color: '#0D0D0B' }}>
                            {t(item.headingKey)}
                          </h3>
                          <div className="mt-6 grid grid-cols-2 gap-3">
                            {item.links.map((link) => {
                              const Icon = link.icon
                              return (
                                <Link key={link.key} href={link.href as '/'} onClick={() => setOpenMega(null)}
                                  className="group flex items-start gap-3 rounded-2xl p-3 transition-colors hover:bg-gray-50">
                                  {link.avatar ? (
                                    <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full" style={{ border: `2px solid ${link.accent}` }}>
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={link.avatar} alt={link.key} className="h-full w-full object-cover" />
                                    </div>
                                  ) : (
                                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                                      style={{ backgroundColor: `${link.accent}15`, color: link.accent }}>
                                      <Icon size={16} />
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: '#0D0D0B' }}>
                                      {t(link.key)}
                                      <ArrowRight size={12} className="opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" style={{ color: link.accent }} />
                                    </div>
                                    <p className="mt-0.5 text-xs leading-snug" style={{ color: '#6B7280' }}>
                                      {t(link.descKey)}
                                    </p>
                                  </div>
                                </Link>
                              )
                            })}
                          </div>
                        </div>
                        {item.featured && (
                          <Link href={item.featured.href as '/'} onClick={() => setOpenMega(null)}
                            className="group flex flex-col justify-between rounded-2xl p-6 transition-transform hover:scale-[1.01]"
                            style={{ background: item.featured.bg }}>
                            <div>
                              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                                style={{ backgroundColor: 'rgba(255,255,255,0.5)', color: item.featured.accent }}>
                                <Sparkles size={10} /> {t("firstThirtyBadge")}
                              </span>
                              <h4 className="mt-3 text-lg font-bold" style={{ color: '#0D0D0B' }}>
                                {t(item.featured.titleKey)}
                              </h4>
                              <p className="mt-2 text-sm leading-relaxed" style={{ color: '#374151' }}>
                                {t(item.featured.bodyKey)}
                              </p>
                            </div>
                            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: item.featured.accent }}>
                              {t(item.featured.ctaKey)} <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                            </span>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <Image src="/ef-logo.png" alt="" width={180} height={48} className="h-12 w-auto object-contain" />
              <button onClick={() => setMobileOpen(false)} className="p-2 -mr-2 text-gray-700" aria-label="Menü schließen">
                <X size={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <ul className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  if (item.kind === 'link') {
                    return (
                      <li key={item.key}>
                        <Link href={item.href as '/'} className="flex items-center justify-between py-3.5 text-base font-medium transition-colors hover:text-blue-600" style={{ color: '#0D0D0B' }}>
                          <span>{t(item.key)}</span>
                          <ChevronRight size={16} className="text-gray-400" />
                        </Link>
                      </li>
                    )
                  }
                  const expanded = mobileExpanded === item.key
                  return (
                    <li key={item.key}>
                      <button
                        type="button"
                        onClick={() => setMobileExpanded(expanded ? null : item.key)}
                        className="flex w-full items-center justify-between py-3.5 text-base font-medium transition-colors hover:text-blue-600"
                        style={{ color: '#0D0D0B' }}
                        aria-expanded={expanded}
                      >
                        <span>{t(item.key)}</span>
                        <ChevronDown size={16} className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                      </button>
                      {expanded && (
                        <ul className="mb-2 ml-1 space-y-0.5 border-l-2 border-gray-100 pl-3">
                          {item.links.map((sub) => {
                            const Icon = sub.icon
                            return (
                              <li key={sub.key}>
                                <Link href={sub.href as '/'} className="flex items-start gap-3 py-2.5 transition-colors hover:text-blue-600" style={{ color: '#0D0D0B' }}>
                                  {sub.avatar ? (
                                    <div className="h-6 w-6 flex-shrink-0 overflow-hidden rounded-full" style={{ border: `1.5px solid ${sub.accent}` }}>
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={sub.avatar} alt={sub.key} className="h-full w-full object-cover" />
                                    </div>
                                  ) : (
                                    <Icon size={15} className="mt-0.5 flex-shrink-0" style={{ color: sub.accent }} />
                                  )}
                                  <div className="min-w-0">
                                    <span className="text-sm font-semibold">{t(sub.key)}</span>
                                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">{t(sub.descKey)}</p>
                                  </div>
                                </Link>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>

            <div className="border-t border-gray-100 px-6 py-5 space-y-4">
              {LOCALES.length > 1 && (
                <div>
                  <p className="text-xs text-gray-400 mb-2">{t('languagePicker')}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {LOCALES.map((l) => (
                      <button key={l.code} onClick={() => switchLocale(l.code)}
                        className={`flex items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-semibold transition-colors ${
                          locale === l.code ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        style={locale === l.code ? { backgroundColor: '#1A5FD4' } : undefined}>
                        <span>{l.flag}</span><span>{l.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <a href={calendlyUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#1A5FD4' }}>
                {t('bookCta')} <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
