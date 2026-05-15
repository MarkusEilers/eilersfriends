import { defineRouting } from 'next-intl/routing'

// Public locales: DE (default), EN, ES.
// RU messages still exist as a file but is intentionally not exposed publicly.
export const routing = defineRouting({
  locales: ['de', 'en', 'es'],
  defaultLocale: 'de',
  localePrefix: 'as-needed',
})
