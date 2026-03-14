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
