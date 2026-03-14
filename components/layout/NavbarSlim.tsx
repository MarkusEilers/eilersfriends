import Image from 'next/image'
import { Link } from '@/lib/i18n/navigation'

interface NavbarSlimProps {
  ctaLabel?: string
  ctaHref?: string
}

export function NavbarSlim({
  ctaLabel = 'Gespräch buchen',
  ctaHref = 'https://calendly.com/eilersfriends',
}: NavbarSlimProps) {
  return (
    <header className="w-full bg-white border-b border-gray-100">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex-shrink-0">
          <Image
            src="/ef-logo.png"
            alt="Eilers+Friends"
            width={140}
            height={36}
            className="h-8 w-auto"
            priority
          />
        </Link>
        <a
          href={ctaHref}
          target={ctaHref.startsWith('http') ? '_blank' : undefined}
          rel={ctaHref.startsWith('http') ? 'noopener noreferrer' : undefined}
          className="rounded-full px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#F05A1A' }}
        >
          {ctaLabel}
        </a>
      </div>
    </header>
  )
}
