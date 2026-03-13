import Link from 'next/link'

import { buildLocaleLinks, formatShortDate, requireLocale } from '@/app/(frontend)/helpers'
import { getPublishedPosts } from '@/lib/posts'

export default async function LocalizedHomePage(props: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await props.params
  const locale = requireLocale(localeParam)
  const posts = await getPublishedPosts(locale)

  return (
    <div className="page-shell">
      <header className="hero">
        <div className="hero-copy">
          <span className="eyebrow">ZBlog CMS</span>
          <h1>A quiet frontend for a multilingual, citation-aware blog.</h1>
          <p>
            Built on Payload. Markdown-first. Citation keys, BibTeX, attachments, machine
            translation notices, and version diffs are surfaced without decorative noise.
          </p>
        </div>
        <nav aria-label="Locales" className="locale-nav">
          {buildLocaleLinks('').map((item) => (
            <Link
              className={item.locale === locale ? 'locale-pill locale-pill--active' : 'locale-pill'}
              href={item.href}
              key={item.locale}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <section className="section">
        <div className="section-heading">
          <h2>Posts</h2>
          <p>{posts.length} published entries</p>
        </div>

        {posts.length === 0 ? (
          <div className="empty-state">
            <p>No published posts yet. Create one in Payload admin and publish it.</p>
          </div>
        ) : (
          <div className="post-grid">
            {posts.map((post) => {
              const heroImage =
                post.heroImage && typeof post.heroImage === 'object' ? post.heroImage : null

              return (
                <article className="post-card" key={post.id}>
                  {heroImage?.url ? (
                    <div className="post-card__image">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img alt={heroImage.alt} src={heroImage.url} />
                    </div>
                  ) : null}
                  <div className="post-card__body">
                    <div className="meta-row">
                      <span>{formatShortDate(post.publishedAt ?? post.updatedAt, locale)}</span>
                      <span>{post.translationStatus === 'machine' ? 'Machine draft' : 'Editorial'}</span>
                    </div>
                    <h3>
                      <Link href={`/${locale}/posts/${post.slug}`}>{post.title}</Link>
                    </h3>
                    <p>{post.excerpt || 'No excerpt provided yet.'}</p>
                    {post.tags?.length ? (
                      <ul className="tag-list">
                        {post.tags.map((tag) => (
                          <li key={tag.id ?? tag.value}>{tag.value}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
