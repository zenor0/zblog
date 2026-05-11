import type { MetadataRoute } from 'next'

import { isPostIndexable } from '@/features/posts/server/queries'
import { buildLocalePath, localeCodes } from '@/shared/i18n/locales'
import { getPayloadClient } from '@/shared/payload/client'
import { buildAbsoluteURL } from '@/shared/content/seo'
import type { Post } from '@/payload-types'

function isSitemapRenderablePost(post: null | Post): post is Post {
  return Boolean(
    post &&
      typeof post.slug === 'string' &&
      post.slug.trim().length > 0 &&
      typeof post.title === 'string' &&
      post.title.trim().length > 0 &&
      typeof post.content === 'string' &&
      post.content.trim().length > 0 &&
      isPostIndexable(post),
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
