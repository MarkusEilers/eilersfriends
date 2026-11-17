import crypto from 'crypto'

/** Signierte, nicht erratbare Schlüssel je Teilnahme (HMAC). Kein Lookup nötig. */
function key(): Buffer {
  const s = process.env.ASK_SECRET || process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || ''
  if (!s) throw new Error('ASK_SECRET/NEXTAUTH_SECRET missing')
  return crypto.createHash('sha256').update('ask:' + s).digest()
}
const mac = (purpose: string, id: string) => crypto.createHmac('sha256', key()).update(`${purpose}:${id}`).digest('base64url').slice(0, 24)

/** Darf diese Browser-Sitzung Kontaktdaten an die Teilnahme hängen? */
export const claimToken = (id: string) => mac('claim', id)
/** Report-Link: id.mac — wer ihn hat, sieht den Report (nach Bestätigung). */
export const reportToken = (id: string) => `${id.replace(/-/g, '')}.${mac('report', id)}`

export function readReportToken(tok: string): string | null {
  const [hex, m] = tok.split('.')
  if (!hex || !m || !/^[0-9a-f]{32}$/.test(hex)) return null
  const id = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  const exp = mac('report', id)
  const a = Buffer.from(m), b = Buffer.from(exp)
  return a.length === b.length && crypto.timingSafeEqual(a, b) ? id : null
}
export function checkClaim(id: string, claim: string): boolean {
  const a = Buffer.from(claim || ''), b = Buffer.from(claimToken(id))
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}
