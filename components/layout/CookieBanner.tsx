'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Cookie, ChevronDown, ChevronUp } from 'lucide-react'

/**
 * Cookie consent banner — TTDSG/DSGVO-konform mit zwei separaten Toggles:
 * - Analyse-Cookies (Vercel Analytics, Performance-Metriken)
 * - Marketing-Cookies (Retargeting, Conversion-Tracking)
 *
 * Technisch erforderliche Cookies werden NICHT toggle-bar abgefragt — sie sind
 * für den Betrieb der Seite notwendig (Auth-Session, Spracheinstellung etc.).
 *
 * Persistenz in localStorage als JSON: { analytics: boolean, marketing: boolean, ts: ISO }.
 * Andere Komponenten können den Consent via `getCookieConsent()` lesen.
 */

export interface CookieConsent {
  analytics: boolean
  marketing: boolean
  ts: string
}

const STORAGE_KEY = 'ef-cookie-consent-v2'

export function getCookieConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as CookieConsent
  } catch { return null }
}

export function CookieBanner() {
  const t = useTranslations('cookie')
  const [show, setShow] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [analytics, setAnalytics] = useState(true)
  const [marketing, setMarketing] = useState(false)

  useEffect(() => {
    const existing = getCookieConsent()
    if (!existing) setShow(true)
    // Wieder-Oeffnen ueber Footer-Link (#cookie-settings) ODER Custom-Event —
    // Legal-Pflicht: Widerruf so einfach wie die Zustimmung.
    const openSettings = () => { setShow(true); setExpanded(true) }
    const onHash = () => { if (typeof window !== 'undefined' && window.location.hash === '#cookie-settings') { openSettings(); window.history.replaceState(null, '', window.location.pathname + window.location.search) } }
    onHash()
    window.addEventListener('hashchange', onHash)
    window.addEventListener('ef:open-cookie-settings', openSettings as EventListener)
    return () => {
      window.removeEventListener('hashchange', onHash)
      window.removeEventListener('ef:open-cookie-settings', openSettings as EventListener)
    }
  }, [])

  function save(consent: CookieConsent) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent))
    setShow(false)
    // Broadcast so client components (e.g. Analytics) can react
    window.dispatchEvent(new CustomEvent('ef:consent-changed', { detail: consent }))
  }

  function acceptAll() {
    save({ analytics: true, marketing: true, ts: new Date().toISOString() })
  }

  function rejectAll() {
    save({ analytics: false, marketing: false, ts: new Date().toISOString() })
  }

  function saveSelection() {
    save({ analytics, marketing, ts: new Date().toISOString() })
  }

  if (!show) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-6 md:max-w-md">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center gap-2">
          <Cookie size={18} style={{ color: '#1A5FD4' }} className="flex-shrink-0" />
          <span className="font-semibold text-sm text-gray-900">{t('title')}</span>
        </div>
        <p className="mb-3 text-xs text-gray-600 leading-relaxed">
          {t('intro')}
          {' '}
          <a href="/datenschutz" className="underline" style={{ color: '#1A5FD4' }}>
            {t('privacyLink')}
          </a>
        </p>

        {/* Toggle area — expanded view */}
        {expanded && (
          <div className="mb-4 space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
            <ToggleRow
              checked={analytics}
              onChange={setAnalytics}
              label={t('analyticsLabel')}
              body={t('analyticsBody')}
            />
            <ToggleRow
              checked={marketing}
              onChange={setMarketing}
              label={t('marketingLabel')}
              body={t('marketingBody')}
            />
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col gap-2">
          {!expanded ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={rejectAll}
                  className="rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  {t('rejectAll')}
                </button>
                <button
                  onClick={acceptAll}
                  className="rounded-xl px-3 py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#1A5FD4' }}
                >
                  {t('acceptAll')}
                </button>
              </div>
              <button
                onClick={() => setExpanded(true)}
                className="inline-flex items-center justify-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition-colors hover:bg-gray-50"
                style={{ color: '#1A5FD4' }}
              >
                <ChevronDown size={11} /> {t('individualSelection')}
              </button>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={rejectAll}
                  className="rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  {t('rejectAll')}
                </button>
                <button
                  onClick={acceptAll}
                  className="rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  {t('acceptAll')}
                </button>
              </div>
              <button
                onClick={saveSelection}
                className="rounded-xl px-3 py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#1A5FD4' }}
              >
                {t('saveSelection')}
              </button>
              <button
                onClick={() => setExpanded(false)}
                className="inline-flex items-center justify-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-gray-500 transition-colors hover:bg-gray-50"
              >
                <ChevronUp size={11} /> {t('showLess')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function ToggleRow({
  checked, onChange, label, body,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  body: string
}) {
  return (
    <label className="flex gap-3 cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative mt-0.5 flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors"
        style={{ backgroundColor: checked ? '#1A5FD4' : '#D1D5DB' }}
      >
        <span
          className="absolute h-4 w-4 rounded-full bg-white transition-transform"
          style={{ transform: checked ? 'translateX(18px)' : 'translateX(2px)' }}
        />
      </button>
      <div className="flex-1">
        <div className="text-xs font-bold" style={{ color: '#0D0D0B' }}>{label}</div>
        <p className="mt-0.5 text-[11px] leading-relaxed text-gray-600">{body}</p>
      </div>
    </label>
  )
}
