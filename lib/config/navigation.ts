export type NavItem = {
  id: string;
  labelKey: string;
  href?: string;
  dropdown?: { href: string; labelKey: string }[];
};

export const mainNavItems: NavItem[] = [
  { id: 'home', href: '/#hero', labelKey: 'nav.home' },
  { id: 'programs', href: '/#programs', labelKey: 'nav.programs' },
  {
    id: 'team',
    labelKey: 'nav.team',
    dropdown: [
      { href: '/aljona', labelKey: 'nav.aljona' },
      { href: '/markus', labelKey: 'nav.markus' },
    ],
  },
  {
    id: 'resources',
    labelKey: 'nav.resources',
    dropdown: [
      { href: '/salesmade', labelKey: 'nav.salesmade' },
      { href: '/aljona', labelKey: 'nav.liquid' },
    ],
  },
  { id: 'results', href: '/#results', labelKey: 'nav.results' },
  { id: 'contact', href: '/contact', labelKey: 'nav.contact' },
];

export const footerLinks = {
  programs: [
    { labelKey: 'footer.salesmade', href: '/salesmade' },
    { labelKey: 'footer.liquid_leadership', href: '/aljona' },
  ],
  coaches: [
    { labelKey: 'footer.aljona', href: '/aljona' },
    { labelKey: 'footer.markus', href: '/contact' },
  ],
  company: [
    { labelKey: 'footer.about', href: '/contact' },
    { labelKey: 'footer.contact', href: '/contact' },
  ],
  legal: [
    { labelKey: 'footer.privacy', href: '/datenschutz' },
    { labelKey: 'footer.imprint', href: '/impressum' },
    { labelKey: 'footer.cookies', href: '#', action: 'openCookieSettings' as const },
  ],
};

export const socialLinks = {
  aljona: [
    { platform: 'linkedin' as const, href: 'https://www.linkedin.com/in/aljona-eilers-812b65194/', label: 'LinkedIn' },
    { platform: 'instagram' as const, href: 'https://www.instagram.com/aljona_eilers', label: 'Instagram' },
    { platform: 'youtube' as const, href: 'https://www.youtube.com/@leadershe.by.aljona.eilers', label: 'YouTube' },
  ],
  markus: [
    { platform: 'linkedin' as const, href: 'https://linkedin.com/in/markuseilers', label: 'LinkedIn' },
    { platform: 'youtube' as const, href: 'https://youtube.com/@markuseilers', label: 'YouTube' },
    { platform: 'email' as const, href: 'mailto:team@eilersfriends.com', label: 'Email' },
  ],
};

export const languages = [
  { code: 'de' as const, label: 'Deutsch', flag: '🇩🇪' },
  { code: 'en' as const, label: 'English', flag: '🇬🇧' },
  { code: 'ru' as const, label: 'Русский', flag: '🇷🇺', hidden: true },
];
