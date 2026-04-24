import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { LocaleSwitcher } from '@/components/frontend/LocaleSwitcher'
import { MediaSurface } from '@/components/frontend/MediaSurface'
import { ThemeSwitcher } from '@/components/frontend/ThemeSwitcher'
import { formatShortDate } from '@/i18n/format'
import { buildLocaleLinks, requireLocale } from '@/i18n/routing'
import { buildLocalePath } from '@/lib/locales'
import { getPublishedPosts } from '@/lib/posts'
import {
  buildHomeStructuredData,
  buildPageMetadata,
  buildSeoDescription,
  serializeStructuredData,
} from '@/lib/seo'
import { getSiteSettings } from '@/lib/site-settings'

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: localeParam } = await props.params
  const locale = requireLocale(localeParam)
  const home = await getTranslations({ locale, namespace: 'HomePage' })
  const siteSettings = await getSiteSettings(locale)
  const title = siteSettings.seo?.homeTitle || siteSettings.homeHero?.title || home('heroTitle')
  const description = buildSeoDescription({
    fallback:
      siteSettings.siteDescription || siteSettings.homeHero?.description || home('heroDescription'),
    value: siteSettings.seo?.homeDescription,
  })
  const defaultSocialImage =
    siteSettings.seo?.defaultSocialImage && typeof siteSettings.seo.defaultSocialImage === 'object'
      ? siteSettings.seo.defaultSocialImage
      : null

  return buildPageMetadata({
    canonicalLocale: locale,
    description,
    fallbackDescription:
      siteSettings.siteDescription || siteSettings.homeHero?.description || home('heroDescription'),
    fallbackImage: defaultSocialImage,
    siteName: siteSettings.siteName,
    title,
  })
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
  const featuredPost = posts[0] ?? null
  const remainingPosts = posts.slice(1)
  const defaultSocialImage =
    siteSettings.seo?.defaultSocialImage && typeof siteSettings.seo.defaultSocialImage === 'object'
      ? siteSettings.seo.defaultSocialImage
      : null
  const structuredData = buildHomeStructuredData({
    description: buildSeoDescription({
      fallback: siteSettings.siteDescription || heroDescription,
      value: siteSettings.seo?.homeDescription,
    }),
    image: defaultSocialImage,
    locale,
    siteName: siteSettings.siteName,
  })

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: serializeStructuredData(structuredData),
        }}
        type="application/ld+json"
      />
      <div className="page-frame frontend-shell">
        <header
          className="grid gap-8 border-b border-border pb-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start"
          data-home-hero=""
        >
          <div className="flex max-w-4xl flex-col gap-4">
            <p className="section-kicker">{heroEyebrow}</p>
            <h1 className="max-w-4xl font-serif text-6xl leading-none tracking-[-0.055em] sm:text-7xl lg:text-[5.5rem]">
              {heroTitle}
            </h1>
            <p className="max-w-2xl text-base leading-8 text-foreground/72 sm:text-lg">
              {heroDescription}
            </p>
          </div>

          <div className="flex flex-col gap-5 lg:items-end">
            <div className="flex items-center justify-end gap-2">
              <ThemeSwitcher
                label={common('themeNavigation')}
                labels={{
                  auto: common('themeAuto'),
                  dark: common('themeDark'),
                  light: common('themeLight'),
                }}
              />
              <LocaleSwitcher
                activeLocale={locale}
                items={buildLocaleLinks('')}
                label={common('localeNavigation')}
              />
            </div>

            <div className="flex flex-col gap-1 text-right">
              <p className="editorial-meta">{siteSettings.siteName}</p>
              <p className="text-sm text-muted-foreground">
                {home('publishedEntries', { count: posts.length })}
              </p>
            </div>
          </div>
        </header>

        {posts.length === 0 ? (
          <p className="max-w-2xl py-12 text-base leading-8 text-foreground/68">
            {home('noPublishedPosts')}
          </p>
        ) : (
          <>
            {featuredPost ? (
              <article
                className="grid gap-6 border-b border-border py-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start"
                data-home-featured-post=""
                key={featuredPost.id}
              >
                <div className="flex min-w-0 flex-col gap-5">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                    <span>
                      {formatShortDate({
                        fallback: common('unknownDate'),
                        locale,
                        value: featuredPost.publishedAt ?? featuredPost.updatedAt,
                      })}
                    </span>
                    <span className="text-border">/</span>
                    <span>
                      {featuredPost.translationStatus === 'machine'
                        ? common('machineStatus')
                        : common('editorialStatus')}
                    </span>
                  </div>

                  <div className="flex flex-col gap-3">
                    <h2 className="font-serif text-4xl leading-tight tracking-[-0.04em] sm:text-5xl">
                      <Link
                        className="editorial-link no-underline"
                        href={buildLocalePath(locale, `/posts/${featuredPost.slug}`)}
                      >
                        {featuredPost.title}
                      </Link>
                    </h2>
                    <p className="max-w-2xl text-base leading-8 text-foreground/72">
                      {featuredPost.excerpt || home('emptyExcerpt')}
                    </p>
                  </div>

                  {featuredPost.tags?.length ? (
                    <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      {featuredPost.tags.map((tag, index) => (
                        <span key={tag.id ?? tag.value}>
                          {index > 0 ? <span className="pr-3 text-border">/</span> : null}
                          {tag.value}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                {featuredPost.heroImage &&
                typeof featuredPost.heroImage === 'object' &&
                typeof featuredPost.heroImage.url === 'string' ? (
                  <Link
                    className="block"
                    href={buildLocalePath(locale, `/posts/${featuredPost.slug}`)}
                  >
                    <MediaSurface
                      alt={featuredPost.heroImage.alt || featuredPost.title}
                      loading="eager"
                      media={featuredPost.heroImage}
                      variant="card"
                    />
                  </Link>
                ) : null}
              </article>
            ) : null}

            <section className="flex flex-col gap-4 pt-8" data-home-post-list="">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-col gap-1">
                  <p className="section-kicker">{siteSettings.siteName}</p>
                  <h2 className="font-serif text-3xl tracking-[-0.03em] sm:text-4xl">
                    {home('postsHeading')}
                  </h2>
                </div>
                <p className="editorial-meta">
                  {home('publishedEntries', { count: posts.length })}
                </p>
              </div>

              {remainingPosts.map((post) => {
                const heroImage =
                  post.heroImage &&
                  typeof post.heroImage === 'object' &&
                  typeof post.heroImage.url === 'string'
                    ? post.heroImage
                    : null

                return (
                  <article
                    className="grid gap-5 border-b border-border py-7 md:grid-cols-[minmax(0,1fr)_14rem] md:items-start"
                    key={post.id}
                  >
                    <div className="flex min-w-0 flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                        <span>
                          {formatShortDate({
                            fallback: common('unknownDate'),
                            locale,
                            value: post.publishedAt ?? post.updatedAt,
                          })}
                        </span>
                        <span className="text-border">/</span>
                        <span>
                          {post.translationStatus === 'machine'
                            ? common('machineStatus')
                            : common('editorialStatus')}
                        </span>
                      </div>

                      <div className="flex flex-col gap-2">
                        <h2 className="font-serif text-2xl leading-tight tracking-[-0.03em] sm:text-[2rem]">
                          <Link
                            className="editorial-link no-underline"
                            href={buildLocalePath(locale, `/posts/${post.slug}`)}
                          >
                            {post.title}
                          </Link>
                        </h2>
                        <p className="max-w-2xl text-sm leading-7 text-foreground/70">
                          {post.excerpt || home('emptyExcerpt')}
                        </p>
                      </div>

                      {post.tags?.length ? (
                        <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                          {post.tags.map((tag, index) => (
                            <span key={tag.id ?? tag.value}>
                              {index > 0 ? <span className="pr-3 text-border">/</span> : null}
                              {tag.value}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    {heroImage ? (
                      <Link
                        className="block md:order-last"
                        href={buildLocalePath(locale, `/posts/${post.slug}`)}
                      >
                        <MediaSurface
                          alt={heroImage.alt || post.title}
                          loading="lazy"
                          media={heroImage}
                          variant="card"
                        />
                      </Link>
                    ) : null}
                  </article>
                )
              })}
            </section>
          </>
        )}
      </div>
    </>
  )
}
