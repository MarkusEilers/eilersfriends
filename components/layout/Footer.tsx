import { Linkedin, Instagram, Youtube, Mail } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'

function SocialButton({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
    >
      <Icon size={16} />
    </a>
  )
}

export function Footer() {
  const t = useTranslations('footer')

  return (
    <footer style={{ backgroundColor: '#0F1E3A' }} className="text-white">
      <div className="mx-auto max-w-7xl px-6 pt-16 pb-8">
        {/* Wing + 4 columns */}
        <div className="grid gap-10 lg:grid-cols-[240px_1fr_1fr_1fr]">
          {/* Column 1: Brand */}
          <div>
            <div className="mb-4 select-none">
              <span className="text-xl font-bold tracking-tight text-white">
                Eilers<span style={{ color: '#F05A1A' }}>+</span>Friends
              </span>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">
              {t('tagline')}
            </p>
            {/* Aljona Social */}
            <div className="mt-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/40">Aljona</p>
              <div className="flex gap-2">
                <SocialButton href="https://linkedin.com/in/aljonaeilers" icon={Linkedin} label="Aljona auf LinkedIn" />
                <SocialButton href="https://instagram.com/aljonaeilers" icon={Instagram} label="Aljona auf Instagram" />
                <SocialButton href="https://youtube.com/@aljonaeilers" icon={Youtube} label="Aljona auf YouTube" />
              </div>
            </div>
            {/* Markus Social */}
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/40">Markus</p>
              <div className="flex gap-2">
                <SocialButton href="https://linkedin.com/in/markuseilers" icon={Linkedin} label="Markus auf LinkedIn" />
                <SocialButton href="https://youtube.com/@markuseilers" icon={Youtube} label="Markus auf YouTube" />
                <SocialButton href="mailto:markus@eilersfriends.com" icon={Mail} label="E-Mail an Markus" />
              </div>
            </div>
          </div>

          {/* Column 2: Programme */}
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-white/40">
              {t('programmes')}
            </h3>
            <ul className="space-y-2.5">
              <li><Link href="/salesmade" className="text-sm text-white/70 hover:text-white transition-colors">{t('salesmade')}</Link></li>
              <li><Link href="/aljona#liquid" className="text-sm text-white/70 hover:text-white transition-colors">{t('liquidLeadership')}</Link></li>
            </ul>
            <h3 className="mb-4 mt-8 text-sm font-bold uppercase tracking-widest text-white/40">
              {t('coaches')}
            </h3>
            <ul className="space-y-2.5">
              <li><Link href="/markus" className="text-sm text-white/70 hover:text-white transition-colors">{t('markus')}</Link></li>
              <li><Link href="/aljona" className="text-sm text-white/70 hover:text-white transition-colors">{t('aljona')}</Link></li>
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-white/40">
              {t('resources')}
            </h3>
            <ul className="space-y-2.5">
              <li><Link href="/ressourcen" className="text-sm text-white/70 hover:text-white transition-colors">{t('frameworks')}</Link></li>
              <li><a href="#newsletter" className="text-sm text-white/70 hover:text-white transition-colors">{t('newsletter')}</a></li>
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-white/40">
              {t('legal')}
            </h3>
            <ul className="space-y-2.5">
              <li><Link href="/datenschutz" className="text-sm text-white/70 hover:text-white transition-colors">{t('privacy')}</Link></li>
              <li><Link href="/impressum" className="text-sm text-white/70 hover:text-white transition-colors">{t('imprint')}</Link></li>
              <li><Link href="/kontakt" className="text-sm text-white/70 hover:text-white transition-colors">{t('contact')}</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row">
          <span>{t('copyright')}</span>
          <span>{t('madeWith')}</span>
        </div>
      </div>
    </footer>
  )
}
