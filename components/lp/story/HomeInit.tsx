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
    // Vorschau Handschrift „Permanent Marker“: ?font=marker (bleibt für die Sitzung), ?font=caveat schaltet zurück
    try {
      const q = new URLSearchParams(location.search).get('font')
      if (q) sessionStorage.setItem('ef-font', q)
      if ((q ?? sessionStorage.getItem('ef-font')) === 'marker') {
        el.classList.add('hand-marker')
        // Lange Zitate (über ~15 Wörter) etwas kleiner, damit die Versalien nicht erschlagen
        requestAnimationFrame(() => document.querySelectorAll<HTMLElement>('.hm .hand').forEach((h) => {
          if ((h.textContent ?? '').trim().split(/\s+/).length > 15) h.style.fontSize = `${parseFloat(getComputedStyle(h).fontSize) * 0.8}px`
        }))
      }
    } catch { /* Vorschau optional */ }
    try {
      new Function(HOME_JS)()
    } catch (e) {
      console.error('home init', e)
    }
    return () => { delete el.dataset.hm }
  }, [])
  return null
}
