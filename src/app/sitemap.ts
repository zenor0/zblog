import type { MetadataRoute } from 'next'

import { isPostIndexable } from '@/features/posts/server/queries'
import { isPostListed, publishedListedPostWhere } from '@/features/posts/model/post-visibility'
import { getPublishedPages } from '@/features/pages/server/queries'
import { buildPagePath } from '@/features/pages/model/page-slugs'
import { getProjectTimestamp, isProjectIndexable } from '@/features/projects/server/queries'
import { getResolvedSiteSettings } from '@/features/site-settings/model/site-settings'
import {
  buildUtilityPagePath,
  utilityPageSitemapConfigs,
} from '@/features/utility-pages/model/utility-pages'
import { buildLocalePath, defaultLocale, localeCodes, type AppLocale } from '@/shared/i18n/locales'
import { getPayloadClient } from '@/shared/payload/client'
import { buildAbsoluteURL } from '@/shared/content/seo'
import type { Page, Post, Project } from '@/payload-types'

export const dynamic = 'force-dynamic'

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
    isPostListed(post) &&
    isPostIndexable(post),
  )
}

function isSitemapRenderableProject(project: null | Project): project is Project {
  return Boolean(
    project &&
    typeof project.slug === 'string' &&
    project.slug.trim().length > 0 &&
    typeof project.title === 'string' &&
    project.title.trim().length > 0 &&
    typeof project.summary === 'string' &&
    project.summary.trim().length > 0 &&
    isProjectIndexable(project),
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

function buildProjectPath(slug: string) {
  return `/projects/${encodeURIComponent(slug.trim())}`
}

function getPageSitemapPriority(page: Page) {
  return page.slug === 'privacy' || page.slug === 'terms' ? 0.2 : 0.5
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayloadClient()
  const [
    localizedSiteSettings,
    localizedPageGroups,
    localizedPostGroups,
    localizedProjectGroups,
  ] = await Promise.all([
    Promise.all(
      localeCodes.map(async (locale) => {
        const settings = await getResolvedSiteSettings(locale)

        return {
          locale,
          settings,
        }
      }),
    ),
    Promise.all(
      localeCodes.map(async (locale) => ({
        locale,
        pages: await getPublishedPages(locale),
      })),
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
          where: publishedListedPostWhere,
        })

        return {
          locale,
          posts: result.docs.filter(isSitemapRenderablePost),
        }
      }),
    ),
    Promise.all(
      localeCodes.map(async (locale) => {
        const result = await payload.find({
          collection: 'projects',
          depth: 0,
          fallbackLocale: false,
          limit: 1000,
          locale,
          overrideAccess: false,
          sort: 'sortOrder',
          where: {
            _status: {
              equals: 'published',
            },
          },
        })

        return {
          locale,
          projects: result.docs.filter(isSitemapRenderableProject),
        }
      }),
    ),
  ])
  const localizedHomeEntries = localizedSiteSettings.map(({ locale, settings }) => ({
    alternates: buildSitemapAlternates({
      locales: localeCodes,
      pathname: '',
    }),
    changeFrequency: 'daily' as const,
    lastModified: settings.updatedAt ?? new Date().toISOString(),
    priority: 1,
    url: buildAbsoluteURL(buildLocalePath(locale)),
  }))
  const localizedUtilityPageEntries = localizedSiteSettings.flatMap(({ locale, settings }) =>
    utilityPageSitemapConfigs.map((config) => {
      const pathname = buildUtilityPagePath(config.slug)

      return {
        alternates: buildSitemapAlternates({
          locales: localeCodes,
          pathname,
        }),
        changeFrequency: config.changeFrequency,
        lastModified: settings.updatedAt ?? new Date().toISOString(),
        priority: config.priority,
        url: buildAbsoluteURL(buildLocalePath(locale, pathname)),
      }
    }),
  )
  const pageLocalesBySlug = new Map<string, AppLocale[]>()

  localizedPageGroups.forEach(({ locale, pages }) => {
    pages.forEach((page) => {
      const slug = page.slug.trim()
      const locales = pageLocalesBySlug.get(slug) ?? []

      locales.push(locale)
      pageLocalesBySlug.set(slug, locales)
    })
  })
  const localizedPageEntries = localizedPageGroups.flatMap(({ locale, pages }) =>
    pages.map((page) => {
      const slug = page.slug.trim()
      const pathname = buildPagePath(slug)

      return {
        alternates: buildSitemapAlternates({
          locales: pageLocalesBySlug.get(slug) ?? [locale],
          pathname,
        }),
        changeFrequency: 'monthly' as const,
        lastModified: page.updatedAt ?? page.publishedAt ?? new Date().toISOString(),
        priority: getPageSitemapPriority(page),
        url: buildAbsoluteURL(buildLocalePath(locale, pathname)),
      }
    }),
  )
  const localesBySlug = new Map<string, AppLocale[]>()

  localizedPostGroups.forEach(({ locale, posts }) => {
    posts.forEach((post) => {
      const slug = post.slug.trim()
      const locales = localesBySlug.get(slug) ?? []

      locales.push(locale)
      localesBySlug.set(slug, locales)
    })
  })
  const projectLocalesBySlug = new Map<string, AppLocale[]>()

  localizedProjectGroups.forEach(({ locale, projects }) => {
    projects.forEach((project) => {
      const slug = project.slug.trim()
      const locales = projectLocalesBySlug.get(slug) ?? []

      locales.push(locale)
      projectLocalesBySlug.set(slug, locales)
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
  const localizedProjectEntries = localizedProjectGroups.flatMap(({ locale, projects }) =>
    projects.map((project) => {
      const slug = project.slug.trim()
      const pathname = buildProjectPath(slug)

      return {
        alternates: buildSitemapAlternates({
          locales: projectLocalesBySlug.get(slug) ?? [locale],
          pathname,
        }),
        changeFrequency: 'monthly' as const,
        lastModified: getProjectTimestamp(project) ?? new Date().toISOString(),
        priority: 0.6,
        url: buildAbsoluteURL(buildLocalePath(locale, pathname)),
      }
    }),
  )

  return [
    ...localizedHomeEntries,
    ...localizedUtilityPageEntries,
    ...localizedPageEntries,
    ...localizedPostEntries,
    ...localizedProjectEntries,
  ]
}
