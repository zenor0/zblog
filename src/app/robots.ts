import type { MetadataRoute } from 'next'

import { buildAbsoluteURL, getSiteURL } from '@/shared/content/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    host: getSiteURL().origin,
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
    sitemap: buildAbsoluteURL('/sitemap.xml'),
  }
}
