'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Blendet externe Links aus, die der nächtliche Link-Check als nicht erreichbar markiert hat.
 * Reine Text-Links werden zu normalem Text, Buttons/Icons verschwinden. Sobald der Link
 * wieder erreichbar ist, fehlt er in der Liste und erscheint beim nächsten Laden wieder.
 */
const norm = (u: string) => { try { const x = new URL(u); x.hash = ''; return x.toString().replace(/\/$/, '') } catch { return u } }

export function BrokenLinkGuard() {
  const pathname = usePathname()
  useEffect(() => {
    let urls: Set<string> | null = null
    let obs: MutationObserver | null = null
    const apply = () => {
      if (!urls || !urls.size) return
      document.querySelectorAll<HTMLAnchorElement>('a[href^="http"]:not([data-ef-broken])').forEach((a) => {
        if (!urls!.has(norm(a.href))) return
        a.setAttribute('data-ef-broken', '1')
        const textOnly = (a.textContent ?? '').trim().length > 0 && !a.querySelector('svg,img') && !/btn|button|rounded-full/.test(a.className)
        if (textOnly) { a.removeAttribute('href'); a.style.pointerEvents = 'none'; a.style.textDecoration = 'none'; a.style.color = 'inherit' }
        else a.style.display = 'none'
      })
    }
    fetch('/api/links/hidden').then((r) => r.json()).then((d) => {
      urls = new Set(((d?.urls ?? []) as string[]).map(norm))
      if (!urls.size) return
      apply()
      obs = new MutationObserver(apply)
      obs.observe(document.body, { childList: true, subtree: true })
    }).catch(() => {})
    return () => obs?.disconnect()
  }, [pathname])
  return null
}
