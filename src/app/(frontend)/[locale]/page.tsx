import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { LocaleSwitcher } from '@/shared/ui/LocaleSwitcher'
import { MediaSurface } from '@/features/media/ui/MediaSurface'
import { ThemeSwitcher } from '@/shared/ui/ThemeSwitcher'
import { getPublishedPosts } from '@/features/posts/server/queries'
import { getHomepageProjects } from '@/features/projects/server/queries'
import { getResolvedSiteSettings } from '@/features/site-settings/model/site-settings'
import { formatShortDate } from '@/i18n/format'
import { buildLocaleLinks, requireLocale } from '@/i18n/routing'
import { buildLocalePath } from '@/shared/i18n/locales'
import {
  buildHomeStructuredData,
  buildPageMetadata,
  buildSeoDescription,
  serializeStructuredData,
} from '@/shared/content/seo'

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: localeParam } = await props.params
  const locale = requireLocale(localeParam)
  const home = await getTranslations({ locale, namespace: 'HomePage' })
  const siteSettings = await getResolvedSiteSettings(locale)
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
  const projectCopy = await getTranslations({ locale, namespace: 'Project' })
  const siteSettings = await getResolvedSiteSettings(locale)
  const posts = await getPublishedPosts(locale)
  const projects = await getHomepageProjects(locale)
  const heroEyebrow = siteSettings.homeHero?.eyebrow || siteSettings.siteName || common('siteLabel')
  const heroTitle = siteSettings.homeHero?.title || home('heroTitle')
  const heroDescription = siteSettings.homeHero?.description || home('heroDescription')
  const featuredPost = posts[0] ?? null
  const remainingPosts = posts.slice(1)
  const featuredProject = projects[0] ?? null
  const supportingProjects = projects.slice(1)
  const homeNavItems = [
    {
      href: buildLocalePath(locale, '/posts'),
      label: home('navPosts'),
    },
    {
      href: buildLocalePath(locale, '/projects'),
      label: home('navProjects'),
    },
    {
      href: buildLocalePath(locale, '/about'),
      label: home('navAbout'),
    },
  ]
  const getProjectStatusLabel = (status: unknown) => {
    switch (status) {
      case 'archived':
        return projectCopy('statusArchived')
      case 'paused':
        return projectCopy('statusPaused')
      case 'shipped':
        return projectCopy('statusShipped')
      default:
        return projectCopy('statusActive')
    }
  }
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
            <h1 className="max-w-4xl font-serif text-4xl leading-tight sm:text-5xl lg:text-6xl">
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

            <nav aria-label={home('navLabel')} className="home-nav-tabs" data-home-nav="">
              {homeNavItems.map((item) => (
                <Link className="home-nav-tabs__link" href={item.href} key={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>

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
        ) : null}

        {featuredPost ? (
          <article
            className="grid gap-6 border-b border-border py-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start"
            data-home-featured-post=""
            key={featuredPost.id}
          >
            <div className="flex min-w-0 flex-col gap-5">
              <div className="editorial-meta flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>
                  {formatShortDate({
                    fallback: common('unknownDate'),
                    locale,
                    value: featuredPost.publishedAt ?? featuredPost.updatedAt,
                  })}
                </span>
              </div>

              <div className="flex flex-col gap-3">
                <h2 className="font-serif text-3xl leading-tight sm:text-4xl">
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
                <div className="editorial-tag-list">
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
              <Link className="block" href={buildLocalePath(locale, `/posts/${featuredPost.slug}`)}>
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

        <section className="grid gap-7 border-b border-border py-10" data-home-projects="">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex max-w-2xl flex-col gap-2">
              <p className="section-kicker">{home('navProjects')}</p>
              <h2 className="font-serif text-2xl sm:text-3xl">{home('projectsHeading')}</h2>
              <p className="text-sm leading-7 text-foreground/68">{home('projectsDescription')}</p>
            </div>
            <Link
              className="editorial-link text-sm text-foreground/82"
              href={buildLocalePath(locale, '/projects')}
            >
              {home('navProjects')}
            </Link>
          </div>

          {featuredProject ? (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(16rem,0.85fr)]">
              <article className="grid gap-5 border-l border-border pl-5" data-home-project-lead="">
                <div className="editorial-meta flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>{getProjectStatusLabel(featuredProject.status)}</span>
                  {featuredProject.timeframe ? (
                    <>
                      <span className="text-border">/</span>
                      <span>{featuredProject.timeframe}</span>
                    </>
                  ) : null}
                  {featuredProject.featured ? (
                    <>
                      <span className="text-border">/</span>
                      <span>{projectCopy('featuredLabel')}</span>
                    </>
                  ) : null}
                </div>

                <div className="grid gap-3">
                  <h3 className="font-serif text-3xl leading-tight">
                    <Link
                      className="editorial-link no-underline"
                      href={buildLocalePath(locale, `/projects/${featuredProject.slug}`)}
                    >
                      {featuredProject.title}
                    </Link>
                  </h3>
                  <p className="max-w-2xl text-base leading-8 text-foreground/72">
                    {featuredProject.summary}
                  </p>
                </div>

                {featuredProject.tags?.length ? (
                  <div className="editorial-tag-list">
                    {featuredProject.tags.map((tag, index) => (
                      <span key={tag.id ?? tag.value}>
                        {index > 0 ? <span className="pr-3 text-border">/</span> : null}
                        {tag.value}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>

              <div className="grid gap-4">
                {featuredProject.coverImage &&
                typeof featuredProject.coverImage === 'object' &&
                typeof featuredProject.coverImage.url === 'string' ? (
                  <Link href={buildLocalePath(locale, `/projects/${featuredProject.slug}`)}>
                    <MediaSurface
                      alt={featuredProject.coverImage.alt || featuredProject.title}
                      loading="lazy"
                      media={featuredProject.coverImage}
                      variant="card"
                    />
                  </Link>
                ) : null}

                {supportingProjects.map((project) => (
                  <article className="grid gap-2 border-t border-border pt-4" key={project.id}>
                    <div className="editorial-meta flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>{getProjectStatusLabel(project.status)}</span>
                      {project.timeframe ? (
                        <>
                          <span className="text-border">/</span>
                          <span>{project.timeframe}</span>
                        </>
                      ) : null}
                    </div>
                    <h3 className="font-serif text-xl leading-tight">
                      <Link
                        className="editorial-link no-underline"
                        href={buildLocalePath(locale, `/projects/${project.slug}`)}
                      >
                        {project.title}
                      </Link>
                    </h3>
                    <p className="text-sm leading-7 text-foreground/68">{project.summary}</p>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <p className="max-w-2xl text-base leading-8 text-foreground/68">
              {home('projectsEmpty')}
            </p>
          )}
        </section>

        {posts.length > 0 ? (
          <section className="flex flex-col gap-4 pt-8" data-home-post-list="">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-1">
                <p className="section-kicker">{siteSettings.siteName}</p>
                <h2 className="font-serif text-2xl sm:text-3xl">{home('postsHeading')}</h2>
              </div>
              <p className="editorial-meta">{home('publishedEntries', { count: posts.length })}</p>
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
                    <div className="editorial-meta flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>
                        {formatShortDate({
                          fallback: common('unknownDate'),
                          locale,
                          value: post.publishedAt ?? post.updatedAt,
                        })}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <h2 className="font-serif text-xl leading-tight sm:text-2xl">
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
                      <div className="editorial-tag-list">
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
        ) : null}
      </div>
    </>
  )
}
