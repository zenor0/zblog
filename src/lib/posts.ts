import type { TypeWithVersion } from 'payload'

import type { BibliographyFile, Post } from '@/payload-types'
import { loadBibliographyEntries, getReferencedEntries } from '@/lib/bibliography'
import { buildCitationIndex } from '@/lib/citations'
import { buildVersionDiff } from '@/lib/diff'
import { defaultLocale, type AppLocale } from '@/lib/locales'
import { getPayloadClient } from '@/lib/payload'

export type ResolvedPost = {
  bibliographyEntries: Awaited<ReturnType<typeof loadBibliographyEntries>>
  citationIndex: Map<string, number>
  missingCitationKeys: string[]
  post: Post
  requestedLocale: AppLocale
  resolvedLocale: AppLocale
  sourcePost: Post | null
  usedFallback: boolean
}

export type PostVersionRecord = TypeWithVersion<Post>

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
  locale: AppLocale
  slug: string
}): Promise<ResolvedPost | null> {
  const { locale, slug } = args
  const payload = await getPayloadClient()

  const localizedResult = await payload.find({
    collection: 'posts',
    depth: 1,
    fallbackLocale: false,
    limit: 1,
    locale,
    overrideAccess: false,
    where: {
      _status: {
        equals: 'published',
      },
      slug: {
        equals: slug,
      },
    },
  })

  const sourcePost = localizedResult.docs[0] ?? null

  let post = sourcePost
  let resolvedLocale = locale
  let usedFallback = false

  if (!post?.title || !post?.content) {
    const fallbackResult = await payload.find({
      collection: 'posts',
      depth: 1,
      fallbackLocale: false,
      limit: 1,
      locale: defaultLocale,
      overrideAccess: false,
      where: {
        _status: {
          equals: 'published',
        },
        slug: {
          equals: slug,
        },
      },
    })

    post = fallbackResult.docs[0] ?? null
    resolvedLocale = defaultLocale
    usedFallback = locale !== defaultLocale
  }

  if (!post?.title || !post?.content) {
    return null
  }

  const bibliographyFile =
    post.bibliographyFile && typeof post.bibliographyFile === 'object'
      ? (post.bibliographyFile as BibliographyFile)
      : null
  const bibliographyEntries = await loadBibliographyEntries(bibliographyFile)
  const { entries, missingKeys } = getReferencedEntries(post.content, bibliographyEntries)

  return {
    bibliographyEntries: entries,
    citationIndex: buildCitationIndex(post.content),
    missingCitationKeys: missingKeys,
    post,
    requestedLocale: locale,
    resolvedLocale,
    sourcePost,
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
