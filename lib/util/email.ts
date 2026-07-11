// Consumer- (Freemail-) Erkennung + Arbeits-Domain-Extraktion.
const CONSUMER_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'gmx.de', 'gmx.net', 'gmx.at', 'gmx.ch', 'web.de',
  'yahoo.com', 'yahoo.de', 'ymail.com', 'hotmail.com', 'hotmail.de', 'outlook.com',
  'outlook.de', 'live.com', 'live.de', 'icloud.com', 'me.com', 'mac.com', 't-online.de',
  'freenet.de', 'aol.com', 'proton.me', 'protonmail.com', 'mail.com', 'msn.com', 'gm_x.de',
])

export function emailDomain(email: string): string {
  const at = String(email || '').toLowerCase().trim().split('@')
  return at.length === 2 ? at[1] : ''
}
export function isConsumerEmail(email: string): boolean {
  const d = emailDomain(email)
  return !!d && CONSUMER_DOMAINS.has(d)
}
/** Arbeits-Domain aus E-Mail (leer bei Consumer/ungültig). */
export function workDomain(email: string): string {
  const d = emailDomain(email)
  return d && !CONSUMER_DOMAINS.has(d) ? d : ''
}
/** Domain aus einer Website-URL. */
export function domainFromUrl(url: string): string {
  if (!url) return ''
  try {
    const u = new URL(url.match(/^https?:\/\//) ? url : 'https://' + url)
    return u.hostname.replace(/^www\./, '').toLowerCase()
  } catch { return '' }
}
/** Freundlicher Hinweis für Consumer-Emails (Markus' Ton). */
export function workEmailAdvice(email: string): string | null {
  if (!isConsumerEmail(email)) return null
  return 'Tipp: Mit Deiner Arbeits-E-Mail wird der Report schlauer — dann recherchieren wir direkt für Dein Unternehmen. Es sei denn, Du möchtest eine Strategie für Google oder Microsoft entwerfen. :)'
}
