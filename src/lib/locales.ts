import { match } from '@formatjs/intl-localematcher'

export const supportedLocales = [
  {
    aliases: ['zh-CN', 'zh-cn', 'zh-Hans-CN', 'zh-hans-cn'],
    code: 'zh-Hans',
    label: '简体中文',
    slug: 'zh-hans',
  },
  {
    aliases: [] as const,
    code: 'en',
    label: 'English',
    slug: 'en',
  },
] as const

type AppLocaleDefinition = (typeof supportedLocales)[number]

export type AppLocale = AppLocaleDefinition['code']
export type AppLocaleSlug = AppLocaleDefinition['slug']

export const defaultLocale: AppLocale = 'zh-Hans'
export const defaultLocaleSlug: AppLocaleSlug = 'zh-hans'

export const payloadLocales = supportedLocales.map(({ code, label }) => ({
  code,
  label,
}))

export const localeLabels = Object.fromEntries(
  supportedLocales.map((locale) => [locale.code, locale.label]),
) as Record<AppLocale, string>

export const localeCodes = supportedLocales.map((locale) => locale.code) as AppLocale[]
export const localeSlugs = supportedLocales.map((locale) => locale.slug) as AppLocaleSlug[]

const supportedLocalesByCode = new Map<AppLocale, AppLocaleDefinition>(
  supportedLocales.map((locale) => [locale.code, locale]),
)

const localeLookup = new Map<string, AppLocaleDefinition>()

function canonicalizeLocale(value: string): null | string {
  try {
    return Intl.getCanonicalLocales(value)[0] ?? null
  } catch {
    return null
  }
}

function getLocaleLookupKey(value: string): null | string {
  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  return (canonicalizeLocale(trimmed) ?? trimmed).toLowerCase()
}

function registerLocaleLookup(value: string, locale: AppLocaleDefinition) {
  const key = getLocaleLookupKey(value)

  if (key) {
    localeLookup.set(key, locale)
  }
}

for (const locale of supportedLocales) {
  registerLocaleLookup(locale.code, locale)
  registerLocaleLookup(locale.slug, locale)

  for (const alias of locale.aliases) {
    registerLocaleLookup(alias, locale)
  }
}

export function isLocale(value: string): value is AppLocale {
  return supportedLocalesByCode.has(value as AppLocale)
}

export function resolveLocaleDefinition(value: null | string | undefined): AppLocaleDefinition | null {
  if (typeof value !== 'string') {
    return null
  }

  const key = getLocaleLookupKey(value)

  if (!key) {
    return null
  }

  return localeLookup.get(key) ?? null
}

export function normalizeLocale(value: null | string | undefined): AppLocale | null {
  return resolveLocaleDefinition(value)?.code ?? null
}

export function getLocaleSlug(value: AppLocale | null | string | undefined): AppLocaleSlug {
  return resolveLocaleDefinition(value)?.slug ?? defaultLocaleSlug
}

export function buildLocalePath(locale: AppLocale | null | string | undefined, pathname = ''): string {
  const slug = getLocaleSlug(locale)

  if (!pathname || pathname === '/') {
    return `/${slug}`
  }

  return pathname.startsWith('/') ? `/${slug}${pathname}` : `/${slug}/${pathname}`
}

export function getLocaleLabel(locale: null | string | undefined): string {
  if (typeof locale !== 'string') {
    return ''
  }

  return resolveLocaleDefinition(locale)?.label ?? locale
}

export function parseAcceptLanguageHeader(value: null | string | undefined): string[] {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return []
  }

  return value
    .split(',')
    .map((entry, index) => {
      const [tag, ...parameters] = entry.trim().split(';')

      if (!tag || tag === '*') {
        return null
      }

      let quality = 1

      for (const parameter of parameters) {
        const [rawKey, rawValue] = parameter.split('=')

        if (rawKey?.trim() !== 'q') {
          continue
        }

        const parsedValue = Number(rawValue)

        if (Number.isFinite(parsedValue)) {
          quality = parsedValue
        }
      }

      if (quality <= 0) {
        return null
      }

      const canonical = canonicalizeLocale(tag)

      if (!canonical) {
        return null
      }

      return {
        index,
        quality,
        tag: canonical,
      }
    })
    .filter(
      (candidate): candidate is { index: number; quality: number; tag: string } => Boolean(candidate),
    )
    .sort((left, right) => {
      if (right.quality !== left.quality) {
        return right.quality - left.quality
      }

      return left.index - right.index
    })
    .map((candidate) => candidate.tag)
}

export function matchPreferredLocale(preferredLocales: readonly string[]): AppLocale {
  const supported = localeCodes as string[]
  const requestedLocales = preferredLocales
    .map((locale) => canonicalizeLocale(locale))
    .filter((locale): locale is string => Boolean(locale))

  if (requestedLocales.length === 0) {
    return defaultLocale
  }

  const matchedLocale = match(requestedLocales, supported, defaultLocale)

  return normalizeLocale(matchedLocale) ?? defaultLocale
}

export function resolvePreferredLocale(value: null | string | undefined): AppLocale {
  return matchPreferredLocale(parseAcceptLanguageHeader(value))
}

export function getTranslationSourceLocale(targetLocale: AppLocale): AppLocale {
  if (targetLocale === defaultLocale) {
    return 'en'
  }

  return defaultLocale
}
