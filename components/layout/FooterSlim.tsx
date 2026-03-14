import Image from 'next/image'
import { Link } from '@/lib/i18n/navigation'

export function FooterSlim() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link href="/">
          <Image
            src="/ef-logo.png"
            alt="Eilers+Friends"
            width={120}
            height={32}
            className="h-7 w-auto opacity-60"
          />
        </Link>
        <div className="flex gap-4 text-xs text-gray-400">
          <Link href="/datenschutz" className="hover:text-gray-700 transition-colors">Datenschutz</Link>
          <Link href="/impressum" className="hover:text-gray-700 transition-colors">Impressum</Link>
        </div>
      </div>
    </footer>
  )
}
