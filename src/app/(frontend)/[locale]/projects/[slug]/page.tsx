import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { MediaSurface } from '@/features/media/ui/MediaSurface'
import {
  getProjectBySlug,
  getProjectTimestamp,
  getRenderableProjectLocales,
} from '@/features/projects/server/queries'
import { getResolvedSiteSettings } from '@/features/site-settings/model/site-settings'
import { formatShortDate } from '@/i18n/format'
import { requireLocale } from '@/i18n/routing'
import { buildLocalePath } from '@/shared/i18n/locales'
import { buildPageMetadata } from '@/shared/content/seo'

function getDetailParagraphs(value: null | string | undefined) {
  if (typeof value !== 'string') {
    return []
  }

  return value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale: localeParam, slug } = await props.params
  const locale = requireLocale(localeParam)
  const requestedSiteSettings = await getResolvedSiteSettings(locale)
  const resolved = await getProjectBySlug({
    locale,
    slug,
  })

  if (!resolved) {
    return {
      robots: {
        follow: false,
        index: false,
      },
      title: requestedSiteSettings.siteName,
    }
  }

  const canonicalLocale = resolved.usedFallback ? resolved.resolvedLocale : locale
  const availableLocales = await getRenderableProjectLocales({ slug })
  const siteSettings = await getResolvedSiteSettings(canonicalLocale)
  const metaImage =
    resolved.project.seo?.metaImage && typeof resolved.project.seo.metaImage === 'object'
      ? resolved.project.seo.metaImage
      : null
  const coverImage =
    resolved.project.coverImage && typeof resolved.project.coverImage === 'object'
      ? resolved.project.coverImage
      : null
  const defaultSocialImage =
    siteSettings.seo?.defaultSocialImage && typeof siteSettings.seo.defaultSocialImage === 'object'
      ? siteSettings.seo.defaultSocialImage
      : null

  return buildPageMetadata({
    canonicalLocale,
    content: resolved.project.details,
    description: resolved.project.seo?.metaDescription || resolved.project.summary,
    fallbackDescription: siteSettings.siteDescription,
    fallbackImage: defaultSocialImage,
    image: metaImage ?? coverImage,
    locales: availableLocales.length ? availableLocales : [canonicalLocale],
    pathname: `/projects/${encodeURIComponent(resolved.project.slug)}`,
    robots: {
      follow: true,
      index: !resolved.usedFallback && !resolved.project.seo?.noindex,
    },
    siteName: siteSettings.siteName,
    title: resolved.project.seo?.metaTitle || resolved.project.title,
  })
}

export default async function ProjectDetailPage(props: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale: localeParam, slug } = await props.params
  const locale = requireLocale(localeParam)
  const common = await getTranslations({ locale, namespace: 'Common' })
  const projectCopy = await getTranslations({ locale, namespace: 'Project' })
  const resolved = await getProjectBySlug({
    locale,
    slug,
  })

  if (!resolved) {
    notFound()
  }

  const project = resolved.project
  const coverImage =
    project.coverImage &&
    typeof project.coverImage === 'object' &&
    typeof project.coverImage.url === 'string'
      ? project.coverImage
      : null
  const details = getDetailParagraphs(project.details)
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

  return (
    <div className="page-frame frontend-shell" data-project-detail="">
      <div className="mb-8 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
        <Link className="editorial-link text-sm" href={buildLocalePath(locale, '/projects')}>
          {projectCopy('backToProjects')}
        </Link>
      </div>

      <article className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_17rem] xl:gap-10">
        <div className="grid min-w-0 gap-8">
          <header className="grid gap-5 border-b border-border pb-10" data-project-frontmatter="">
            <div className="editorial-meta flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>{getProjectStatusLabel(project.status)}</span>
              {project.timeframe ? (
                <>
                  <span className="text-border">/</span>
                  <span>
                    {projectCopy('timelineLabel')} {project.timeframe}
                  </span>
                </>
              ) : null}
              <span className="text-border">/</span>
              <span>
                {projectCopy('updatedLabel')}{' '}
                {formatShortDate({
                  fallback: common('unknownDate'),
                  locale,
                  value: getProjectTimestamp(project),
                })}
              </span>
            </div>

            <div className="grid gap-4">
              <h1 className="max-w-4xl font-serif text-4xl leading-tight sm:text-5xl">
                {project.title}
              </h1>
              <p className="max-w-2xl text-base leading-8 text-foreground/72 sm:text-lg">
                {project.summary}
              </p>
            </div>
          </header>

          {coverImage ? (
            <figure className="grid gap-3 border-b border-border pb-10">
              <MediaSurface
                alt={coverImage.alt || project.title}
                loading="eager"
                media={coverImage}
                variant="hero"
              />
            </figure>
          ) : null}

          <section className="grid max-w-3xl gap-4" data-project-notes="">
            <p className="section-kicker">{projectCopy('detailHeading')}</p>
            <div className="grid gap-4 text-base leading-8 text-foreground/74">
              {details.length > 0 ? (
                details.map((paragraph) => <p key={paragraph}>{paragraph}</p>)
              ) : (
                <p>{projectCopy('emptyDetails')}</p>
              )}
            </div>
          </section>
        </div>

        <aside className="grid gap-8 xl:sticky xl:top-8 xl:self-start">
          {project.tags?.length ? (
            <section className="grid gap-3 border-l border-border pl-5">
              <p className="section-kicker">{common('tags')}</p>
              <div className="editorial-tag-list">
                {project.tags.map((tag, index) => (
                  <span key={tag.id ?? tag.value}>
                    {index > 0 ? <span className="pr-3 text-border">/</span> : null}
                    {tag.value}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {project.links?.length ? (
            <section className="grid gap-3 border-l border-border pl-5" data-project-links="">
              <p className="section-kicker">{projectCopy('linksHeading')}</p>
              <div className="grid gap-3">
                {project.links.map((link) => (
                  <a
                    className="grid gap-1 text-sm leading-6"
                    href={link.url}
                    key={link.id ?? link.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <span className="editorial-link">{link.label}</span>
                    {link.description ? (
                      <span className="text-foreground/62">{link.description}</span>
                    ) : null}
                  </a>
                ))}
              </div>
            </section>
          ) : null}
        </aside>
      </article>
    </div>
  )
}
