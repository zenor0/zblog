import type { Metadata } from 'next'

import { buildLocalePath, defaultLocale, supportedLocales, type AppLocale } from '@/lib/locales'

const fallbackSiteURL = 'http://localhost:3000'

export function getSiteURL(): URL {
  const siteURL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.SITE_URL?.trim() || fallbackSiteURL

  return new URL(siteURL.endsWith('/') ? siteURL : `${siteURL}/`)
}

export function buildAbsoluteURL(pathname = '/'): string {
  const normalizedPathname = pathname.startsWith('/') ? pathname : `/${pathname}`

  return new URL(normalizedPathname, getSiteURL()).toString()
}

export function buildLocaleAlternates(args: {
  canonicalLocale: AppLocale
  pathname?: string
  locales?: readonly AppLocale[]
  xDefaultPath?: string
}): Metadata['alternates'] {
  const pathname = args.pathname ?? ''
  const locales = args.locales ?? supportedLocales.map((locale) => locale.code)
  const languages = Object.fromEntries(
    locales.map((locale) => [locale, buildAbsoluteURL(buildLocalePath(locale, pathname))]),
  )

  return {
    canonical: buildAbsoluteURL(buildLocalePath(args.canonicalLocale, pathname)),
    languages: {
      ...languages,
      'x-default': buildAbsoluteURL(args.xDefaultPath ?? buildLocalePath(defaultLocale, pathname)),
    },
  }
}
