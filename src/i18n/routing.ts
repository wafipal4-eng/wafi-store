import { defineRouting } from 'next-intl/routing';
import { SUPPORTED_LANGUAGES } from '@/app/lib/constants';

export const routing = defineRouting({
  // A list of all locales that are supported
  // Configured in src/app/lib/constants.ts
  locales: SUPPORTED_LANGUAGES.all as any,

  // Used when no locale matches
  defaultLocale: SUPPORTED_LANGUAGES.primary as any
});