import { notFound } from 'next/navigation'

import {
  buildLocalePath,
  defaultLocale,
  getLocaleLabel,
  normalizeLocale,
  supportedLocales,
  type AppLocale,
} from '@/shared/i18n/locales'

export function requireLocale(locale: string): AppLocale {
  const normalizedLocale = normalizeLocale(locale)

  if (!normalizedLocale) {
    notFound()
  }

  return normalizedLocale
}

export function buildLocaleLinks(pathname: string) {
  return supportedLocales.map((locale) => ({
    href: buildLocalePath(locale.code, pathname),
    isDefault: locale.code === defaultLocale,
    label: getLocaleLabel(locale.code),
    locale: locale.code,
  }))
}
