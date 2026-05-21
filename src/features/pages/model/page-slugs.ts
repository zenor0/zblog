import { slugify } from '@/shared/content/slugs'

export const reservedPageSlugs = [
  '_next',
  'admin',
  'api',
  'archive',
  'favicon.ico',
  'posts',
  'preview',
  'projects',
  'robots.txt',
  'rss.xml',
  'sitemap.xml',
] as const

const reservedPageSlugSet = new Set<string>(reservedPageSlugs)
const pageSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function normalizePageSlugInput(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function createPageSlugFromTitle(value: unknown): string {
  return typeof value === 'string' ? slugify(value) : ''
}

export function isReservedPageSlug(value: string): boolean {
  return reservedPageSlugSet.has(value)
}

export function validatePageSlug(value: unknown): true | string {
  const slug = normalizePageSlugInput(value)

  if (!slug) {
    return 'Page slug is required.'
  }

  if (slug.includes('/') || slug.startsWith('/') || slug.endsWith('/')) {
    return 'Page slug must be a single URL segment without slashes.'
  }

  if (slug !== slug.toLowerCase()) {
    return 'Page slug must use lowercase letters, numbers, and hyphens.'
  }

  if (!pageSlugPattern.test(slug)) {
    return 'Page slug must use lowercase letters, numbers, and single hyphens.'
  }

  if (isReservedPageSlug(slug)) {
    return `Page slug "${slug}" is reserved.`
  }

  return true
}

export function buildPagePath(slug: string) {
  return `/${encodeURIComponent(slug.trim())}`
}

export function isValidPageSlug(value: unknown): value is string {
  return validatePageSlug(value) === true
}
