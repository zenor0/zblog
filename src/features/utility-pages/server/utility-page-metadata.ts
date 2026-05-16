import type { Metadata } from 'next'

import type { SiteSettings } from '@/features/site-settings/model/site-settings'
import type { AppLocale } from '@/shared/i18n/locales'
import type { UtilityPageSlug } from '@/features/utility-pages/model/utility-pages'

import {
  buildUtilityPagePath,
  getUtilityPageCopy,
} from '@/features/utility-pages/model/utility-pages'
import { buildPageMetadata } from '@/shared/content/seo'

export function buildUtilityPageMetadata(args: {
  locale: AppLocale
  settings: SiteSettings
  slug: UtilityPageSlug
}): Metadata {
  const copy = getUtilityPageCopy(args.locale, args.slug)

  return buildPageMetadata({
    canonicalLocale: args.locale,
    description: copy.metaDescription,
    fallbackDescription: args.settings.siteDescription,
    pathname: buildUtilityPagePath(args.slug),
    siteName: args.settings.siteName,
    title: copy.title,
  })
}
