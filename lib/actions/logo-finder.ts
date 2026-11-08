'use server'

import { revalidatePath } from 'next/cache'
import { sql } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { upsertTrustLogo } from '@/lib/db/queries/trust-logos'

/**
 * Logo per Firmenname hinzufügen:
 *  1) suggestCompaniesAction — Vorschläge aus dem CRM (companies + company_profile) und dem Web (Clearbit Autocomplete)
 *  2) findLogoCandidatesAction — lädt die Website der Firma und sucht das Logo (img/svg mit „logo“, SVG-Favicon, Touch-Icon, Favicon)
 *  3) quickAddLogoAction — lädt das gewählte Logo selbst herunter, legt Farb- + S/W-Version in Blob ab und trägt es ein
 */

export interface CompanySuggestion { name: string; domain: string; source: 'crm' | 'web'; logo?: string | null }
export interface LogoCandidate { url: string; label: string; kind: 'svg' | 'img' | 'icon' }

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36'

async function requireAdmin() {
  const s = await auth()
  if (!s?.user || (s.user.role !== 'admin' && s.user.role !== 'coach')) throw new Error('unauthorized')
}

function cleanDomain(v: string | null | undefined): string {
  return String(v ?? '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '')
}

function slugify(s: string): string {
  return s.trim().toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function rows<T>(res: unknown): T[] {
  return (Array.isArray(res) ? res : ((res as { rows?: unknown[] }).rows ?? [])) as T[]
}

export async function suggestCompaniesAction(query: string): Promise<CompanySuggestion[]> {
  await requireAdmin()
  const q = query.trim()
  if (q.length < 2) return []
  const out: CompanySuggestion[] = []
  // CRM zuerst
  try {
    const res = await db.execute(sql`
      SELECT c.name, coalesce(nullif(c.domain,''), c.website) AS domain, cp.logo_url
      FROM companies c LEFT JOIN company_profile cp ON cp.company_id = c.id
      WHERE c.merged_into IS NULL AND (c.name ILIKE ${'%' + q + '%'} OR c.domain ILIKE ${'%' + q + '%'})
      ORDER BY (lower(c.name) = lower(${q})) DESC, length(c.name) LIMIT 6`)
    for (const r of rows<{ name: string; domain: string | null; logo_url: string | null }>(res)) {
      const d = cleanDomain(r.domain)
      out.push({ name: r.name, domain: d, source: 'crm', logo: r.logo_url })
    }
  } catch { /* CRM optional */ }
  // Web-Vorschläge
  try {
    const r = await fetch(`https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(q)}`, { cache: 'no-store', signal: AbortSignal.timeout(6000) })
    if (r.ok) {
      const list = (await r.json()) as { name: string; domain: string }[]
      for (const c of list.slice(0, 6)) {
        const d = cleanDomain(c.domain)
        if (d && !out.some((o) => o.domain === d)) out.push({ name: c.name, domain: d, source: 'web' })
      }
    }
  } catch { /* ignore */ }
  // Gängige Endungen nach vorn (Clearbit liefert oft Länder-Domains zuerst)
  const rank = (d: string) => { const i = ['.com', '.de', '.io', '.co', '.ai', '.eu', '.at', '.ch'].findIndex((t) => d.endsWith(t)); return i < 0 ? 99 : i }
  out.sort((a, b) => (a.source === b.source ? rank(a.domain) - rank(b.domain) : a.source === 'crm' ? -1 : 1))
  // Fallback: Eingabe als Domain
  if (!out.length && q.includes('.')) out.push({ name: q, domain: cleanDomain(q), source: 'web' })
  return out.slice(0, 8)
}

function abs(u: string, base: string): string | null {
  try { return new URL(u.replace(/&amp;/g, '&'), base).toString() } catch { return null }
}

export async function findLogoCandidatesAction(domain: string): Promise<LogoCandidate[]> {
  await requireAdmin()
  const d = cleanDomain(domain)
  if (!d) return []
  const out: LogoCandidate[] = []
  const add = (c: LogoCandidate | null) => { if (c && !out.some((o) => o.url === c.url)) out.push(c) }
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
      if (u) add({ url: u, label: 'Logo auf der Website', kind: /\.svg(\?|$)/i.test(u) ? 'svg' : 'img' })
      if (out.length >= 4) break
    }
    // 2) Inline-SVG in der Nähe von „logo“
    for (const m of html.matchAll(/<(a|div|span|figure|header)\b[^>]*logo[^>]*>\s*(<svg[\s\S]*?<\/svg>)/gi)) {
      const svg = m[2]
      if (svg.length > 400 && svg.length < 120000) {
        const withNs = svg.includes('xmlns=') ? svg : svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
        add({ url: `data:image/svg+xml;base64,${Buffer.from(withNs).toString('base64')}`, label: 'Logo (SVG im Seitenkopf)', kind: 'svg' })
      }
      if (out.filter((o) => o.kind === 'svg').length >= 2) break
    }
    // 3) Icons aus <link>
    for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
      const tag = m[0]
      const rel = /\brel=["']([^"']+)["']/i.exec(tag)?.[1]?.toLowerCase() ?? ''
      const href = /\bhref=["']([^"']+)["']/i.exec(tag)?.[1]
      if (!href) continue
      if (rel.includes('mask-icon') || (rel.includes('icon') && /\.svg(\?|$)/i.test(href))) add({ url: abs(href, base)!, label: 'Icon (SVG)', kind: 'icon' })
      else if (rel.includes('apple-touch-icon')) add({ url: abs(href, base)!, label: 'App-Icon', kind: 'icon' })
    }
  }
  add({ url: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(d)}&sz=128`, label: 'Favicon (Notlösung)', kind: 'icon' })
  return out.filter((c) => c.url).slice(0, 8)
}

export async function quickAddLogoAction(input: { name: string; domain: string; logoUrl: string; categories: string[] }): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin()
  const name = input.name.trim()
  if (!name || !input.logoUrl) return { ok: false, error: 'Name und Logo nötig' }
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN
  if (!blobToken) return { ok: false, error: 'BLOB_READ_WRITE_TOKEN fehlt' }
  let buf: Buffer
  let type = ''
  try {
    if (input.logoUrl.startsWith('data:')) {
      const m = /^data:([^;]+);base64,(.*)$/.exec(input.logoUrl)
      if (!m) return { ok: false, error: 'Ungültige Bilddaten' }
      type = m[1]; buf = Buffer.from(m[2], 'base64')
    } else {
      const r = await fetch(input.logoUrl, { headers: { 'user-agent': UA }, cache: 'no-store', signal: AbortSignal.timeout(10000) })
      if (!r.ok) return { ok: false, error: `Logo nicht ladbar (${r.status})` }
      type = (r.headers.get('content-type') || '').split(';')[0]
      buf = Buffer.from(await r.arrayBuffer())
    }
  } catch { return { ok: false, error: 'Logo konnte nicht geladen werden' } }
  const isSvg = type.includes('svg') || buf.subarray(0, 300).toString().includes('<svg')
  const ext = isSvg ? 'svg' : type.includes('jpeg') ? 'jpg' : type.includes('webp') ? 'webp' : 'png'
  const contentType = isSvg ? 'image/svg+xml' : ext === 'jpg' ? 'image/jpeg' : ext === 'webp' ? 'image/webp' : 'image/png'
  const slug = slugify(name)
  const { put } = await import('@vercel/blob')
  let src: string
  let srcBw: string | null = null
  try {
    // .ico / unbekannte Rasterformate in PNG umwandeln
    if (!isSvg && !['image/png', 'image/jpeg', 'image/webp'].includes(type)) {
      const sharp = (await import('sharp')).default
      buf = await sharp(buf).png().toBuffer()
    }
    src = (await put(`trust-logos/${slug}-logo.${ext}`, buf, { access: 'public', contentType, token: blobToken, allowOverwrite: true })).url
    if (!isSvg) {
      const sharp = (await import('sharp')).default
      const bw = await sharp(buf).grayscale().toFormat(ext === 'webp' ? 'webp' : ext === 'jpg' ? 'jpeg' : 'png').toBuffer()
      srcBw = (await put(`trust-logos/${slug}-logo-bw.${ext}`, bw, { access: 'public', contentType, token: blobToken, allowOverwrite: true })).url
    }
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : 'Upload fehlgeschlagen' } }
  await upsertTrustLogo({ slug, name, domain: cleanDomain(input.domain) || null, src, srcBw, alt: name, order: 99, isVisible: true, categories: input.categories })
  revalidatePath('/')
  revalidatePath('/admin/logos')
  return { ok: true }
}
