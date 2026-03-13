import { notFound } from 'next/navigation'

import { getLocaleLabel, isLocale, supportedLocales, type AppLocale } from '@/lib/locales'

export function requireLocale(locale: string): AppLocale {
  if (!isLocale(locale)) {
    notFound()
  }

  return locale
}

export function formatLongDate(value: string | null | undefined, locale: AppLocale): string {
  if (!value) {
    return 'Unscheduled'
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatShortDate(value: string | null | undefined, locale: AppLocale): string {
  if (!value) {
    return 'Unknown date'
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
  }).format(new Date(value))
}

export function estimateReadingTime(content: string): string {
  const words = content.trim().split(/\s+/).filter(Boolean).length
  const cjkCharacters = (content.match(/[\u3400-\u9fff]/g) ?? []).length
  const estimatedUnits = Math.max(words, Math.round(cjkCharacters / 2))
  const minutes = Math.max(1, Math.round(estimatedUnits / 220))

  return `${minutes} min read`
}

export function buildLocaleLinks(pathname: string) {
  return supportedLocales.map((locale) => ({
    href: `/${locale.code}${pathname}`,
    isDefault: locale.code === 'zh-CN',
    label: getLocaleLabel(locale.code),
    locale: locale.code,
  }))
}
