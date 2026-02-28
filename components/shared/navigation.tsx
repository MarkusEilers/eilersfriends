"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Menu, X, Moon, Sun, ChevronDown, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { mainNavItems, languages } from '@/lib/config/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const pathname = usePathname();
  const t = useTranslations();
  const locale = useLocale();

  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 100], [0, 1]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setIsOpen(false); }, [pathname]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  useEffect(() => {
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initial = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  const navLinks = mainNavItems.map(item => ({
    ...item,
    label: t(item.labelKey),
    dropdown: item.dropdown?.map(d => ({ ...d, label: t(d.labelKey) })),
  }));

  const currentLang = languages.find(l => l.code === locale) || languages[0];
  const visibleLanguages = languages.filter(l => !l.hidden);

  const localizedHref = (href: string) => {
    if (href.startsWith('/#')) return `/${locale}${href}`;
    if (href.startsWith('/')) return `/${locale}${href}`;
    return href;
  };

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <motion.div
          className="absolute inset-0 bg-background/80 backdrop-blur-xl border-b border-border/50"
          style={{ opacity: headerOpacity }}
        />

        <nav className="container relative">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href={`/${locale}`}>
              <motion.div
                className="flex items-center cursor-pointer relative z-10"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <img
                  src="/logo-dark.png"
                  alt="Eilers+Friends"
                  className="h-14 md:h-16 w-auto object-contain dark:invert dark:brightness-0 dark:contrast-100"
                />
              </motion.div>
            </Link>

            {/* Desktop Navigation - Pill Style */}
            <div className="hidden lg:flex items-center">
              <motion.div
                className="flex items-center gap-1 p-1.5 rounded-full bg-secondary/50 backdrop-blur-sm border border-border/50"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                {navLinks.map((link, index) => {
                  if (link.dropdown) {
                    return (
                      <DropdownMenu key={link.id}>
                        <DropdownMenuTrigger asChild>
                          <motion.button
                            className="relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 cursor-pointer text-muted-foreground hover:text-foreground flex items-center gap-1"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * index + 0.3 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {link.label}
                            <ChevronDown className="w-3 h-3 opacity-50" />
                          </motion.button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="center"
                          className="rounded-xl min-w-[180px] p-1.5 bg-background/95 backdrop-blur-xl border-border/50"
                          sideOffset={8}
                        >
                          {link.dropdown.map((item) => (
                            <Link key={item.href} href={localizedHref(item.href)}>
                              <DropdownMenuItem className="rounded-lg cursor-pointer transition-colors hover:bg-secondary/80">
                                <span className="text-sm font-medium">{item.label}</span>
                              </DropdownMenuItem>
                            </Link>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    );
                  }

                  if (!link.href) return null;

                  const href = localizedHref(link.href);
                  const isActive = pathname === href || (link.href === '/#hero' && pathname === `/${locale}`);

                  return (
                    <Link key={link.id} href={href}>
                      <motion.div
                        className="relative"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index + 0.3 }}
                      >
                        <motion.span
                          className={`relative block px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 cursor-pointer ${
                            isActive ? 'text-white' : 'text-muted-foreground hover:text-foreground'
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="nav-pill"
                              className="absolute inset-0 bg-brand rounded-full shadow-lg shadow-brand/25"
                              initial={false}
                              transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                          )}
                          <span className="relative z-10">{link.label}</span>
                        </motion.span>
                      </motion.div>
                    </Link>
                  );
                })}
              </motion.div>
            </div>

            {/* Desktop Actions */}
            <motion.div
              className="hidden lg:flex items-center gap-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              {/* Language Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 rounded-full px-3 h-9 hover:bg-secondary/80 transition-colors"
                  >
                    <span className="text-base">{currentLang.flag}</span>
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="rounded-xl min-w-[140px] p-1.5 bg-background/95 backdrop-blur-xl border-border/50"
                  sideOffset={8}
                >
                  {visibleLanguages.map((lang) => (
                    <Link key={lang.code} href={pathname?.replace(`/${locale}`, `/${lang.code}`) || `/${lang.code}`}>
                      <DropdownMenuItem
                        className={`rounded-lg cursor-pointer transition-colors ${
                          locale === lang.code ? 'bg-brand/10 text-brand' : 'hover:bg-secondary/80'
                        }`}
                      >
                        <span className="mr-2.5 text-base">{lang.flag}</span>
                        <span className="text-sm font-medium">{lang.label}</span>
                      </DropdownMenuItem>
                    </Link>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Theme Toggle */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="rounded-full w-9 h-9 hover:bg-secondary/80 transition-colors"
                >
                  <AnimatePresence mode="wait">
                    {theme === 'dark' ? (
                      <motion.div key="sun" initial={{ rotate: -90, scale: 0 }} animate={{ rotate: 0, scale: 1 }} exit={{ rotate: 90, scale: 0 }} transition={{ duration: 0.2 }}>
                        <Sun className="w-4 h-4" />
                      </motion.div>
                    ) : (
                      <motion.div key="moon" initial={{ rotate: 90, scale: 0 }} animate={{ rotate: 0, scale: 1 }} exit={{ rotate: -90, scale: 0 }} transition={{ duration: 0.2 }}>
                        <Moon className="w-4 h-4" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>

              {/* CTA Button */}
              <Link href={localizedHref('/contact')}>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    size="sm"
                    className="group relative overflow-hidden rounded-full px-5 h-10 bg-brand text-white font-medium shadow-lg shadow-brand/25 hover:shadow-xl hover:shadow-brand/30 transition-all duration-300 ml-1"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {t('hero.cta.primary')}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
                      animate={{ translateX: ['100%', '-100%'] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    />
                  </Button>
                </motion.div>
              </Link>
            </motion.div>

            {/* Mobile Menu Button */}
            <div className="flex lg:hidden items-center gap-1">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full w-10 h-10">
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="rounded-full w-10 h-10">
                  <AnimatePresence mode="wait">
                    {isOpen ? (
                      <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                        <X className="w-5 h-5" />
                      </motion.div>
                    ) : (
                      <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                        <Menu className="w-5 h-5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>
            </div>
          </div>
        </nav>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-background/95 backdrop-blur-xl z-40 lg:hidden"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-0 top-16 bottom-0 z-40 lg:hidden overflow-y-auto"
            >
              <div className="container py-8">
                <div className="space-y-2">
                  {navLinks.map((link, index) => (
                    <motion.div
                      key={link.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      {link.dropdown ? (
                        <div>
                          <div className="px-4 py-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            {link.label}
                          </div>
                          <div className="space-y-1 pl-2">
                            {link.dropdown.map((item) => (
                              <Link key={item.href} href={localizedHref(item.href)}>
                                <motion.div
                                  className={`flex items-center justify-between px-4 py-3 rounded-2xl text-base font-medium transition-all ${
                                    pathname === localizedHref(item.href)
                                      ? 'text-white bg-brand shadow-lg shadow-brand/25'
                                      : 'text-foreground hover:bg-secondary/80'
                                  }`}
                                  onClick={() => setIsOpen(false)}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <span>{item.label}</span>
                                  <ArrowRight className={`w-4 h-4 ${pathname === localizedHref(item.href) ? 'text-white' : 'text-muted-foreground'}`} />
                                </motion.div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ) : link.href ? (
                        <Link href={localizedHref(link.href)}>
                          <motion.div
                            className={`flex items-center justify-between px-4 py-4 rounded-2xl text-lg font-medium transition-all ${
                              pathname === localizedHref(link.href)
                                ? 'text-white bg-brand shadow-lg shadow-brand/25'
                                : 'text-foreground hover:bg-secondary/80'
                            }`}
                            onClick={() => setIsOpen(false)}
                            whileTap={{ scale: 0.98 }}
                          >
                            <span>{link.label}</span>
                            <ArrowRight className={`w-5 h-5 ${pathname === localizedHref(link.href) ? 'text-white' : 'text-muted-foreground'}`} />
                          </motion.div>
                        </Link>
                      ) : null}
                    </motion.div>
                  ))}
                </div>

                {/* Language Selector Mobile */}
                <motion.div
                  className="mt-8 pt-8 border-t border-border/50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <p className="text-sm text-muted-foreground mb-4 px-4">{t('nav.language')}</p>
                  <div className="flex gap-3 px-4">
                    {visibleLanguages.map((lang) => (
                      <Link key={lang.code} href={pathname?.replace(`/${locale}`, `/${lang.code}`) || `/${lang.code}`} className="flex-1">
                        <motion.div
                          className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${
                            locale === lang.code
                              ? 'bg-brand text-white shadow-lg shadow-brand/25'
                              : 'bg-secondary/80 text-foreground hover:bg-secondary'
                          }`}
                          whileTap={{ scale: 0.98 }}
                        >
                          <span className="text-lg">{lang.flag}</span>
                          <span>{lang.code.toUpperCase()}</span>
                        </motion.div>
                      </Link>
                    ))}
                  </div>
                </motion.div>

                {/* CTA Mobile */}
                <motion.div
                  className="mt-8 px-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Link href={localizedHref('/contact')}>
                    <Button
                      className="w-full rounded-2xl h-14 bg-brand hover:bg-brand/90 text-white text-base font-semibold shadow-lg shadow-brand/25"
                      onClick={() => setIsOpen(false)}
                    >
                      <span className="flex items-center gap-2">
                        {t('hero.cta.primary')}
                        <ArrowRight className="w-5 h-5" />
                      </span>
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
