import { getPublicHtml } from './store'

const HEADERS = {
  'Content-Type': 'text/html; charset=utf-8',
  'X-Robots-Tag': 'noindex, nofollow',
  'Cache-Control': 'private, no-store',
  'Referrer-Policy': 'same-origin',
}

export async function servePage(slug: string | null) {
  const html = slug ? await getPublicHtml(slug) : null
  if (!html) return new Response('Nicht gefunden', { status: 404, headers: { ...HEADERS, 'Content-Type': 'text/plain; charset=utf-8' } })
  return new Response(html.replaceAll('__EVENT_SLUG__', slug!), { headers: HEADERS })
}
