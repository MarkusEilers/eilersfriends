/**
 * Logo einer Firma finden: Wikipedia-Infobox, Logo-Bilder und Inline-SVG auf der
 * Website, Icons, zuletzt das Favicon. Ohne Auth — genutzt vom Admin-Logo-Finder
 * und vom ASK-Report (Logo des Teilnehmers).
 */
export interface LogoCandidate { url: string; label: string; kind: 'svg' | 'img' | 'icon'; score?: number }

export const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36'

export function cleanDomain(v: string | null | undefined): string {
  return String(v ?? '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '')
}

function abs(u: string, base: string): string | null {
  try { return new URL(u.replace(/&amp;/g, '&'), base).toString() } catch { return null }
}

export async function findLogoCandidates(domain: string, name?: string): Promise<LogoCandidate[]> {
  const d = cleanDomain(domain)
  if (!d) return []
  const out: LogoCandidate[] = []
  const add = (c: LogoCandidate | null) => { if (c && !out.some((o) => o.url === c.url)) out.push(c) }
  const stem = d.split('.')[0]
  // Wikipedia: Logo aus der Infobox (Feld „logo“), sonst das Seitenbild, wenn es nach Logo aussieht
  if (name) {
    const UAW = { 'user-agent': 'EilersFriendsLogoFinder/1.0 (team@eilersfriends.com)' }
    for (const lang of ['en', 'de']) {
      try {
        const api = `https://${lang}.wikipedia.org/w/api.php?format=json&redirects=1`
        let src: string | undefined
        const p = await fetch(`${api}&action=parse&prop=wikitext&section=0&page=${encodeURIComponent(name)}`, { headers: UAW, cache: 'no-store', signal: AbortSignal.timeout(6000) })
        if (p.ok) {
          const wt = ((await p.json()) as { parse?: { wikitext?: { '*': string } } }).parse?.wikitext?.['*'] ?? ''
          let file = /\|\s*logo\s*=\s*(?:\[\[(?:File|Datei|Image|Bild):)?([^\n|\]]+\.(?:svg|png|jpe?g|webp))/i.exec(wt)?.[1]?.trim()
          if (file) {
            const q = await fetch(`${api}&action=query&prop=imageinfo&iiprop=url&titles=${encodeURIComponent('File:' + file)}`, { headers: UAW, cache: 'no-store', signal: AbortSignal.timeout(6000) })
            const pages = ((await q.json()) as { query?: { pages?: Record<string, { imageinfo?: { url: string }[] }> } }).query?.pages ?? {}
            src = Object.values(pages)[0]?.imageinfo?.[0]?.url
          }
        }
        if (!src) {
          const r = await fetch(`${api}&action=query&prop=pageimages&piprop=original&titles=${encodeURIComponent(name)}`, { headers: UAW, cache: 'no-store', signal: AbortSignal.timeout(6000) })
          const pi = Object.values(((await r.json()) as { query?: { pages?: Record<string, { original?: { source: string } }> } }).query?.pages ?? {})[0]?.original?.source
          if (pi && /logo/i.test(pi)) src = pi
        }
        // Nur übernehmen, wenn der Dateiname zur Firma passt (verhindert falsche Artikel, z. B. Weiterleitungen)
        const plain = (x: string) => x.toLowerCase().replace(/[^a-z0-9]/g, '')
        const fileName = decodeURIComponent((src ?? '').split('/').pop() ?? '')
        if (src && !(plain(fileName).includes(plain(stem)) || plain(fileName).includes(plain(name.split(/\s+/).pop() ?? '')))) src = undefined
        if (src) { add({ url: src.split('?')[0], label: `Logo (Wikipedia ${lang.toUpperCase()})`, kind: /\.svg/i.test(src) ? 'svg' : 'img', score: 90 }); break }
      } catch { /* ignore */ }
    }
  }
  let html = ''
  let base = `https://${d}/`
  for (const u of [`https://www.${d}/`, `https://${d}/`]) {
    try {
      const r = await fetch(u, { headers: { 'user-agent': UA, accept: 'text/html' }, redirect: 'follow', cache: 'no-store', signal: AbortSignal.timeout(8000) })
      if (r.ok) { html = (await r.text()).slice(0, 600000); base = r.url; break }
    } catch { /* next */ }
  }
  if (html) {
    // 1) <img> mit „logo“ in src/alt/class/id
    for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
      const tag = m[0]
      if (!/logo/i.test(tag)) continue
      const src = /\bsrc=["']([^"']+)["']/i.exec(tag)?.[1] || /\bdata-src=["']([^"']+)["']/i.exec(tag)?.[1]
      if (!src || src.startsWith('data:image/gif')) continue
      const u = abs(src, base)
      // Eigenes Logo (Name der Firma in Pfad/Alt) vor fremden Logos (Kunden, Partner, Siegel)
      const own = stem && tag.toLowerCase().includes(stem)
      if (u) add({ url: u, label: own ? 'Logo auf der Website' : 'Bild mit „logo“ (evtl. Partner)', kind: /\.svg(\?|$)/i.test(u) ? 'svg' : 'img', score: own ? 100 : 20 })
      if (out.length >= 8) break
    }
    // 2) Inline-SVG in der Nähe von „logo“
    for (const m of html.matchAll(/<(a|div|span|figure|header)\b[^>]*logo[^>]*>\s*(<svg[\s\S]*?<\/svg>)/gi)) {
      const svg = m[2]
      if (svg.length > 400 && svg.length < 120000) {
        const withNs = svg.includes('xmlns=') ? svg : svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
        add({ url: `data:image/svg+xml;base64,${Buffer.from(withNs).toString('base64')}`, label: 'Logo (SVG im Seitenkopf)', kind: 'svg', score: 80 })
      }
      if (out.filter((o) => o.kind === 'svg').length >= 2) break
    }
    // 3) Icons aus <link>
    for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
      const tag = m[0]
      const rel = /\brel=["']([^"']+)["']/i.exec(tag)?.[1]?.toLowerCase() ?? ''
      const href = /\bhref=["']([^"']+)["']/i.exec(tag)?.[1]
      if (!href) continue
      if (rel.includes('mask-icon') || (rel.includes('icon') && /\.svg(\?|$)/i.test(href))) add({ url: abs(href, base)!, label: 'Icon (SVG)', kind: 'icon', score: 10 })
      else if (rel.includes('apple-touch-icon')) add({ url: abs(href, base)!, label: 'App-Icon', kind: 'icon', score: 10 })
    }
  }
  add({ url: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(d)}&sz=128`, label: 'Favicon (Notlösung)', kind: 'icon', score: 1 })
  return out.filter((c) => c.url).sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 8)
}

