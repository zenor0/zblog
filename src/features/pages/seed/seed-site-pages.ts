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

async function findExistingPageID(payload: SeedPagesPayload, slug: string) {
  const result = await payload.find({
    collection: 'pages',
    depth: 0,
    fallbackLocale: false,
    limit: 1,
    locale: defaultLocale,
    where: {
      slug: {
        equals: slug,
      },
    },
  } as never)

  const id = result.docs[0]?.id

  return typeof id === 'number' || typeof id === 'string' ? id : null
}

export async function seedSitePages(payload: SeedPagesPayload) {
  for (const page of starterSitePages) {
    const existingID = await findExistingPageID(payload, page.slug)

    if (existingID !== null) {
      continue
    }

    const created = await payload.create({
      collection: 'pages',
      data: buildSeedPageData({
        copy: page.locales[defaultLocale],
        slug: page.slug,
      }),
      draft: false,
      locale: defaultLocale,
    } as never)
    const createdID = (created as { id?: number | string }).id

    if (typeof createdID !== 'number' && typeof createdID !== 'string') {
      continue
    }

    for (const locale of localeCodes) {
      if (locale === defaultLocale) {
        continue
      }

      await payload.update({
        collection: 'pages',
        data: buildSeedPageData({
          copy: page.locales[locale as AppLocale],
        }),
        draft: false,
        id: createdID,
        locale,
      } as never)
    }
  }
}
