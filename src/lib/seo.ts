import type { Metadata } from 'next'

import { buildLocalePath, defaultLocale, getLocaleLabel, supportedLocales, type AppLocale } from '@/lib/locales'

const fallbackSiteURL = 'http://localhost:3000'
const defaultDescriptionLength = 160
const openGraphLocales: Record<AppLocale, string> = {
  en: 'en_US',
  'zh-Hans': 'zh_CN',
}

export type MetadataImageSource = {
  alt?: null | string
  height?: null | number
  url?: null | string
  width?: null | number
}

type ResolvedMetadataImage = {
  alt?: string
  height?: number
  url: string
  width?: number
}

type StructuredDataRecord = {
  [key: string]: unknown
}

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function truncateText(value: string, maxLength = defaultDescriptionLength) {
  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`
}

function normalizeText(value: null | string | undefined) {
  if (typeof value !== 'string') {
    return undefined
  }

  const normalized = collapseWhitespace(value)

  return normalized.length > 0 ? normalized : undefined
}

function stripMarkdown(markdown: string) {
  return collapseWhitespace(
    markdown
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/[*_~>#-]/g, ' ')
      .replace(/^\d+\.\s+/gm, '')
      .replace(/\s{2,}/g, ' '),
  )
}

function getOpenGraphLocale(locale: AppLocale) {
  return openGraphLocales[locale]
}

function resolveSourceImage(image: MetadataImageSource | null | undefined): ResolvedMetadataImage | null {
  if (!image?.url || typeof image.url !== 'string') {
    return null
  }

  return {
    alt: normalizeText(image.alt),
    height: typeof image.height === 'number' ? image.height : undefined,
    url: buildAbsoluteURL(image.url),
    width: typeof image.width === 'number' ? image.width : undefined,
  }
}

function buildOpenGraphImageObject(image: ResolvedMetadataImage) {
  return {
    alt: image.alt,
    height: image.height,
    url: image.url,
    width: image.width,
  }
}

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

export function buildPageTitle(args: {
  pageTitle?: null | string
  siteName: string
}) {
  const siteName = normalizeText(args.siteName) ?? 'ZBlog'
  const pageTitle = normalizeText(args.pageTitle)

  if (!pageTitle || pageTitle === siteName) {
    return siteName
  }

  return `${pageTitle} | ${siteName}`
}

export function buildSeoDescription(args: {
  content?: null | string
  fallback?: null | string
  maxLength?: number
  value?: null | string
}) {
  const maxLength = args.maxLength ?? defaultDescriptionLength
  const primary = normalizeText(args.value)

  if (primary) {
    return truncateText(primary, maxLength)
  }

  const fallback = normalizeText(args.fallback)

  if (fallback) {
    return truncateText(fallback, maxLength)
  }

  const content = normalizeText(args.content ? stripMarkdown(args.content) : undefined)

  return content ? truncateText(content, maxLength) : undefined
}

export function buildDefaultSocialImageURL(args: {
  description?: null | string
  eyebrow?: null | string
  locale: AppLocale
  title: string
}) {
  const searchParams = new URLSearchParams({
    locale: args.locale,
    title: buildPageTitle({
      pageTitle: args.title,
      siteName: args.title,
    }),
  })
  const description = normalizeText(args.description)
  const eyebrow = normalizeText(args.eyebrow) ?? `${getLocaleLabel(args.locale)} · ZBlog`

  searchParams.set('eyebrow', eyebrow)

  if (description) {
    searchParams.set('description', description)
  }

  return buildAbsoluteURL(`/api/og?${searchParams.toString()}`)
}

export function resolveMetadataImage(args: {
  description?: null | string
  eyebrow?: null | string
  fallbackImage?: MetadataImageSource | null
  image?: MetadataImageSource | null
  locale: AppLocale
  title: string
}): ResolvedMetadataImage {
  const explicitImage = resolveSourceImage(args.image) ?? resolveSourceImage(args.fallbackImage)

  if (explicitImage) {
    return explicitImage
  }

  return {
    alt: normalizeText(args.title) ?? 'Social share image',
    url: buildDefaultSocialImageURL({
      description: args.description,
      eyebrow: args.eyebrow,
      locale: args.locale,
      title: args.title,
    }),
  }
}

export function buildPageMetadata(args: {
  canonicalLocale: AppLocale
  content?: null | string
  description?: null | string
  fallbackDescription?: null | string
  fallbackImage?: MetadataImageSource | null
  image?: MetadataImageSource | null
  locales?: readonly AppLocale[]
  openGraphType?: 'article' | 'website'
  pathname?: string
  publishedTime?: null | string
  robots?: Metadata['robots']
  siteName: string
  title?: null | string
  xDefaultPath?: string
}) {
  const pageTitle = buildPageTitle({
    pageTitle: args.title,
    siteName: args.siteName,
  })
  const description = buildSeoDescription({
    content: args.content,
    fallback: args.fallbackDescription,
    value: args.description,
  })
  const canonicalURL = buildAbsoluteURL(buildLocalePath(args.canonicalLocale, args.pathname))
  const metadataImage = resolveMetadataImage({
    description,
    fallbackImage: args.fallbackImage,
    image: args.image,
    locale: args.canonicalLocale,
    title: pageTitle,
  })
  const alternateLocales = (args.locales ?? supportedLocales.map((locale) => locale.code))
    .filter((locale) => locale !== args.canonicalLocale)
    .map(getOpenGraphLocale)

  return {
    alternates: buildLocaleAlternates({
      canonicalLocale: args.canonicalLocale,
      locales: args.locales,
      pathname: args.pathname,
      xDefaultPath: args.xDefaultPath,
    }),
    description,
    openGraph: {
      alternateLocale: alternateLocales,
      description,
      images: [buildOpenGraphImageObject(metadataImage)],
      locale: getOpenGraphLocale(args.canonicalLocale),
      publishedTime: args.openGraphType === 'article' ? args.publishedTime ?? undefined : undefined,
      siteName: args.siteName,
      title: pageTitle,
      type: args.openGraphType ?? 'website',
      url: canonicalURL,
    },
    robots: args.robots,
    title: pageTitle,
    twitter: {
      card: 'summary_large_image',
      description,
      images: [metadataImage.url],
      title: pageTitle,
    },
  } satisfies Metadata
}

function buildOrganizationData(args: {
  description?: null | string
  image?: MetadataImageSource | null
  siteName: string
}) {
  const image = resolveSourceImage(args.image)

  return {
    '@id': `${getSiteURL().origin}#organization`,
    '@type': 'Organization',
    description: normalizeText(args.description),
    image: image?.url,
    name: args.siteName,
    url: getSiteURL().origin,
  } satisfies StructuredDataRecord
}

export function buildHomeStructuredData(args: {
  description?: null | string
  image?: MetadataImageSource | null
  locale: AppLocale
  siteName: string
}) {
  const localizedURL = buildAbsoluteURL(buildLocalePath(args.locale))
  const organization = buildOrganizationData(args)

  return {
    '@context': 'https://schema.org',
    '@graph': [
      organization,
      {
        '@id': `${localizedURL}#website`,
        '@type': 'WebSite',
        description: normalizeText(args.description),
        inLanguage: args.locale,
        name: args.siteName,
        publisher: {
          '@id': organization['@id'],
        },
        url: localizedURL,
      },
    ],
  } satisfies StructuredDataRecord
}

export function buildArticleStructuredData(args: {
  authorName?: null | string
  description?: null | string
  image?: MetadataImageSource | null
  locale: AppLocale
  modifiedAt?: null | string
  pathname: string
  publishedAt?: null | string
  siteDescription?: null | string
  siteName: string
  title: string
}) {
  const canonicalURL = buildAbsoluteURL(buildLocalePath(args.locale, args.pathname))
  const organization = buildOrganizationData({
    description: args.siteDescription,
    image: args.image,
    siteName: args.siteName,
  })
  const image = resolveMetadataImage({
    description: args.description ?? args.siteDescription,
    image: args.image,
    locale: args.locale,
    title: args.title,
  })
  const authorName = normalizeText(args.authorName) ?? args.siteName
  const authorType = authorName === args.siteName ? 'Organization' : 'Person'

  return {
    '@context': 'https://schema.org',
    '@graph': [
      organization,
      {
        '@type': 'BlogPosting',
        author: {
          '@type': authorType,
          name: authorName,
        },
        dateModified: args.modifiedAt ?? undefined,
        datePublished: args.publishedAt ?? args.modifiedAt ?? undefined,
        description: normalizeText(args.description),
        headline: args.title,
        image: [image.url],
        inLanguage: args.locale,
        mainEntityOfPage: canonicalURL,
        publisher: {
          '@id': organization['@id'],
        },
        url: canonicalURL,
      },
    ],
  } satisfies StructuredDataRecord
}

export function serializeStructuredData(value: StructuredDataRecord) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}
