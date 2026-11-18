import Link from 'next/link'
import { NotFound404 } from '@/components/notfound/NotFound404'

/** Fallback außerhalb der Sprach-Routen (ohne Übersetzungs-Kontext, daher schlanker Kopf). */
export default function NotFound() {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: 'DM Sans, sans-serif', margin: 0 }}>
        <header className="border-b border-gray-100 bg-white">
          <div className="mx-auto flex h-[72px] max-w-[1200px] items-center px-5 sm:px-10">
            <Link href={'/' as '/'} aria-label="Eilers+Friends">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/ef-logo.png" alt="Eilers+Friends" className="h-12 w-auto" />
            </Link>
          </div>
        </header>
        <NotFound404 />
      </body>
    </html>
  )
}
