import type { MetadataRoute } from 'next'

import { isPostIndexable } from '@/features/posts/server/queries'
import { getResolvedSiteSettings } from '@/features/site-settings/model/site-settings'
import { buildLocalePath, defaultLocale, localeCodes, type AppLocale } from '@/shared/i18n/locales'
import { getPayloadClient } from '@/shared/payload/client'
import { buildAbsoluteURL } from '@/shared/content/seo'
import type { Post } from '@/payload-types'

type SitemapEntry = MetadataRoute.Sitemap[number]

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

function buildSitemapAlternates(args: {
  locales: readonly AppLocale[]
  pathname: string
}): NonNullable<SitemapEntry['alternates']> {
  const xDefaultLocale = args.locales.includes(defaultLocale)
    ? defaultLocale
    : (args.locales[0] ?? defaultLocale)
  const languages = Object.fromEntries(
    args.locales.map((locale) => [
      locale,
      buildAbsoluteURL(buildLocalePath(locale, args.pathname)),
    ]),
  )

  return {
    languages: {
      ...languages,
      'x-default': buildAbsoluteURL(buildLocalePath(xDefaultLocale, args.pathname)),
    },
  }
}

function buildPostPath(slug: string) {
  return `/posts/${encodeURIComponent(slug.trim())}`
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayloadClient()
  const [localizedHomeEntries, localizedPostGroups] = await Promise.all([
    Promise.all(
      localeCodes.map(async (locale) => {
        const settings = await getResolvedSiteSettings(locale)

        return {
          alternates: buildSitemapAlternates({
            locales: localeCodes,
            pathname: '',
          }),
          changeFrequency: 'daily' as const,
          lastModified: settings.updatedAt ?? new Date().toISOString(),
          priority: 1,
          url: buildAbsoluteURL(buildLocalePath(locale)),
        }
      }),
    ),
    Promise.all(
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

        return {
          locale,
          posts: result.docs.filter(isSitemapRenderablePost),
        }
      }),
    ),
  ])
  const localesBySlug = new Map<string, AppLocale[]>()

  localizedPostGroups.forEach(({ locale, posts }) => {
    posts.forEach((post) => {
      const slug = post.slug.trim()
      const locales = localesBySlug.get(slug) ?? []

      locales.push(locale)
      localesBySlug.set(slug, locales)
    })
  })
  const localizedPostEntries = localizedPostGroups.flatMap(({ locale, posts }) =>
    posts.map((post) => {
      const slug = post.slug.trim()
      const pathname = buildPostPath(slug)

      return {
        alternates: buildSitemapAlternates({
          locales: localesBySlug.get(slug) ?? [locale],
          pathname,
        }),
        changeFrequency: 'weekly' as const,
        lastModified: post.updatedAt ?? post.publishedAt ?? new Date().toISOString(),
        priority: 0.7,
        url: buildAbsoluteURL(buildLocalePath(locale, pathname)),
      }
    }),
  )

  return [...localizedHomeEntries, ...localizedPostEntries]
}
