'use client'

import { useEffect } from 'react'
import { HOME_JS } from './home-assets'
import { efTrack, rememberContext } from '@/components/analytics/visitor'

/** Startet Quiz und Newsletter-Formular der Startseite, einmal pro Seitenaufruf. */
export function HomeInit() {
  useEffect(() => {
    window.efTrack = efTrack
    window.efRemember = rememberContext
    const el = document.documentElement
    if (el.dataset.hm === 'on') return
    el.dataset.hm = 'on'
    try {
      new Function(HOME_JS)()
    } catch (e) {
      console.error('home init', e)
    }
    return () => { delete el.dataset.hm }
  }, [])
  return null
}
