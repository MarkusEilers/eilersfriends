'use client'

import { useEffect } from 'react'
import { ACADEMY_JS } from './academy-assets'

/**
 * Startet Quiz und Animationen der Academy-Seite, sobald alle Sektionen im DOM sind.
 * Jede „story_html“-Sektion bindet das ein; es läuft trotzdem nur einmal pro Seite.
 */
export function AcademyInit() {
  useEffect(() => {
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
