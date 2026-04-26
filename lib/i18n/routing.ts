import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['de', 'en', 'ru'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
})
