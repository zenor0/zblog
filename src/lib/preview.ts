import type { Locale as PayloadLocale } from 'payload'

import { buildLocalePath, defaultLocale, normalizeLocale, type AppLocale } from '@/lib/locales'

type PreviewLocaleInput = null | PayloadLocale | string | undefined

export function resolvePreviewLocale(locale: PreviewLocaleInput): AppLocale {
  const localeCode = typeof locale === 'string' ? locale : locale?.code

  return normalizeLocale(localeCode) ?? defaultLocale
}

export function buildPostPath(args: { locale?: PreviewLocaleInput; slug: string }) {
  const locale = resolvePreviewLocale(args.locale)

  return buildLocalePath(locale, `/posts/${encodeURIComponent(args.slug)}`)
}

export function buildPostDraftPreviewPath(args: {
  id: number | string
  locale?: PreviewLocaleInput
}) {
  const locale = resolvePreviewLocale(args.locale)

  return buildLocalePath(locale, `/preview/posts/${encodeURIComponent(String(args.id))}`)
}

export function buildPostPreviewURL(args: {
  id: number | string
  locale?: PreviewLocaleInput
}) {
  return buildPostPreviewRequestURL(args)
}

export function buildPostLivePreviewURL(args: {
  id: number | string
  locale?: PreviewLocaleInput
}) {
  return buildPostPreviewRequestURL({
    ...args,
    view: 'live-preview',
  })
}

function buildPostPreviewRequestURL(args: {
  id: number | string
  locale?: PreviewLocaleInput
  view?: 'live-preview'
}) {
  const params = new URLSearchParams({
    collection: 'posts',
    id: String(args.id),
    locale: resolvePreviewLocale(args.locale),
  })

  if (args.view) {
    params.set('view', args.view)
  }

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
