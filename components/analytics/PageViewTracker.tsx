'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { getCookieConsent } from '@/components/layout/CookieBanner'

function classifyUa(ua: string): 'desktop' | 'mobile' | 'tablet' | 'bot' {
  const u = ua.toLowerCase()
  if (/bot|crawler|spider|googlebot|bingbot|gptbot/.test(u)) return 'bot'
  if (/ipad|tablet/.test(u)) return 'tablet'
  if (/mobile|iphone|android.*mobile|blackberry/.test(u)) return 'mobile'
  return 'desktop'
}

/**
 * Sends a page view to /api/track when the route changes.
 * Only when the user has given analytics-consent via the cookie banner.
 */
export function PageViewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const lastFire = useRef<{ key: string; t: number } | null>(null)
  const consentRef = useRef<boolean>(false)

  const fire = () => {
    if (!consentRef.current) return
    const path = pathname ?? '/'
    const qs = searchParams?.toString() ?? ''
    const key = qs ? `${path}?${qs}` : path
    const now = Date.now()
    if (lastFire.current && lastFire.current.key === key && now - lastFire.current.t < 15_000) return
    lastFire.current = { key, t: now }

    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    const referrer = typeof document !== 'undefined' ? document.referrer : ''
    const locale = (typeof document !== 'undefined' && document.documentElement.lang) || 'de'
    fetch('/api/track', {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        'X-EF-Analytics-Consent': '1',
      },
      body: JSON.stringify({
        path,
        locale,
        referrer,
        uaClass: classifyUa(ua),
        utmSource: searchParams?.get('utm_source') ?? undefined,
        utmMedium: searchParams?.get('utm_medium') ?? undefined,
        utmCampaign: searchParams?.get('utm_campaign') ?? undefined,
      }),
    }).catch(() => { /* best-effort */ })
  }

  useEffect(() => {
    consentRef.current = Boolean(getCookieConsent()?.analytics)
    function onConsent() {
      const wasOff = !consentRef.current
      consentRef.current = Boolean(getCookieConsent()?.analytics)
      if (wasOff && consentRef.current) fire()
    }
    window.addEventListener('ef:consent-changed', onConsent)
    return () => window.removeEventListener('ef:consent-changed', onConsent)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fire()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams])

  return null
}
