import type { TypeWithVersion } from 'payload'

import { isEditor } from '@/lib/access'
import { getBibliographySource, loadBibliographyEntries, getReferencedEntries } from '@/lib/bibliography'
import { buildCitationIndex } from '@/lib/citations'
import { buildVersionDiff } from '@/lib/diff'
import { defaultLocale, localeCodes, type AppLocale } from '@/lib/locales'
import { getPayloadClient } from '@/lib/payload'
import type { Post, User } from '@/payload-types'

export type ResolvedPost = {
  bibliographyEntries: Awaited<ReturnType<typeof loadBibliographyEntries>>
  citationIndex: Map<string, number>
  missingCitationKeys: string[]
  post: Post
  requestedLocale: AppLocale
  resolvedLocale: AppLocale
  sourcePost: Post | null
  usedDraftAccess: boolean
  usedFallback: boolean
}

export type PostVersionRecord = TypeWithVersion<Post>

function isRenderablePost(post: null | Post, allowUntitled: boolean) {
  if (!post || typeof post.content !== 'string' || post.content.trim().length === 0) {
    return false
  }

  if (allowUntitled) {
    return true
  }

  return typeof post.title === 'string' && post.title.trim().length > 0
}

export function isPostIndexable(post: null | Post) {
  return !post?.seo?.noindex
}

export async function getPublishedPosts(locale: AppLocale): Promise<Post[]> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'posts',
    depth: 1,
    fallbackLocale: defaultLocale,
    limit: 100,
    locale,
    overrideAccess: false,
    sort: '-publishedAt',
    where: {
      _status: {
        equals: 'published',
      },
    },
  })

  return result.docs
}

export async function getPostBySlug(args: {
  draft?: boolean
  locale: AppLocale
  slug: string
  user?: null | User
}): Promise<ResolvedPost | null> {
  const { locale, slug } = args
  const payload = await getPayloadClient()
  const usedDraftAccess = Boolean(args.draft && isEditor(args.user))
  const accessArgs = usedDraftAccess
    ? {
        user: args.user,
      }
    : {}
  const where = {
    ...(usedDraftAccess
      ? {}
      : {
          _status: {
            equals: 'published' as const,
          },
        }),
    slug: {
      equals: slug,
    },
  }

  const localizedResult = await payload.find({
    collection: 'posts',
    depth: 1,
    draft: usedDraftAccess,
    fallbackLocale: false,
    limit: 1,
    locale,
    overrideAccess: false,
    ...accessArgs,
    where,
  })

  const sourcePost = localizedResult.docs[0] ?? null

  let post = sourcePost
  let resolvedLocale = locale
  let usedFallback = false

  if (!isRenderablePost(post, usedDraftAccess)) {
    const fallbackResult = await payload.find({
      collection: 'posts',
      depth: 1,
      draft: usedDraftAccess,
      fallbackLocale: false,
      limit: 1,
      locale: defaultLocale,
      overrideAccess: false,
      ...accessArgs,
      where,
    })

    post = fallbackResult.docs[0] ?? null
    resolvedLocale = defaultLocale
    usedFallback = locale !== defaultLocale
  }

  if (!isRenderablePost(post, usedDraftAccess)) {
    return null
  }

  const bibliographyEntries = await loadBibliographyEntries(
    getBibliographySource(
      (post as Post & { bibliography?: Record<string, unknown> | null }).bibliography ?? null,
    ),
  )
  const { entries, missingKeys } = getReferencedEntries(post.content, bibliographyEntries)

  return {
    bibliographyEntries: entries,
    citationIndex: buildCitationIndex(post.content),
    missingCitationKeys: missingKeys,
    post,
    requestedLocale: locale,
    resolvedLocale,
    sourcePost,
    usedDraftAccess,
    usedFallback,
  }
}

export async function getPostByID(args: {
  draft?: boolean
  id: number
  locale: AppLocale
  user?: null | User
}): Promise<ResolvedPost | null> {
  const { id, locale } = args
  const payload = await getPayloadClient()
  const usedDraftAccess = Boolean(args.draft && isEditor(args.user))
  const accessArgs = usedDraftAccess
    ? {
        user: args.user,
      }
    : {}
  const where = {
    id: {
      equals: id,
    },
  }

  const localizedResult = await payload.find({
    collection: 'posts',
    depth: 1,
    draft: usedDraftAccess,
    fallbackLocale: false,
    limit: 1,
    locale,
    overrideAccess: false,
    ...accessArgs,
    where,
  })
  const sourcePost = localizedResult.docs[0] ?? null

  let post = sourcePost
  let resolvedLocale = locale
  let usedFallback = false

  if (!isRenderablePost(post, usedDraftAccess) && locale !== defaultLocale) {
    const fallbackResult = await payload.find({
      collection: 'posts',
      depth: 1,
      draft: usedDraftAccess,
      fallbackLocale: false,
      limit: 1,
      locale: defaultLocale,
      overrideAccess: false,
      ...accessArgs,
      where,
    })
    post = fallbackResult.docs[0] ?? null
    resolvedLocale = defaultLocale
    usedFallback = true
  }

  if (!isRenderablePost(post, usedDraftAccess)) {
    return null
  }

  const bibliographyEntries = await loadBibliographyEntries(
    getBibliographySource(
      (post as Post & { bibliography?: Record<string, unknown> | null }).bibliography ?? null,
    ),
  )
  const { entries, missingKeys } = getReferencedEntries(post.content, bibliographyEntries)

  return {
    bibliographyEntries: entries,
    citationIndex: buildCitationIndex(post.content),
    missingCitationKeys: missingKeys,
    post,
    requestedLocale: locale,
    resolvedLocale,
    sourcePost,
    usedDraftAccess,
    usedFallback,
  }
}

export async function getPostVersions(args: {
  locale: AppLocale
  postID: number
}): Promise<PostVersionRecord[]> {
  const payload = await getPayloadClient()
  const versions = await payload.findVersions({
    collection: 'posts',
    fallbackLocale: false,
    limit: 20,
    locale: args.locale,
    overrideAccess: false,
    sort: '-updatedAt',
    where: {
      parent: {
        equals: args.postID,
      },
    },
  })

  return versions.docs as PostVersionRecord[]
}

export async function getPostVersionDiffs(args: {
  locale: AppLocale
  postID: number
}) {
  const versions = await getPostVersions(args)

  return versions.map((version, index) => {
    const previous = versions[index + 1]

    return {
      diffs: [
        buildVersionDiff('Title', previous?.version.title ?? '', version.version.title ?? ''),
        buildVersionDiff('Excerpt', previous?.version.excerpt ?? '', version.version.excerpt ?? ''),
        buildVersionDiff('Content', previous?.version.content ?? '', version.version.content ?? ''),
      ],
      previous,
      version,
    }
  })
}

export async function getRenderablePostLocales(args: {
  draft?: boolean
  slug: string
  user?: null | User
}): Promise<AppLocale[]> {
  const payload = await getPayloadClient()
  const usedDraftAccess = Boolean(args.draft && isEditor(args.user))
  const accessArgs = usedDraftAccess
    ? {
        user: args.user,
      }
    : {}
  const where = {
    ...(usedDraftAccess
      ? {}
      : {
          _status: {
            equals: 'published' as const,
          },
        }),
    slug: {
      equals: args.slug,
    },
  }

  const locales = await Promise.all(
    localeCodes.map(async (locale) => {
      const result = await payload.find({
        collection: 'posts',
        depth: 0,
        draft: usedDraftAccess,
        fallbackLocale: false,
        limit: 1,
        locale,
        overrideAccess: false,
        ...accessArgs,
        where,
      })
      const post = result.docs[0] ?? null

      return isRenderablePost(post, usedDraftAccess) && (usedDraftAccess || isPostIndexable(post)) ? locale : null
    }),
  )

  return locales.filter((locale): locale is AppLocale => Boolean(locale))
}
