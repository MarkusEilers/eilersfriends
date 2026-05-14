'use client'

/**
 * Mounts <Analytics /> only if the user has given analytics consent.
 * Listens to the 'ef:consent-changed' event so analytics turn on the
 * second the user toggles it, without a page reload.
 */
import { useEffect, useState } from 'react'
import { Analytics } from '@vercel/analytics/next'
import { getCookieConsent, type CookieConsent } from './CookieBanner'

export function AnalyticsGate() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const initial = getCookieConsent()
    if (initial?.analytics) setEnabled(true)

    function onChange(e: Event) {
      const c = (e as CustomEvent<CookieConsent>).detail
      setEnabled(!!c?.analytics)
    }
    window.addEventListener('ef:consent-changed', onChange)
    return () => window.removeEventListener('ef:consent-changed', onChange)
  }, [])

  if (!enabled) return null
  return <Analytics />
}
