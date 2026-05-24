'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

const CONSENT_KEY = 'cookie-consent'
const CONSENT_CHANGE_EVENT = 'ef:consent-changed'

function readConsent(): 'accepted' | 'rejected' | null {
  if (typeof window === 'undefined') return null
  const v = window.localStorage.getItem(CONSENT_KEY)
  if (v === 'accepted' || v === 'rejected') return v
  return null
}

function classifyUa(ua: string): 'desktop' | 'mobile' | 'tablet' | 'bot' {
  const u = ua.toLowerCase()
  if (/bot|crawler|spider|googlebot|bingbot|gptbot/.test(u)) return 'bot'
  if (/ipad|tablet/.test(u)) return 'tablet'
  if (/mobile|iphone|android.*mobile|blackberry/.test(u)) return 'mobile'
  return 'desktop'
}

/**
 * Sends a page view to /api/track when the route changes — but ONLY if the
 * user has given consent via the cookie banner. Listens for consent changes
 * so we start tracking immediately after the user accepts.
 *
 * Re-tracking the same URL within 15s is suppressed (StrictMode / hydration).
 */
export function PageViewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const lastFire = useRef<{ key: string; t: number } | null>(null)
  const consentRef = useRef<'accepted' | 'rejected' | null>(null)

  useEffect(() => {
    consentRef.current = readConsent()
    function onConsent() {
      consentRef.current = readConsent()
      // If consent just got accepted, fire one tracking event for current page.
      if (consentRef.current === 'accepted') fire()
    }
    window.addEventListener(CONSENT_CHANGE_EVENT, onConsent)
    return () => window.removeEventListener(CONSENT_CHANGE_EVENT, onConsent)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fire = () => {
    if (consentRef.current !== 'accepted') return
    const path = pathname ?? '/'
    const qs = searchParams?.toString() ?? ''
    const key = qs ? `${path}?${qs}` : path
    const now = Date.now()
    if (lastFire.current && lastFire.current.key === key && now - lastFire.current.t < 15_000) {
      return
    }
    lastFire.current = { key, t: now }

    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    const referrer = typeof document !== 'undefined' ? document.referrer : ''
    const locale = (typeof document !== 'undefined' && document.documentElement.lang) || 'de'
    const utm = {
      utmSource: searchParams?.get('utm_source') ?? undefined,
      utmMedium: searchParams?.get('utm_medium') ?? undefined,
      utmCampaign: searchParams?.get('utm_campaign') ?? undefined,
    }

    fetch('/api/track', {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        'X-EF-Consent': 'accepted',
      },
      body: JSON.stringify({
        path,
        locale,
        referrer,
        uaClass: classifyUa(ua),
        ...utm,
      }),
    }).catch(() => { /* best-effort */ })
  }

  useEffect(() => {
    fire()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams])

  return null
}
