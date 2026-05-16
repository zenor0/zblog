import type { Project } from '@/payload-types'

import { defaultLocale, localeCodes, type AppLocale } from '@/shared/i18n/locales'
import { getPayloadClient } from '@/shared/payload/client'

export type ResolvedProject = {
  project: Project
  requestedLocale: AppLocale
  resolvedLocale: AppLocale
  sourceProject: Project | null
  usedFallback: boolean
}

function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function compareProjectTimestamps(left: Project, right: Project) {
  const leftTime = Date.parse(getProjectTimestamp(left) ?? '')
  const rightTime = Date.parse(getProjectTimestamp(right) ?? '')

  if (Number.isNaN(leftTime) && Number.isNaN(rightTime)) {
    return 0
  }

  if (Number.isNaN(leftTime)) {
    return 1
  }

  if (Number.isNaN(rightTime)) {
    return -1
  }

  return rightTime - leftTime
}

function isRenderableProject(project: null | Project): project is Project {
  return Boolean(
    project &&
    hasText(project.slug) &&
    hasText(project.title) &&
    hasText(project.summary) &&
    isProjectIndexable(project),
  )
}

export function isProjectIndexable(project: null | Project): project is Project {
  return Boolean(project && !project.seo?.noindex)
}

export function getProjectTimestamp(project: Project) {
  return project.publishedAt ?? project.updatedAt ?? project.createdAt ?? null
}

export function sortProjectsForDisplay(projects: Project[]) {
  return [...projects].sort((left, right) => {
    if (Boolean(left.featured) !== Boolean(right.featured)) {
      return left.featured ? -1 : 1
    }

    const leftOrder = typeof left.sortOrder === 'number' ? left.sortOrder : 0
    const rightOrder = typeof right.sortOrder === 'number' ? right.sortOrder : 0

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder
    }

    return compareProjectTimestamps(left, right)
  })
}

export async function getPublishedProjects(locale: AppLocale, limit = 100): Promise<Project[]> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'projects',
    depth: 1,
    fallbackLocale: defaultLocale,
    limit,
    locale,
    overrideAccess: false,
    sort: 'sortOrder',
    where: {
      _status: {
        equals: 'published',
      },
    },
  })

  return sortProjectsForDisplay(result.docs.filter(isRenderableProject))
}

export async function getHomepageProjects(locale: AppLocale, limit = 3): Promise<Project[]> {
  const projects = await getPublishedProjects(locale, 100)
  const featuredProjects = projects.filter((project) => project.featured)
  const sourceProjects = featuredProjects.length > 0 ? featuredProjects : projects

  return sourceProjects.slice(0, limit)
}

export async function getProjectBySlug(args: {
  locale: AppLocale
  slug: string
}): Promise<ResolvedProject | null> {
  const payload = await getPayloadClient()
  const where = {
    _status: {
      equals: 'published' as const,
    },
    slug: {
      equals: args.slug,
    },
  }
  const localizedResult = await payload.find({
    collection: 'projects',
    depth: 1,
    fallbackLocale: false,
    limit: 1,
    locale: args.locale,
    overrideAccess: false,
    where,
  })
  const sourceProject = localizedResult.docs[0] ?? null

  let project = sourceProject
  let resolvedLocale = args.locale
  let usedFallback = false

  if (!isRenderableProject(project) && args.locale !== defaultLocale) {
    const fallbackResult = await payload.find({
      collection: 'projects',
      depth: 1,
      fallbackLocale: false,
      limit: 1,
      locale: defaultLocale,
      overrideAccess: false,
      where,
    })

    project = fallbackResult.docs[0] ?? null
    resolvedLocale = defaultLocale
    usedFallback = true
  }

  if (!isRenderableProject(project)) {
    return null
  }

  return {
    project,
    requestedLocale: args.locale,
    resolvedLocale,
    sourceProject,
    usedFallback,
  }
}

export async function getRenderableProjectLocales(args: { slug: string }): Promise<AppLocale[]> {
  const payload = await getPayloadClient()
  const localizedProjects = await Promise.all(
    localeCodes.map(async (locale) => {
      const result = await payload.find({
        collection: 'projects',
        depth: 0,
        fallbackLocale: false,
        limit: 1,
        locale,
        overrideAccess: false,
        where: {
          _status: {
            equals: 'published',
          },
          slug: {
            equals: args.slug,
          },
        },
      })

      return {
        locale,
        project: result.docs[0] ?? null,
      }
    }),
  )

  return localizedProjects
    .filter((entry): entry is { locale: AppLocale; project: Project } =>
      isRenderableProject(entry.project),
    )
    .map((entry) => entry.locale)
}
