'use client'

import Image from 'next/image'
import { Linkedin, Instagram, Youtube, Mail } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'

function SocialIcon({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
      style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.16)'
        e.currentTarget.style.color = 'white'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'
        e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
      }}
    >
      <Icon size={16} />
    </a>
  )
}

function FooterCol({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-5 text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
        {heading}
      </h3>
      <ul className="space-y-3">{children}</ul>
    </div>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  const isExternal = href.startsWith('http') || href.startsWith('mailto')
  if (isExternal) {
    return (
      <li>
        <a href={href} className="text-sm transition-colors" style={{ color: 'rgba(255,255,255,0.55)' }}>
          {children}
        </a>
      </li>
    )
  }
  return (
    <li>
      <Link href={href as '/'} className="text-sm transition-colors" style={{ color: 'rgba(255,255,255,0.55)' }}>
        {children}
      </Link>
    </li>
  )
}

export function Footer() {
  const t = useTranslations('footer')

  return (
    <footer style={{ backgroundColor: '#0A0D14' }} className="text-white">
      <div className="mx-auto max-w-7xl px-6 pt-16 pb-6">

        {/* Top: Logo + 4 columns */}
        <div className="grid gap-10 lg:grid-cols-[220px_1fr_1fr_1fr_1fr]">

          {/* Brand column */}
          <div className="lg:col-span-1">
            <Image
              src="/wing-white.png"
              alt="Eilers+Friends"
              width={44}
              height={44}
              className="h-12 w-auto"
            />
          </div>

          {/* Programme */}
          <FooterCol heading={t('programmes')}>
            <FooterLink href="/salesmade">{t('salesmade')}</FooterLink>
            <FooterLink href="/aljona#liquid">{t('liquidLeadership')}</FooterLink>
            <FooterLink href="/b2b-offers">{t('b2bFramework')}</FooterLink>
          </FooterCol>

          {/* Coaches */}
          <FooterCol heading={t('coaches')}>
            <FooterLink href="/markus">{t('markus')}</FooterLink>
            <FooterLink href="/aljona">{t('aljona')}</FooterLink>
          </FooterCol>

          {/* Unternehmen */}
          <FooterCol heading={t('unternehmen')}>
            <FooterLink href="/#coaches">{t('about')}</FooterLink>
            <FooterLink href="/#newsletter">{t('newsletter')}</FooterLink>
            <FooterLink href="/#frameworks">{t('ressourcen')}</FooterLink>
          </FooterCol>

          {/* Rechtliches */}
          <FooterCol heading={t('legal')}>
            <FooterLink href="/datenschutz">{t('privacy')}</FooterLink>
            <FooterLink href="/impressum">{t('imprint')}</FooterLink>
            <FooterLink href="/kontakt">{t('contact')}</FooterLink>
            <FooterLink href="#cookie-settings">{t('cookieSettings')}</FooterLink>
          </FooterCol>

        </div>

        {/* Social bar */}
        <div
          className="mt-12 flex flex-col items-start justify-between gap-6 border-t pt-8 sm:flex-row sm:items-center"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          {/* Aljona social */}
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.30)' }}>
              Aljona
            </span>
            <div className="flex gap-2">
              <SocialIcon href="https://linkedin.com/in/aljonaeilers" icon={Linkedin} label="Aljona auf LinkedIn" />
              <SocialIcon href="https://instagram.com/aljonaeilers" icon={Instagram} label="Aljona auf Instagram" />
              <SocialIcon href="https://youtube.com/@aljonaeilers" icon={Youtube} label="Aljona auf YouTube" />
            </div>
          </div>

          {/* Markus social */}
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.30)' }}>
              Markus
            </span>
            <div className="flex gap-2">
              <SocialIcon href="https://linkedin.com/in/markuseilers" icon={Linkedin} label="Markus auf LinkedIn" />
              <SocialIcon href="https://youtube.com/@markuseilers" icon={Youtube} label="Markus auf YouTube" />
              <SocialIcon href="mailto:markus@eilersfriends.com" icon={Mail} label="E-Mail an Markus" />
            </div>
          </div>
        </div>

        {/* Copyright bar */}
        <div
          className="mt-6 flex flex-col items-center justify-between gap-3 border-t pt-6 text-xs sm:flex-row"
          style={{ borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.25)' }}
        >
          <span>{t('copyright')}</span>
          <span className="italic text-center" style={{ color: 'rgba(255,255,255,0.40)' }}>
            {t('tagline')}
          </span>
          <span>{t('madeWith')}</span>
        </div>

      </div>
    </footer>
  )
}
