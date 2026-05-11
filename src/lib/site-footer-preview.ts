import type { AppLocale } from '@/lib/locales'
import type { SiteSettings } from '@/lib/site-settings'

import { defaultLocale, normalizeLocale } from '@/lib/locales'

export const siteFooterPreviewRoute = '/preview/site-footer'
export const siteFooterPreviewMessageType = 'zblog-site-footer-preview'
export const siteFooterPreviewReadyMessageType = 'zblog-site-footer-preview-ready'
export const siteFooterPreviewResizeMessageType = 'zblog-site-footer-preview-resize'

export type SiteFooterPreviewMessage = {
  locale: AppLocale
  settings: SiteSettings
  type: typeof siteFooterPreviewMessageType
}

export type SiteFooterPreviewReadyMessage = {
  type: typeof siteFooterPreviewReadyMessageType
}

export type SiteFooterPreviewResizeMessage = {
  height: number
  type: typeof siteFooterPreviewResizeMessageType
}

export function resolveSiteFooterPreviewLocale(
  locale: AppLocale | null | string | undefined,
): AppLocale {
  return normalizeLocale(locale) ?? defaultLocale
}

export function buildSiteFooterPreviewURL(locale: AppLocale | null | string | undefined) {
  const previewLocale = resolveSiteFooterPreviewLocale(locale)

  return `${siteFooterPreviewRoute}?locale=${encodeURIComponent(previewLocale)}`
}

export function isSiteFooterPreviewMessage(value: unknown): value is SiteFooterPreviewMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { type?: unknown }).type === siteFooterPreviewMessageType &&
    typeof (value as { settings?: unknown }).settings === 'object'
  )
}

export function isSiteFooterPreviewReadyMessage(
  value: unknown,
): value is SiteFooterPreviewReadyMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { type?: unknown }).type === siteFooterPreviewReadyMessageType
  )
}

export function isSiteFooterPreviewResizeMessage(
  value: unknown,
): value is SiteFooterPreviewResizeMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { type?: unknown }).type === siteFooterPreviewResizeMessageType &&
    typeof (value as { height?: unknown }).height === 'number'
  )
}
