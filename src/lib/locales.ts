export const supportedLocales = [
  {
    code: 'zh-CN',
    label: '简体中文',
  },
  {
    code: 'en',
    label: 'English',
  },
] as const

export const defaultLocale = 'zh-CN'

export type AppLocale = (typeof supportedLocales)[number]['code']

export const localeLabels = Object.fromEntries(
  supportedLocales.map((locale) => [locale.code, locale.label]),
) as Record<AppLocale, string>

export const localeCodes = supportedLocales.map((locale) => locale.code)

export function isLocale(value: string): value is AppLocale {
  return localeCodes.includes(value as AppLocale)
}

export function getLocaleLabel(locale: string): string {
  return localeLabels[locale as AppLocale] ?? locale
}

export function getTranslationSourceLocale(targetLocale: AppLocale): AppLocale {
  if (targetLocale === defaultLocale) {
    return 'en'
  }

  return defaultLocale
}
