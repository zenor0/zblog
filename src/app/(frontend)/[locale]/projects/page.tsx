import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { MediaSurface } from '@/features/media/ui/MediaSurface'
import { getProjectTimestamp, getPublishedProjects } from '@/features/projects/server/queries'
import { getResolvedSiteSettings } from '@/features/site-settings/model/site-settings'
import { UtilityPageShell } from '@/features/utility-pages/ui/UtilityPage'
import { buildUtilityPageMetadata } from '@/features/utility-pages/server/utility-page-metadata'
import { getUtilityPageCopy } from '@/features/utility-pages/model/utility-pages'
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
    slug: 'projects',
  })
}

export default async function ProjectsPage(props: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await props.params
  const locale = requireLocale(localeParam)
  const copy = getUtilityPageCopy(locale, 'projects')
  const common = await getTranslations({ locale, namespace: 'Common' })
  const projectCopy = await getTranslations({ locale, namespace: 'Project' })
  const projects = await getPublishedProjects(locale)
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
    <UtilityPageShell copy={copy}>
      {projects.length === 0 ? (
        copy.emptyState ? (
          <p className="max-w-2xl text-base leading-8 text-foreground/72">{copy.emptyState}</p>
        ) : null
      ) : (
        <section className="grid gap-6" data-projects-index="">
          {projects.map((project) => {
            const coverImage =
              project.coverImage &&
              typeof project.coverImage === 'object' &&
              typeof project.coverImage.url === 'string'
                ? project.coverImage
                : null

            return (
              <article
                className="grid gap-5 border-b border-border pb-6 md:grid-cols-[minmax(0,1fr)_15rem] md:items-start"
                key={project.id}
              >
                <div className="grid gap-3">
                  <div className="editorial-meta flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>{getProjectStatusLabel(project.status)}</span>
                    {project.timeframe ? (
                      <>
                        <span className="text-border">/</span>
                        <span>{project.timeframe}</span>
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

                  <h2 className="font-serif text-2xl leading-tight sm:text-3xl">
                    <Link
                      className="editorial-link no-underline"
                      href={buildLocalePath(locale, `/projects/${project.slug}`)}
                    >
                      {project.title}
                    </Link>
                  </h2>
                  <p className="max-w-2xl text-sm leading-7 text-foreground/70">
                    {project.summary}
                  </p>

                  {project.tags?.length ? (
                    <div className="editorial-tag-list">
                      {project.tags.map((tag, index) => (
                        <span key={tag.id ?? tag.value}>
                          {index > 0 ? <span className="pr-3 text-border">/</span> : null}
                          {tag.value}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                {coverImage ? (
                  <Link
                    className="block md:order-last"
                    href={buildLocalePath(locale, `/projects/${project.slug}`)}
                  >
                    <MediaSurface
                      alt={coverImage.alt || project.title}
                      loading="lazy"
                      media={coverImage}
                      variant="card"
                    />
                  </Link>
                ) : null}
              </article>
            )
          })}
        </section>
      )}
    </UtilityPageShell>
  )
}
