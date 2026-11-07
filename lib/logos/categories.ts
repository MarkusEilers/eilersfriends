/** Wo ein Logo erscheinen darf. Seiten filtern ihre Logoleiste nach diesen Kategorien. */
export const LOGO_CATEGORIES = [
  { key: 'academy', label: 'Academy / Sales-Training' },
  { key: 'mystery', label: 'Mystery Shopping' },
  { key: 'beratung', label: 'GTM-Beratung' },
  { key: 'keynote', label: 'Keynotes & Vorträge' },
  { key: 'leadership', label: 'Leadership (Aljona)' },
  { key: 'presse', label: 'Presse & Medien' },
] as const
export type LogoCategory = (typeof LOGO_CATEGORIES)[number]['key']
