import type { Metadata } from 'next'
import Link from 'next/link'

import { getResolvedSiteSettings } from '@/features/site-settings/model/site-settings'
import { getPublishedPosts, isPostIndexable } from '@/features/posts/server/queries'
import { UtilityPageShell } from '@/features/utility-pages/ui/UtilityPage'
import { buildUtilityPageMetadata } from '@/features/utility-pages/server/utility-page-metadata'
import {
  getPostTimestamp,
  getUtilityPageCopy,
  groupPostsByYear,
} from '@/features/utility-pages/model/utility-pages'
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
    slug: 'archive',
  })
}

export default async function ArchivePage(props: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await props.params
  const locale = requireLocale(localeParam)
  const copy = getUtilityPageCopy(locale, 'archive')
  const posts = (await getPublishedPosts(locale)).filter(
    (post) => post.slug && post.title && isPostIndexable(post),
  )
  const groups = groupPostsByYear(posts)

  return (
    <UtilityPageShell copy={copy}>
      {groups.length === 0 ? (
        <p className="max-w-2xl text-base leading-8 text-foreground/72">{copy.emptyState}</p>
      ) : (
        <div className="grid gap-8" data-post-archive="">
          {groups.map((group) => (
            <section className="grid gap-4" key={group.year}>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="font-serif text-3xl leading-tight">{group.year}</h2>
                <p className="editorial-meta">
                  {group.posts.length} {copy.archiveCountLabel}
                </p>
              </div>
              <div className="grid gap-3">
                {group.posts.map((post) => (
                  <article
                    className="grid gap-1 border-b border-border pb-3 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-4"
                    key={post.id}
                  >
                    <p className="editorial-meta">
                      {formatShortDate({
                        fallback: '',
                        locale,
                        value: getPostTimestamp(post),
                      })}
                    </p>
                    <h3 className="text-base leading-7">
                      <Link
                        className="editorial-link no-underline"
                        href={buildLocalePath(locale, `/posts/${post.slug}`)}
                      >
                        {post.title}
                      </Link>
                    </h3>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </UtilityPageShell>
  )
}
