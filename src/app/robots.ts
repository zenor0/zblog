import type { MetadataRoute } from 'next'

import { getResolvedSiteSettings } from '@/features/site-settings/model/site-settings'
import { buildAbsoluteURL, getSiteURL } from '@/shared/content/seo'
import { defaultLocale } from '@/shared/i18n/locales'

export const dynamic = 'force-dynamic'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getResolvedSiteSettings(defaultLocale)
  const siteURL = settings.siteURL

  return {
    host: getSiteURL(siteURL).origin,
    rules: [
      {
        allow: ['/', '/api/og'],
        disallow: [
          '/admin/',
          '/api/',
          '/preview/',
          '/*/preview/',
          '/dev/',
          '/*/dev/',
          '/*/posts/*/history',
        ],
        userAgent: '*',
      },
    ],
    sitemap: buildAbsoluteURL('/sitemap.xml', siteURL),
  }
}
