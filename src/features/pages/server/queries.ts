import { cache } from 'react'

import type { Page, User } from '@/payload-types'

import { isEditor } from '@/shared/auth/access'
import { defaultLocale, localeCodes, type AppLocale } from '@/shared/i18n/locales'
import { getPayloadClient } from '@/shared/payload/client'
import { validatePageSlug } from '@/features/pages/model/page-slugs'

export type ResolvedPage = {
  page: Page
  requestedLocale: AppLocale
  resolvedLocale: AppLocale
  sourcePage: Page | null
  usedDraftAccess: boolean
  usedFallback: boolean
}

export const publishedPageWhere = {
  _status: {
    equals: 'published',
  },
} as const

function isRenderablePage(page: null | Page, allowUntitled = false): page is Page {
  if (!page || typeof page.content !== 'string' || page.content.trim().length === 0) {
    return false
  }

  if (allowUntitled) {
    return true
  }

  return typeof page.title === 'string' && page.title.trim().length > 0
}

export function isPageIndexable(page: null | Page) {
  return !page?.seo?.noindex
}

function buildPageWhere(args: { slug?: string; usedDraftAccess: boolean }) {
  return {
    and: [
      ...(args.usedDraftAccess ? [] : [publishedPageWhere]),
      ...(args.slug
        ? [
            {
              slug: {
                equals: args.slug,
              },
            },
          ]
        : []),
    ],
  }
}

async function findPageByConstraint(args: {
  draft?: boolean
  id?: number
  locale: AppLocale
  slug?: string
  user?: null | User
}): Promise<ResolvedPage | null> {
  if (args.slug && validatePageSlug(args.slug) !== true) {
    return null
  }

  const payload = await getPayloadClient()
  const usedDraftAccess = Boolean(args.draft && isEditor(args.user))
  const accessArgs = usedDraftAccess
    ? {
        user: args.user,
      }
    : {}
  const where = args.id
    ? {
        and: [
          ...(usedDraftAccess ? [] : [publishedPageWhere]),
          {
            id: {
              equals: args.id,
            },
          },
        ],
      }
    : buildPageWhere({
        slug: args.slug,
        usedDraftAccess,
      })

  const localizedResult = await payload.find({
    collection: 'pages',
    depth: 1,
    draft: usedDraftAccess,
    fallbackLocale: false,
    limit: 1,
    locale: args.locale,
    overrideAccess: false,
    ...accessArgs,
    where,
  })
  const sourcePage = localizedResult.docs[0] ?? null
  let page = sourcePage
  let resolvedLocale = args.locale
  let usedFallback = false

  if (!isRenderablePage(page, usedDraftAccess) && args.locale !== defaultLocale) {
    const fallbackResult = await payload.find({
      collection: 'pages',
      depth: 1,
      draft: usedDraftAccess,
      fallbackLocale: false,
      limit: 1,
      locale: defaultLocale,
      overrideAccess: false,
      ...accessArgs,
      where,
    })

    page = fallbackResult.docs[0] ?? null
    resolvedLocale = defaultLocale
    usedFallback = true
  }

  if (!isRenderablePage(page, usedDraftAccess)) {
    return null
  }

  return {
    page,
    requestedLocale: args.locale,
    resolvedLocale,
    sourcePage,
    usedDraftAccess,
    usedFallback,
  }
}

export async function getPageBySlug(args: {
  draft?: boolean
  locale: AppLocale
  slug: string
  user?: null | User
}): Promise<ResolvedPage | null> {
  return findPageByConstraint(args)
}

export async function getPageByID(args: {
  draft?: boolean
  id: number
  locale: AppLocale
  user?: null | User
}): Promise<ResolvedPage | null> {
  return findPageByConstraint(args)
}

const getCachedPublishedPages = cache(async (locale: AppLocale): Promise<Page[]> => {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'pages',
    depth: 1,
    fallbackLocale: false,
    limit: 1000,
    locale,
    overrideAccess: false,
    sort: 'slug',
    where: publishedPageWhere,
  })

  return result.docs.filter((page) => isRenderablePage(page) && isPageIndexable(page))
})

export async function getPublishedPages(locale: AppLocale): Promise<Page[]> {
  return getCachedPublishedPages(locale)
}

export async function getRenderablePageLocales(args: { slug: string }): Promise<AppLocale[]> {
  const results = await Promise.all(
    localeCodes.map(async (locale) => {
      const resolved = await getPageBySlug({
        locale,
        slug: args.slug,
      })

      if (!resolved || resolved.usedFallback || !isPageIndexable(resolved.page)) {
        return null
      }

      return locale
    }),
  )

  return results.filter((locale): locale is AppLocale => Boolean(locale))
}
