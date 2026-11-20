import Link from 'next/link'
import { ROOT_FONTS_CSS } from '@/lib/fonts/google-local'
import { NotFound404 } from '@/components/notfound/NotFound404'

/** Fallback außerhalb der Sprach-Routen (ohne Übersetzungs-Kontext, daher schlanker Kopf). */
export default function NotFound() {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: ROOT_FONTS_CSS }} />
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
