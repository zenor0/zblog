import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { formatLongDate } from '@/i18n/format'
import { requireLocale } from '@/i18n/routing'
import { buildLocalePath } from '@/lib/locales'
import { getPostBySlug, getPostVersionDiffs } from '@/lib/posts'
import { getSiteSettings } from '@/lib/site-settings'

export async function generateMetadata(props: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale: localeParam } = await props.params
  const locale = requireLocale(localeParam)
  const history = await getTranslations({ locale, namespace: 'HistoryPage' })
  const siteSettings = await getSiteSettings(locale)

  return {
    robots: {
      follow: true,
      index: false,
    },
    title: `${history('title')} | ${siteSettings.siteName}`,
  }
}

export default async function PostHistoryPage(props: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale: localeParam, slug } = await props.params
  const locale = requireLocale(localeParam)
  const article = await getTranslations({ locale, namespace: 'Article' })
  const common = await getTranslations({ locale, namespace: 'Common' })
  const history = await getTranslations({ locale, namespace: 'HistoryPage' })
  const post = await getPostBySlug({ locale, slug })

  if (!post) {
    notFound()
  }

  const versionDiffs = await getPostVersionDiffs({
    locale: post.resolvedLocale,
    postID: post.post.id,
  })

  return (
    <div className="page-shell">
      <div className="page-topbar">
        <Link className="back-link" href={buildLocalePath(locale, `/posts/${slug}`)}>
          {article('backToArticle')}
        </Link>
      </div>

      <section className="section">
        <div className="section-heading">
          <h1>{history('title')}</h1>
          <p>{history('versionHistorySummary', { count: versionDiffs.length, title: post.post.title })}</p>
        </div>

        {versionDiffs.length === 0 ? (
          <div className="empty-state">
            <p>{history('noVersions')}</p>
          </div>
        ) : (
          <div className="version-stack">
            {versionDiffs.map((entry) => (
              <article className="version-card" key={entry.version.id}>
                <header className="version-card__header">
                  <div>
                    <h2>
                      {formatLongDate({
                        fallback: common('unscheduled'),
                        locale: post.resolvedLocale,
                        value: entry.version.updatedAt,
                      })}
                    </h2>
                    <p>
                      {common('versionID')} {entry.version.id}
                      {entry.version.latest ? ` · ${common('latestSnapshot')}` : ''}
                    </p>
                  </div>
                  <span className="version-chip">
                    {entry.version.version._status === 'published'
                      ? common('publishedLabel')
                      : common('draftLabel')}
                  </span>
                </header>

                <div className="diff-stack">
                  {entry.diffs
                    .filter((diff) => diff.lines.some((line) => line.type !== 'unchanged'))
                    .map((diff) => (
                      <section className="diff-block" key={`${entry.version.id}-${diff.field}`}>
                        <h3>{diff.field}</h3>
                        <pre className="diff-pre">
                          {diff.lines.map((line, index) => (
                            <span
                              className={`diff-line diff-line--${line.type}`}
                              key={`${diff.field}-${index}`}
                            >
                              {line.type === 'added'
                                ? '+ '
                                : line.type === 'removed'
                                  ? '- '
                                  : '  '}
                              {line.value}
                            </span>
                          ))}
                        </pre>
                      </section>
                    ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
