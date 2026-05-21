import type { Locale as PayloadLocale } from 'payload'

import { buildLocalePath, defaultLocale, normalizeLocale, type AppLocale } from '@/shared/i18n/locales'
import { buildPagePath } from '@/features/pages/model/page-slugs'

type PreviewLocaleInput = null | PayloadLocale | string | undefined

export function resolveAdminDocumentID(value: unknown) {
  if (typeof value === 'number' || typeof value === 'string') {
    return value
  }

  return null
}

export function resolvePagePreviewLocale(locale: PreviewLocaleInput): AppLocale {
  const localeCode = typeof locale === 'string' ? locale : locale?.code

  return normalizeLocale(localeCode) ?? defaultLocale
}

export function buildPageFrontendPath(args: { locale?: PreviewLocaleInput; slug: string }) {
  const locale = resolvePagePreviewLocale(args.locale)

  return buildLocalePath(locale, buildPagePath(args.slug))
}

export function buildPageDraftPreviewPath(args: {
  id: number | string
  locale?: PreviewLocaleInput
}) {
  const locale = resolvePagePreviewLocale(args.locale)

  return buildLocalePath(locale, `/preview/pages/${encodeURIComponent(String(args.id))}`)
}

export function buildPagePreviewURL(args: {
  id: number | string
  locale?: PreviewLocaleInput
}) {
  return buildPagePreviewRequestURL(args)
}

export function buildPageLivePreviewURL(args: {
  id: number | string
  locale?: PreviewLocaleInput
}) {
  return buildPagePreviewRequestURL({
    ...args,
    view: 'live-preview',
  })
}

function buildPagePreviewRequestURL(args: {
  id: number | string
  locale?: PreviewLocaleInput
  view?: 'live-preview'
}) {
  const params = new URLSearchParams({
    collection: 'pages',
    id: String(args.id),
    locale: resolvePagePreviewLocale(args.locale),
  })

  if (args.view) {
    params.set('view', args.view)
  }

  return `/api/preview?${params.toString()}`
}

export function buildPageAdminPath(id: number | string) {
  return `/admin/collections/pages/${encodeURIComponent(String(id))}`
}
