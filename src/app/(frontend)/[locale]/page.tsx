import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { MediaSurface } from '@/components/frontend/MediaSurface'
import { formatShortDate } from '@/i18n/format'
import { buildLocaleLinks, requireLocale } from '@/i18n/routing'
import { buildLocalePath } from '@/lib/locales'
import { getPublishedPosts } from '@/lib/posts'
import { buildLocaleAlternates } from '@/lib/seo'
import { getSiteSettings } from '@/lib/site-settings'

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: localeParam } = await props.params
  const locale = requireLocale(localeParam)
  const home = await getTranslations({ locale, namespace: 'HomePage' })
  const siteSettings = await getSiteSettings(locale)
  const title = siteSettings.homeHero?.title || home('heroTitle')
  const description = siteSettings.homeHero?.description || home('heroDescription')

  return {
    alternates: buildLocaleAlternates({
      canonicalLocale: locale,
    }),
    description,
    title: `${title} | ${siteSettings.siteName}`,
  }
}

export default async function LocalizedHomePage(props: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await props.params
  const locale = requireLocale(localeParam)
  const common = await getTranslations({ locale, namespace: 'Common' })
  const home = await getTranslations({ locale, namespace: 'HomePage' })
  const siteSettings = await getSiteSettings(locale)
  const posts = await getPublishedPosts(locale)
  const heroEyebrow = siteSettings.homeHero?.eyebrow || siteSettings.siteName || common('siteLabel')
  const heroTitle = siteSettings.homeHero?.title || home('heroTitle')
  const heroDescription = siteSettings.homeHero?.description || home('heroDescription')

  return (
    <div className="page-shell">
      <header className="hero">
        <div className="hero-copy">
          <span className="eyebrow">{heroEyebrow}</span>
          <h1>{heroTitle}</h1>
          <p>{heroDescription}</p>
        </div>
        <nav aria-label={common('localeNavigation')} className="locale-nav">
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
          <h2>{home('postsHeading')}</h2>
          <p>{home('publishedEntries', { count: posts.length })}</p>
        </div>

        {posts.length === 0 ? (
          <div className="empty-state">
            <p>{home('noPublishedPosts')}</p>
          </div>
        ) : (
          <div className="post-grid">
            {posts.map((post) => {
              const heroImage =
                post.heroImage && typeof post.heroImage === 'object' && typeof post.heroImage.url === 'string'
                  ? post.heroImage
                  : null
              const hasHeroImage = Boolean(heroImage)

              return (
                <article
                  className={hasHeroImage ? 'post-card post-card--with-image' : 'post-card post-card--text-only'}
                  key={post.id}
                >
                  {hasHeroImage ? (
                    <div className="post-card__image">
                      <MediaSurface alt={heroImage?.alt || post.title} loading="lazy" media={heroImage} variant="card" />
                    </div>
                  ) : null}
                  <div className="post-card__body">
                    <div className="post-card__text">
                      <div className="meta-row">
                        <span className="meta-pill">
                          {formatShortDate({
                            fallback: common('unknownDate'),
                            locale,
                            value: post.publishedAt ?? post.updatedAt,
                          })}
                        </span>
                        <span
                          className={
                            post.translationStatus === 'machine'
                              ? 'meta-pill meta-pill--accent'
                              : 'meta-pill'
                          }
                        >
                          {post.translationStatus === 'machine'
                            ? common('machineStatus')
                            : common('editorialStatus')}
                        </span>
                      </div>
                      <h3>
                        <Link href={buildLocalePath(locale, `/posts/${post.slug}`)}>{post.title}</Link>
                      </h3>
                      <p>{post.excerpt || home('emptyExcerpt')}</p>
                    </div>
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
