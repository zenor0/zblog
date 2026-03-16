import type { AppLocale } from '@/lib/locales'

export function formatLongDate(args: {
  fallback: string
  locale: AppLocale
  value: null | string | undefined
}): string {
  const { fallback, locale, value } = args

  if (!value) {
    return fallback
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatShortDate(args: {
  fallback: string
  locale: AppLocale
  value: null | string | undefined
}): string {
  const { fallback, locale, value } = args

  if (!value) {
    return fallback
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
  }).format(new Date(value))
}

export function estimateReadingMinutes(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length
  const cjkCharacters = (content.match(/[\u3400-\u9fff]/g) ?? []).length
  const estimatedUnits = Math.max(words, Math.round(cjkCharacters / 2))

  return Math.max(1, Math.round(estimatedUnits / 220))
}
