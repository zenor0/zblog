import type { Payload } from 'payload'

import { defaultLocale, localeCodes, type AppLocale } from '@/shared/i18n/locales'
import { starterSitePages, type StarterSitePageCopy } from '@/features/pages/seed/starter-site-pages'

type SeedPagesPayload = Pick<Payload, 'create' | 'find' | 'update'>

function buildSeedPageData(args: {
  copy: StarterSitePageCopy
  slug?: string
}): Record<string, unknown> {
  return {
    ...(args.slug ? { slug: args.slug } : {}),
    _status: 'published',
    content: args.copy.content,
    description: args.copy.description,
    effectiveDateLabel: args.copy.effectiveDateLabel ?? null,
    eyebrow: args.copy.eyebrow,
    seo: {
      metaDescription: args.copy.metaDescription,
      metaTitle: null,
      noindex: false,
    },
    title: args.copy.title,
  }
}

function getExistingPageID(value: unknown): null | number | string {
  if (!value || typeof value !== 'object') {
    return null
  }

  const id = (value as { id?: unknown }).id

  return typeof id === 'number' || typeof id === 'string' ? id : null
}

function hasSeedPageText(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function hasRequiredSeedPageLocaleContent(value: unknown): boolean {
  if (!value || typeof value !== 'object') {
    return false
  }

  const page = value as {
    content?: unknown
    description?: unknown
    title?: unknown
  }

  return (
    hasSeedPageText(page.title) &&
    hasSeedPageText(page.description) &&
    hasSeedPageText(page.content)
  )
}

async function findExistingPage(payload: SeedPagesPayload, args: { locale: AppLocale; slug: string }) {
  const result = await payload.find({
    collection: 'pages',
    depth: 0,
    fallbackLocale: false,
    limit: 1,
    locale: args.locale,
    where: {
      slug: {
        equals: args.slug,
      },
    },
  } as never)

  return result.docs[0] ?? null
}

export async function seedSitePages(payload: SeedPagesPayload) {
  for (const page of starterSitePages) {
    const existingDefaultPage = await findExistingPage(payload, {
      locale: defaultLocale,
      slug: page.slug,
    })
    let pageID = getExistingPageID(existingDefaultPage)

    if (pageID === null) {
      const created = await payload.create({
        collection: 'pages',
        data: buildSeedPageData({
          copy: page.locales[defaultLocale],
          slug: page.slug,
        }),
        draft: false,
        locale: defaultLocale,
      } as never)

      pageID = getExistingPageID(created)
    } else if (!hasRequiredSeedPageLocaleContent(existingDefaultPage)) {
      await payload.update({
        collection: 'pages',
        data: buildSeedPageData({
          copy: page.locales[defaultLocale],
        }),
        draft: false,
        id: pageID,
        locale: defaultLocale,
      } as never)
    }

    if (pageID === null) {
      continue
    }

    for (const locale of localeCodes) {
      if (locale === defaultLocale) {
        continue
      }

      const existingLocalePage = await findExistingPage(payload, {
        locale,
        slug: page.slug,
      })

      if (hasRequiredSeedPageLocaleContent(existingLocalePage)) {
        continue
      }

      await payload.update({
        collection: 'pages',
        data: buildSeedPageData({
          copy: page.locales[locale as AppLocale],
        }),
        draft: false,
        id: pageID,
        locale,
      } as never)
    }
  }
}
