import { defaultLocale, isLocale, type AppLocale } from '@/lib/locales'

export function resolvePreviewLocale(locale: null | string | undefined): AppLocale {
  if (typeof locale === 'string' && isLocale(locale)) {
    return locale
  }

  return defaultLocale
}

export function buildPostPath(args: { locale?: null | string; slug: string }) {
  const locale = resolvePreviewLocale(args.locale)

  return `/${locale}/posts/${encodeURIComponent(args.slug)}`
}

export function buildPostDraftPreviewPath(args: {
  id: number | string
  locale?: null | string
}) {
  const locale = resolvePreviewLocale(args.locale)

  return `/${locale}/preview/posts/${encodeURIComponent(String(args.id))}`
}

export function buildPostPreviewURL(args: {
  id: number | string
  locale?: null | string
}) {
  const params = new URLSearchParams({
    collection: 'posts',
    id: String(args.id),
    locale: resolvePreviewLocale(args.locale),
  })

  return `/api/preview?${params.toString()}`
}

export function buildExitPreviewURL(path: string) {
  return `/api/exit-preview?path=${encodeURIComponent(path)}`
}

export function buildPostAdminPath(id: number | string) {
  return `/admin/collections/posts/${encodeURIComponent(String(id))}`
}

export function sanitizePreviewPath(pathname: null | string | undefined): null | string {
  if (typeof pathname !== 'string' || pathname.trim().length === 0) {
    return null
  }

  const baseURL = new URL('http://preview.local')
  const parsedURL = new URL(pathname, baseURL)

  if (parsedURL.origin !== baseURL.origin) {
    return null
  }

  return `${parsedURL.pathname}${parsedURL.search}${parsedURL.hash}`
}
