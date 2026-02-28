"use client";

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Linkedin, Youtube, Instagram, Mail, Cookie } from 'lucide-react';
import { footerLinks, socialLinks } from '@/lib/config/navigation';

const socialIcons: Record<string, any> = { linkedin: Linkedin, youtube: Youtube, instagram: Instagram, email: Mail };

export default function Footer() {
  const t = useTranslations();
  const locale = useLocale();
  const currentYear = new Date().getFullYear();

  const localizedHref = (href: string) => {
    if (href.startsWith('/')) return `/${locale}${href}`;
    return href;
  };

  const handleLegalClick = (action: string | undefined, e: React.MouseEvent) => {
    if (action === 'openCookieSettings') {
      e.preventDefault();
      if (typeof window !== 'undefined' && (window as any).openCookieSettings) {
        (window as any).openCookieSettings();
      }
    }
  };

  return (
    <footer className="bg-[#1a1a1a] text-white">
      <div className="container section-padding">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link href={`/${locale}`}>
              <div className="flex items-center mb-4 cursor-pointer">
                <img src="/logo-light.png" alt="Eilers+Friends" className="h-16 w-auto object-contain" />
              </div>
            </Link>
          </div>

          {/* Programs */}
          <div>
            <h3 className="font-bold mb-4 text-white">{t('footer.programs')}</h3>
            <ul className="space-y-3">
              {footerLinks.programs.map((link) => (
                <li key={link.labelKey}>
                  <Link href={localizedHref(link.href)} className="text-gray-400 hover:text-white transition-colors text-sm">
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Coaches */}
          <div>
            <h3 className="font-bold mb-4 text-white">{t('footer.coaches')}</h3>
            <ul className="space-y-3">
              {footerLinks.coaches.map((link) => (
                <li key={link.labelKey}>
                  <Link href={localizedHref(link.href)} className="text-gray-400 hover:text-white transition-colors text-sm">
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-bold mb-4 text-white">{t('footer.company')}</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.labelKey}>
                  <Link href={localizedHref(link.href)} className="text-gray-400 hover:text-white transition-colors text-sm">
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-bold mb-4 text-white">{t('footer.legal')}</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.labelKey}>
                  {link.action ? (
                    <button
                      onClick={(e) => handleLegalClick(link.action, e)}
                      className="text-gray-400 hover:text-white transition-colors cursor-pointer text-sm flex items-center gap-2"
                    >
                      <Cookie className="w-4 h-4" />
                      {t(link.labelKey)}
                    </button>
                  ) : (
                    <Link href={localizedHref(link.href)} className="text-gray-400 hover:text-white transition-colors text-sm">
                      {t(link.labelKey)}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Social Links */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex justify-between items-start">
            {/* Aljona */}
            <div>
              <p className="text-xs text-gray-500 mb-2">Aljona Eilers</p>
              <div className="flex gap-2">
                {socialLinks.aljona.map((social) => {
                  const Icon = socialIcons[social.platform];
                  return (
                    <a key={`aljona-${social.label}`} href={social.href} target="_blank" rel="noopener noreferrer"
                      className="w-9 h-9 rounded-lg bg-white/10 hover:bg-[#FFD700]/20 flex items-center justify-center transition-colors group"
                      aria-label={`Aljona's ${social.label}`}
                    >
                      <Icon className="w-4 h-4 text-gray-400 group-hover:text-[#FFD700] transition-colors" />
                    </a>
                  );
                })}
              </div>
            </div>
            {/* Markus */}
            <div>
              <p className="text-xs text-gray-500 mb-2 text-right">Markus Eilers</p>
              <div className="flex gap-2 justify-end">
                {socialLinks.markus.map((social) => {
                  const Icon = socialIcons[social.platform];
                  return (
                    <a key={`markus-${social.label}`} href={social.href} target="_blank" rel="noopener noreferrer"
                      className="w-9 h-9 rounded-lg bg-white/10 hover:bg-brand/20 flex items-center justify-center transition-colors group"
                      aria-label={`Markus' ${social.label}`}
                    >
                      <Icon className="w-4 h-4 text-gray-400 group-hover:text-brand transition-colors" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400">
            &copy; {currentYear} Eilers+Friends. {t('footer.rights')}
          </p>
          <p className="text-sm text-gray-400">
            {t('footer.made_with')}
          </p>
        </div>
      </div>
    </footer>
  );
}
