/**
 * Macht aus einem beliebigen Logo eine einheitliche Monochrom-Fassung: schwarze Form auf transparentem Grund,
 * ohne Rand. Funktioniert für transparente Logos (dunkel ODER hell, z. B. weiße Logos für dunkle Header)
 * und für Logos mit eigenem Hintergrund (weiß, farbig). Darstellung danach überall gleich:
 *   heller Grund → so wie sie ist (per opacity grau),  dunkler Grund → filter: invert(1).
 */
export async function makeMonoLogo(input: Buffer): Promise<Buffer> {
  const sharp = (await import('sharp')).default
  const { data, info } = await sharp(input, { density: 300 })
    .resize({ height: 400, width: 1600, fit: 'inside', withoutEnlargement: false })
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h } = info
  const n = w * h
  let transparent = 0
  for (let i = 0; i < n; i++) if (data[i * 4 + 3] < 16) transparent++
  const ink = new Uint8ClampedArray(n)
  if (transparent / n > 0.08) {
    // Transparenter Grund: die Form ist der Alphakanal
    for (let i = 0; i < n; i++) ink[i] = data[i * 4 + 3]
  } else {
    // Eigener Hintergrund: Farbe vom Rand schätzen, Abstand dazu = Deckkraft
    const border: number[][] = []
    for (let x = 0; x < w; x++) { border.push([...data.subarray(x * 4, x * 4 + 3)]); const j = ((h - 1) * w + x) * 4; border.push([...data.subarray(j, j + 3)]) }
    for (let y = 0; y < h; y++) { const j = (y * w) * 4; border.push([...data.subarray(j, j + 3)]); const k = (y * w + w - 1) * 4; border.push([...data.subarray(k, k + 3)]) }
    const med = (c: number) => { const v = border.map((p) => p[c]).sort((a, b) => a - b); return v[Math.floor(v.length / 2)] }
    const bg = [med(0), med(1), med(2)]
    const dist = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      const r = data[i * 4] - bg[0], g = data[i * 4 + 1] - bg[1], b = data[i * 4 + 2] - bg[2]
      dist[i] = Math.sqrt(r * r + g * g + b * b)
    }
    const sorted = Array.from(dist).sort((a, b) => a - b)
    const hi = Math.max(60, sorted[Math.floor(sorted.length * 0.97)])
    for (let i = 0; i < n; i++) {
      const v = Math.max(0, (dist[i] - 18) / (hi - 18))
      ink[i] = Math.round(Math.min(1, v) * 255)
    }
  }
  // Rand abschneiden
  let x0 = w, y0 = h, x1 = -1, y1 = -1
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (ink[y * w + x] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
  if (x1 < 0) throw new Error('Logo ist leer')
  const pad = 2
  x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad)
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1
  const out = Buffer.alloc(cw * ch * 4)
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
    const o = (y * cw + x) * 4
    out[o] = 13; out[o + 1] = 13; out[o + 2] = 11
    out[o + 3] = ink[(y + y0) * w + (x + x0)]
  }
  return sharp(out, { raw: { width: cw, height: ch, channels: 4 } }).png({ compressionLevel: 9 }).toBuffer()
}
