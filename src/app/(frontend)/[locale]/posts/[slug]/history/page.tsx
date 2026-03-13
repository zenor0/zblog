import Link from 'next/link'
import { notFound } from 'next/navigation'

import { formatLongDate, requireLocale } from '@/app/(frontend)/helpers'
import { getPostBySlug, getPostVersionDiffs } from '@/lib/posts'

export default async function PostHistoryPage(props: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale: localeParam, slug } = await props.params
  const locale = requireLocale(localeParam)
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
          Back to article
        </Link>
      </div>

      <section className="section">
        <div className="section-heading">
          <h1>Version history</h1>
          <p>
            {post.post.title} · {versionDiffs.length} recorded versions
          </p>
        </div>

        {versionDiffs.length === 0 ? (
          <div className="empty-state">
            <p>No version snapshots are available yet.</p>
          </div>
        ) : (
          <div className="version-stack">
            {versionDiffs.map((entry) => (
              <article className="version-card" key={entry.version.id}>
                <header className="version-card__header">
                  <div>
                    <h2>{formatLongDate(entry.version.updatedAt, post.resolvedLocale)}</h2>
                    <p>
                      Version ID {entry.version.id}
                      {entry.version.latest ? ' · Latest snapshot' : ''}
                    </p>
                  </div>
                  <span className="version-chip">
                    {entry.version.version._status === 'published' ? 'Published' : 'Draft'}
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
