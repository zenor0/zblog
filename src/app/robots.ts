import type { MetadataRoute } from 'next'

import { buildAbsoluteURL, getSiteURL } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    host: getSiteURL().origin,
    rules: [
      {
        allow: '/',
        userAgent: '*',
      },
    ],
    sitemap: buildAbsoluteURL('/sitemap.xml'),
  }
}
