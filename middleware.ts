import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from '@/lib/i18n/routing'

// Domain → internal path rewrites
const DOMAIN_REWRITES: Record<string, string> = {
  'salesmade.com': '/salesmade',
  'www.salesmade.com': '/salesmade',
  'aljonaeilers.com': '/aljona',
  'www.aljonaeilers.com': '/aljona',
  'markuseilers.com': '/markus',
  'www.markuseilers.com': '/markus',
}

const intlMiddleware = createMiddleware(routing)

export default async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') ?? ''
  const pathname = request.nextUrl.pathname

  // Public offer-by-secret route lives outside the localized routing tree.
  // Skip next-intl rewriting so the URL stays /offer/<secret>.
  if (pathname.startsWith('/offer/')) {
    return NextResponse.next()
  }

  // Voice/Telefonie-Endpunkte: server-to-server JSON, keine Lokalisierung
  if (pathname === '/voice' || pathname.startsWith('/voice/')) {
    return NextResponse.next()
  }
  // Fortuna läuft jetzt als eigenes Projekt unter fortuna-infinita.com — alte Links dorthin umleiten
  if (pathname === '/fortuna' || pathname.startsWith('/fortuna/')) {
    const rest = pathname.replace(/^\/fortuna/, '')
    return NextResponse.redirect('https://fortuna-infinita.com' + (rest || '/'), 308)
  }

  // Check for domain rewrites (landing page domains)
  const rewritePath = DOMAIN_REWRITES[hostname]
  if (rewritePath) {
    const url = request.nextUrl.clone()
    const originalPath = url.pathname === '/' ? '' : url.pathname
    url.pathname = `/de${rewritePath}${originalPath}`
    return NextResponse.rewrite(url)
  }

  // Standard next-intl middleware for eilersfriends.com
  return intlMiddleware(request)
}

export const config = {
  // Match all pathnames except for static files and API routes
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
}
