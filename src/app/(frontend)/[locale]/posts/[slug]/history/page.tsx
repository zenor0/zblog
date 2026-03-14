import Link from 'next/link'
import { notFound } from 'next/navigation'

import { formatLongDate, getFrontendCopy, requireLocale } from '@/app/(frontend)/helpers'
import { getPostBySlug, getPostVersionDiffs } from '@/lib/posts'

export default async function PostHistoryPage(props: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale: localeParam, slug } = await props.params
  const locale = requireLocale(localeParam)
  const copy = getFrontendCopy(locale)
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
        <Link className="back-link" href={`/${locale}/posts/${slug}`}>
          {copy.backToArticle}
        </Link>
      </div>

      <section className="section">
        <div className="section-heading">
          <h1>{copy.versionHistoryTitle}</h1>
          <p>{copy.versionHistorySummary(post.post.title, versionDiffs.length)}</p>
        </div>

        {versionDiffs.length === 0 ? (
          <div className="empty-state">
            <p>{copy.noVersions}</p>
          </div>
        ) : (
          <div className="version-stack">
            {versionDiffs.map((entry) => (
              <article className="version-card" key={entry.version.id}>
                <header className="version-card__header">
                  <div>
                    <h2>{formatLongDate(entry.version.updatedAt, post.resolvedLocale)}</h2>
                    <p>
                      {copy.versionID} {entry.version.id}
                      {entry.version.latest ? ` · ${copy.latestSnapshot}` : ''}
                    </p>
                  </div>
                  <span className="version-chip">
                    {entry.version.version._status === 'published'
                      ? copy.publishedLabel
                      : copy.draftLabel}
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
