'use client'

import { useEffect } from 'react'
import { ACADEMY_JS } from './academy-assets'
import { efTrack, rememberContext } from '@/components/analytics/visitor'

declare global {
  interface Window {
    efTrack?: typeof efTrack
    efRemember?: typeof rememberContext
  }
}

/**
 * Startet Quiz und Animationen der Academy-Seite, sobald alle Sektionen im DOM sind.
 * Jede „story_html“-Sektion bindet das ein; es läuft trotzdem nur einmal pro Seite.
 */
export function AcademyInit() {
  useEffect(() => {
    window.efTrack = efTrack
    window.efRemember = rememberContext
    const el = document.documentElement
    if (el.dataset.acd === 'on') return
    el.dataset.acd = 'on'
    try {
      new Function(ACADEMY_JS)()
    } catch (e) {
      console.error('academy init', e)
    }
    return () => { delete el.dataset.acd }
  }, [])
  return null
}
