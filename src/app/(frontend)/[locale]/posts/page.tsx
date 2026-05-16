import type { Metadata } from 'next'
import Link from 'next/link'

import { getResolvedSiteSettings } from '@/features/site-settings/model/site-settings'
import { getPublishedPosts, isPostIndexable } from '@/features/posts/server/queries'
import { UtilityPageShell } from '@/features/utility-pages/ui/UtilityPage'
import { buildUtilityPageMetadata } from '@/features/utility-pages/server/utility-page-metadata'
import { getPostTimestamp, getUtilityPageCopy } from '@/features/utility-pages/model/utility-pages'
import { formatShortDate } from '@/i18n/format'
import { requireLocale } from '@/i18n/routing'
import { buildLocalePath } from '@/shared/i18n/locales'

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: localeParam } = await props.params
  const locale = requireLocale(localeParam)
  const settings = await getResolvedSiteSettings(locale)

  return buildUtilityPageMetadata({
    locale,
    settings,
    slug: 'posts',
  })
}

export default async function PostsIndexPage(props: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await props.params
  const locale = requireLocale(localeParam)
  const copy = getUtilityPageCopy(locale, 'posts')
  const posts = (await getPublishedPosts(locale)).filter(
    (post) => post.slug && post.title && isPostIndexable(post),
  )

  return (
    <UtilityPageShell copy={copy}>
      {posts.length === 0 ? (
        <p className="max-w-2xl text-base leading-8 text-foreground/72">{copy.emptyState}</p>
      ) : (
        <section className="grid gap-5" data-posts-index="">
          {posts.map((post) => (
            <article className="grid gap-2 border-b border-border pb-5" key={post.id}>
              <p className="editorial-meta">
                {copy.updatedLabel}{' '}
                {formatShortDate({
                  fallback: '',
                  locale,
                  value: getPostTimestamp(post),
                })}
              </p>
              <h2 className="font-serif text-2xl leading-tight">
                <Link
                  className="editorial-link no-underline"
                  href={buildLocalePath(locale, `/posts/${post.slug}`)}
                >
                  {post.title}
                </Link>
              </h2>
              {post.excerpt ? (
                <p className="max-w-2xl text-sm leading-7 text-foreground/70">{post.excerpt}</p>
              ) : null}
            </article>
          ))}
        </section>
      )}
    </UtilityPageShell>
  )
}
