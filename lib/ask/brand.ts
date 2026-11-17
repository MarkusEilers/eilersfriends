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
    const pick = cands.find((c) => (c.score ?? 0) >= 80) ?? cands.find((c) => c.label === 'App-Icon') ?? cands[0]
    if (!pick) { await save(submissionId, null, null, 'none'); return }
    let buf: Buffer, type = ''
    if (pick.url.startsWith('data:')) {
      const m = /^data:([^;,]+)(;base64)?,([\s\S]*)$/.exec(pick.url)
      if (!m) throw new Error('bad data url')
      type = m[1]; buf = m[2] ? Buffer.from(m[3], 'base64') : Buffer.from(decodeURIComponent(m[3]))
    } else {
      const r = await fetch(pick.url, { headers: { 'user-agent': UA }, cache: 'no-store', signal: AbortSignal.timeout(8000) })
      if (!r.ok) throw new Error(`logo ${r.status}`)
      type = (r.headers.get('content-type') || '').split(';')[0]
      buf = Buffer.from(await r.arrayBuffer())
    }
    if (buf.length > 3_000_000) throw new Error('logo too big')
    const isSvg = type.includes('svg') || buf.subarray(0, 300).toString().includes('<svg')
    const sharp = (await import('sharp')).default
    let png: Buffer | null = null
    try { png = await sharp(buf, { density: 200 }).resize({ width: 480, height: 240, fit: 'inside', withoutEnlargement: !isSvg }).png().toBuffer() } catch { png = null }
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
    await save(submissionId, url, color, pick.label)
  } catch (e) {
    console.error('[ask] brand failed', domain, e)
    await save(submissionId, null, null, 'error')
  }
}

async function save(id: string, logo: string | null, color: string | null, source: string) {
  await db.execute(sql`UPDATE ask_submissions SET brand_logo = ${logo}, brand_color = ${color}, brand_source = ${source} WHERE id = ${id}`)
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
