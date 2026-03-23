import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { LocaleSwitcher } from '@/components/frontend/LocaleSwitcher'
import { MediaSurface } from '@/components/frontend/MediaSurface'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
    <div className="page-frame frontend-shell">
      <header className="flex flex-col gap-5 border-b pb-8 sm:gap-6 sm:pb-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex max-w-3xl flex-col gap-3">
            <p className="section-kicker">{heroEyebrow}</p>
            <h1 className="font-serif text-5xl leading-none tracking-[-0.05em] sm:text-6xl lg:text-7xl">
              {heroTitle}
            </h1>
          </div>

          <LocaleSwitcher
            activeLocale={locale}
            items={buildLocaleLinks('')}
            label={common('localeNavigation')}
          />
        </div>

        <p className="max-w-2xl text-base leading-8 text-foreground/68 sm:text-lg">
          {heroDescription}
        </p>

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>{siteSettings.siteName}</span>
          <Badge variant="secondary">{home('publishedEntries', { count: posts.length })}</Badge>
        </div>
      </header>

      <section className="mt-10 flex flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <p className="section-kicker">{siteSettings.siteName}</p>
            <h2 className="font-serif text-2xl tracking-[-0.03em] sm:text-3xl">
              {home('postsHeading')}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {home('publishedEntries', { count: posts.length })}
          </p>
        </div>

        <Separator />

        {posts.length === 0 ? (
          <p className="py-10 text-sm leading-7 text-muted-foreground">
            {home('noPublishedPosts')}
          </p>
        ) : (
          <div className="flex flex-col">
            {posts.map((post) => {
              const heroImage =
                post.heroImage &&
                typeof post.heroImage === 'object' &&
                typeof post.heroImage.url === 'string'
                  ? post.heroImage
                  : null

              return (
                <article
                  className="grid gap-4 border-b py-6 md:grid-cols-[minmax(0,1fr)_13rem] md:items-start"
                  key={post.id}
                >
                  <div className="flex min-w-0 flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        {formatShortDate({
                          fallback: common('unknownDate'),
                          locale,
                          value: post.publishedAt ?? post.updatedAt,
                        })}
                      </Badge>
                      <Badge
                        variant={post.translationStatus === 'machine' ? 'default' : 'secondary'}
                      >
                        {post.translationStatus === 'machine'
                          ? common('machineStatus')
                          : common('editorialStatus')}
                      </Badge>
                    </div>

                    <div className="flex flex-col gap-2">
                      <h2 className="font-serif text-2xl leading-tight tracking-[-0.03em]">
                        <Link
                          className="transition-colors hover:text-primary"
                          href={buildLocalePath(locale, `/posts/${post.slug}`)}
                        >
                          {post.title}
                        </Link>
                      </h2>
                      <p className="text-sm leading-7 text-muted-foreground">
                        {post.excerpt || home('emptyExcerpt')}
                      </p>
                    </div>

                    {post.tags?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag) => (
                          <Badge key={tag.id ?? tag.value} variant="outline">
                            {tag.value}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  {heroImage ? (
                    <Link
                      className="md:order-last"
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
          </div>
        )}
      </section>
    </div>
  )
}
