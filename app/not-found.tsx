import Link from 'next/link'
import { NotFoundClient } from '@/components/NotFoundClient'

export default function NotFound() {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,400&family=DM+Serif+Display:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ fontFamily: 'DM Sans, sans-serif' }}>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 px-6 py-16">
          <div className="mx-auto max-w-3xl">
            <Link href={'/' as '/'} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900">
              Eilers<span style={{ color: '#F05A1A' }}>+</span>Friends
            </Link>
            <NotFoundClient />
          </div>
        </div>
      </body>
    </html>
  )
}
