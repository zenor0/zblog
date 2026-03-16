import type { MetadataRoute } from 'next'

import { buildLocalePath, localeCodes } from '@/lib/locales'
import { getPayloadClient } from '@/lib/payload'
import { buildAbsoluteURL } from '@/lib/seo'
import type { Post } from '@/payload-types'

function isSitemapRenderablePost(post: null | Post): post is Post {
  return Boolean(
    post &&
      typeof post.slug === 'string' &&
      post.slug.trim().length > 0 &&
      typeof post.title === 'string' &&
      post.title.trim().length > 0 &&
      typeof post.content === 'string' &&
      post.content.trim().length > 0,
  )
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayloadClient()
  const localizedPostEntries = await Promise.all(
    localeCodes.map(async (locale) => {
      const result = await payload.find({
        collection: 'posts',
        depth: 0,
        fallbackLocale: false,
        limit: 1000,
        locale,
        overrideAccess: false,
        sort: '-updatedAt',
        where: {
          _status: {
            equals: 'published',
          },
        },
      })

      return result.docs
        .filter(isSitemapRenderablePost)
        .map((post) => ({
          lastModified: post.updatedAt ?? post.publishedAt ?? new Date().toISOString(),
          url: buildAbsoluteURL(buildLocalePath(locale, `/posts/${encodeURIComponent(post.slug)}`)),
        }))
    }),
  )

  return [
    ...localeCodes.map((locale) => ({
      url: buildAbsoluteURL(buildLocalePath(locale)),
    })),
    ...localizedPostEntries.flat(),
  ]
}
