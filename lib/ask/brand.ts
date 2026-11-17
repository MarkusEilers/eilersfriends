import { createHash } from 'crypto'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { findLogoCandidates, UA } from '@/lib/logos/find'
import { ensureAsk } from './store'

/**
 * Marke des Teilnehmers für den Report: Logo (in unseren Blob kopiert, damit der
 * Report nicht von fremden Servern abhängt) und eine Akzentfarbe aus dem Logo.
 * Läuft nach dem Absenden des Formulars im Hintergrund — bis der Link in der
 * Mail geklickt wird, ist es längst fertig.
 */
export async function resolveBrand(submissionId: string, domain: string, company: string) {
  await ensureAsk()
  if (!domain) { await save(submissionId, null, null, 'none'); return }
  try {
    const cands = await findLogoCandidates(domain, company)
    // Reihenfolge: eigenes SVG-Logo, Logo mit „logo“ im Dateinamen, übrige eigene Logos, App-Icon, Favicon
    const rank = (c: (typeof cands)[number]) =>
      (c.score ?? 0) >= 80 && c.kind === 'svg' ? 0
        : (c.score ?? 0) >= 80 && /logo/i.test(c.url.split('?')[0].split('/').pop() ?? '') ? 1
          : (c.score ?? 0) >= 80 ? 2 : c.label === 'App-Icon' ? 3 : c.kind === 'icon' && c.url.includes('favicons') ? 5 : 4
    const ordered = [...cands].sort((a, b) => rank(a) - rank(b)).slice(0, 5)
    const sharp = (await import('sharp')).default
    let got: { buf: Buffer; isSvg: boolean; png: Buffer | null; label: string } | null = null
    for (const pick of ordered) {
      try {
        let buf: Buffer, type = ''
        if (pick.url.startsWith('data:')) {
          const m = /^data:([^;,]+)(;base64)?,([\s\S]*)$/.exec(pick.url)
          if (!m) continue
          type = m[1]; buf = m[2] ? Buffer.from(m[3], 'base64') : Buffer.from(decodeURIComponent(m[3]))
        } else {
          const r = await fetch(pick.url, { headers: { 'user-agent': UA }, cache: 'no-store', signal: AbortSignal.timeout(8000) })
          if (!r.ok) continue
          type = (r.headers.get('content-type') || '').split(';')[0]
          buf = Buffer.from(await r.arrayBuffer())
        }
        if (buf.length > 3_000_000 || buf.length < 100) continue
        const isSvg = type.includes('svg') || buf.subarray(0, 300).toString().includes('<svg')
        let png: Buffer | null = null
        try { png = await sharp(buf, { density: 200 }).resize({ width: 480, height: 240, fit: 'inside', withoutEnlargement: !isSvg }).png().toBuffer() } catch { png = null }
        if (!isSvg && (!png || (await looksLikePhoto(png)))) continue
        got = { buf, isSvg, png, label: pick.label }
        break
      } catch { /* nächster Kandidat */ }
    }
    if (!got) { await save(submissionId, null, null, 'none'); return }
    const { buf, isSvg, png } = got
    const color = png ? await brandColor(png) : null
    let url: string | null = null
    const token = process.env.BLOB_READ_WRITE_TOKEN
    if (token && (png || isSvg)) {
      const { put } = await import('@vercel/blob')
      const h = createHash('sha1').update(domain).digest('hex').slice(0, 10)
      url = isSvg
        ? (await put(`ask-logos/${h}.svg`, buf, { access: 'public', contentType: 'image/svg+xml', token, allowOverwrite: true })).url
        : (await put(`ask-logos/${h}.png`, png!, { access: 'public', contentType: 'image/png', token, allowOverwrite: true })).url
    }
    const pick = { label: got.label }
    await save(submissionId, url, color, pick.label)
  } catch (e) {
    console.error('[ask] brand failed', domain, e)
    await save(submissionId, null, null, 'error')
  }
}

async function save(id: string, logo: string | null, color: string | null, source: string) {
  await db.execute(sql`UPDATE ask_submissions SET brand_logo = ${logo}, brand_color = ${color}, brand_source = ${source} WHERE id = ${id}`)
}

/** Fotos statt Logos aussortieren: Logos haben wenige Farben, Fotos sehr viele. */
async function looksLikePhoto(png: Buffer): Promise<boolean> {
  const sharp = (await import('sharp')).default
  const { data, info } = await sharp(png).resize(48, 48, { fit: 'inside' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const seen = new Set<number>()
  let opaque = 0
  for (let i = 0; i < data.length; i += info.channels) {
    if (data[i + 3] < 200) continue
    opaque++
    seen.add(((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4))
  }
  return opaque > 400 && seen.size > 220
}

/** Kräftigste Farbe im Logo (ohne Weiß, Schwarz, Grau). Null, wenn das Logo farblos ist. */
async function brandColor(png: Buffer): Promise<string | null> {
  const sharp = (await import('sharp')).default
  const { data, info } = await sharp(png).resize(48, 48, { fit: 'inside' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const buckets = new Map<number, { n: number; r: number; g: number; b: number }>()
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3]
    if (a < 200) continue
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    const sat = max === 0 ? 0 : (max - min) / max
    if (sat < 0.35 || max < 50 || max > 250 && min > 225) continue
    let h = 0
    if (max !== min) {
      if (max === r) h = ((g - b) / (max - min)) % 6
      else if (max === g) h = (b - r) / (max - min) + 2
      else h = (r - g) / (max - min) + 4
    }
    const k = Math.round(((h * 60 + 360) % 360) / 20)
    const x = buckets.get(k) ?? { n: 0, r: 0, g: 0, b: 0 }
    x.n++; x.r += r; x.g += g; x.b += b
    buckets.set(k, x)
  }
  const best = [...buckets.values()].sort((a, b) => b.n - a.n)[0]
  if (!best || best.n < 12) return null
  const hex = (v: number) => Math.round(v / best.n).toString(16).padStart(2, '0')
  return `#${hex(best.r)}${hex(best.g)}${hex(best.b)}`
}
