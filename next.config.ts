import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./lib/i18n/request.ts')

const nextConfig: NextConfig = {
  // Das Schreib-Material liegt als Markdown im Repo und wird beim Bestuecken
  // gelesen. Ohne diesen Eintrag laesst Vercel die Dateien beim Bundeln weg,
  // und die Route findet sie zur Laufzeit nicht.
  outputFileTracingIncludes: {
    '/api/admin/agents': ['./lib/agents/material/**'],
  },
  images: {
    remotePatterns: [
      { hostname: 'eilersfriends.com' },
      { hostname: 'www.eilersfriends.com' },
      { hostname: 'images.unsplash.com' },
    ],
  },
}

export default withNextIntl(nextConfig)
