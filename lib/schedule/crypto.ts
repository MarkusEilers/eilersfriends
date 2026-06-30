import crypto from 'crypto'

function key(): Buffer {
  const secret = process.env.SCHEDULE_TOKEN_SECRET || process.env.NEXTAUTH_SECRET || ''
  if (!secret) throw new Error('SCHEDULE_TOKEN_SECRET/NEXTAUTH_SECRET missing')
  return crypto.createHash('sha256').update(secret).digest()
}

export function encrypt(plain: string): string {
  const iv = crypto.randomBytes(12)
  const c = crypto.createCipheriv('aes-256-gcm', key(), iv)
  const enc = Buffer.concat([c.update(plain, 'utf8'), c.final()])
  const tag = c.getAuthTag()
  return [iv.toString('base64'), tag.toString('base64'), enc.toString('base64')].join('.')
}

export function decrypt(payload: string): string {
  const [ivB, tagB, encB] = payload.split('.')
  const d = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(ivB, 'base64'))
  d.setAuthTag(Buffer.from(tagB, 'base64'))
  return Buffer.concat([d.update(Buffer.from(encB, 'base64')), d.final()]).toString('utf8')
}

export function signState(s: string): string {
  const mac = crypto.createHmac('sha256', key()).update(s).digest('base64url')
  return Buffer.from(s).toString('base64url') + '.' + mac
}
export function verifyState(token: string): string | null {
  const [b, mac] = token.split('.')
  if (!b || !mac) return null
  const s = Buffer.from(b, 'base64url').toString('utf8')
  const exp = crypto.createHmac('sha256', key()).update(s).digest('base64url')
  return crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(exp)) ? s : null
}
