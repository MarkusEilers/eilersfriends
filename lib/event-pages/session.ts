import crypto from 'crypto'

/**
 * Sitzung für Event-Seiten: signiertes Cookie (HMAC-SHA256), httpOnly.
 * Inhalt: slug.person.ablauf — kein Passwort, nichts Geheimes.
 */

const MAX_AGE_S = 60 * 60 * 24 * 30

function key(): Buffer {
  const s = process.env.EVENT_PAGES_SECRET || process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || ''
  if (!s) throw new Error('EVENT_PAGES_SECRET/NEXTAUTH_SECRET missing')
  return crypto.createHash('sha256').update('event-pages:' + s).digest()
}

export const cookieName = (slug: string) => `evp_${slug.replace(/[^a-z0-9-]/gi, '')}`

export function sign(slug: string, person: number) {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_S
  const body = `${slug}.${person}.${exp}`
  const mac = crypto.createHmac('sha256', key()).update(body).digest('base64url')
  return { value: `${person}.${exp}.${mac}`, maxAge: MAX_AGE_S }
}

export function verify(slug: string, value: string | undefined): number | null {
  if (!value) return null
  const [p, e, mac] = value.split('.')
  if (!p || !e || !mac) return null
  if (Number(e) < Date.now() / 1000) return null
  const exp = crypto.createHmac('sha256', key()).update(`${slug}.${p}.${e}`).digest('base64url')
  const a = Buffer.from(mac), b = Buffer.from(exp)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  return Number(p)
}
