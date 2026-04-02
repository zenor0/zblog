import type { Media, Post } from '@/payload-types'
import type { AppLocale } from '@/lib/locales'

import { getLocaleLabel } from '@/lib/locales'
import { buildSeoDescription } from '@/lib/seo'

export type LocaleSnapshot = Pick<
  Post,
  'content' | 'title' | 'translatedAt' | 'translatedFromLocale' | 'translationStatus'
>

export type LocaleCoverage = 'complete' | 'missing' | 'partial'

export type LocaleInsight = {
  code: AppLocale
  coverage: LocaleCoverage
  label: string
  snapshot: LocaleSnapshot | null
}

export type HeroImageSummary = Pick<
  Media,
  'alt' | 'caption' | 'credit' | 'previewSVGURL' | 'thumbnailURL' | 'url'
>

type SnapshotTone = 'danger' | 'muted' | 'neutral' | 'success' | 'warning'

type SnapshotItem = {
  label: string
  tone: SnapshotTone
  value: string
}

export function hasText(value: null | string | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

export function getLocaleCoverage(
  snapshot: null | Pick<LocaleSnapshot, 'content' | 'title'>,
): LocaleCoverage {
  const hasTitle = hasText(snapshot?.title)
  const hasContent = hasText(snapshot?.content)

  if (hasTitle && hasContent) {
    return 'complete'
  }

  if (hasTitle || hasContent) {
    return 'partial'
  }

  return 'missing'
}

export function getCoverageLabel(coverage: LocaleCoverage): string {
  switch (coverage) {
    case 'complete':
      return 'Complete'
    case 'partial':
      return 'Partial'
    default:
      return 'Missing'
  }
}

export function getCoverageTone(coverage: LocaleCoverage): SnapshotTone {
  switch (coverage) {
    case 'complete':
      return 'success'
    case 'partial':
      return 'warning'
    default:
      return 'danger'
  }
}

export function getCoverageBadgeLabel(
  snapshot: null | Pick<LocaleSnapshot, 'content' | 'title'>,
): string {
  const presentFields = Number(hasText(snapshot?.title)) + Number(hasText(snapshot?.content))
  const coverage = getLocaleCoverage(snapshot)

  return `${getCoverageLabel(coverage)} ${presentFields}/2`
}

export function formatStatus(value: LocaleSnapshot['translationStatus']): string {
  switch (value) {
    case 'machine':
      return 'Machine'
    case 'original':
      return 'Original'
    case 'reviewed':
      return 'Reviewed'
    default:
      return 'Not set'
  }
}

export function getStatusTone(value: LocaleSnapshot['translationStatus']): SnapshotTone {
  switch (value) {
    case 'reviewed':
      return 'success'
    case 'machine':
      return 'warning'
    case 'original':
      return 'muted'
    default:
      return 'muted'
  }
}

export function formatDate(value: null | string | undefined, activeLocale: AppLocale): string {
  if (!value) {
    return 'Not set'
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(activeLocale === 'zh-Hans' ? 'zh-Hans' : 'en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed)
}

export function getLocaleNote(snapshot: LocaleSnapshot | null, activeLocale: AppLocale): null | string {
  const parts: string[] = []

  if (snapshot?.translatedFromLocale) {
    parts.push(`From ${getLocaleLabel(snapshot.translatedFromLocale)}`)
  }

  if (snapshot?.translatedAt) {
    parts.push(formatDate(snapshot.translatedAt, activeLocale))
  }

  return parts.length > 0 ? parts.join(' · ') : null
}

export function getBibliographyTitle(value: Post['bibliographyFile']): null | string {
  if (value && typeof value === 'object' && 'title' in value && typeof value.title === 'string') {
    return value.title
  }

  return null
}

export function getHeroImage(value: unknown): HeroImageSummary | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const alt = 'alt' in value && typeof value.alt === 'string' ? value.alt : ''
  const caption = 'caption' in value && typeof value.caption === 'string' ? value.caption : null
  const credit = 'credit' in value && typeof value.credit === 'string' ? value.credit : null
  const previewSVGURL =
    'previewSVGURL' in value && typeof value.previewSVGURL === 'string' ? value.previewSVGURL : null
  const thumbnailURL =
    'thumbnailURL' in value && typeof value.thumbnailURL === 'string' ? value.thumbnailURL : null
  const url = 'url' in value && typeof value.url === 'string' ? value.url : null

  return {
    alt,
    caption,
    credit,
    previewSVGURL,
    thumbnailURL,
    url,
  }
}

export function getPreviewURL(heroImage: HeroImageSummary | null): null | string {
  return heroImage?.previewSVGURL ?? heroImage?.thumbnailURL ?? heroImage?.url ?? null
}

function getSeoReadiness(args: {
  content?: null | string
  excerpt?: null | string
  heroImage?: unknown
  seo?: null | Post['seo']
  title?: null | string
}): SnapshotItem {
  const effectiveTitle = hasText(args.seo?.metaTitle) ? args.seo?.metaTitle : args.title
  const effectiveDescription = buildSeoDescription({
    content: args.content,
    fallback: args.excerpt,
    value: args.seo?.metaDescription ?? null,
  })
  const effectiveImage = getHeroImage(args.seo?.metaImage) ?? getHeroImage(args.heroImage)
  const readyFields =
    Number(hasText(effectiveTitle)) +
    Number(hasText(effectiveDescription)) +
    Number(Boolean(getPreviewURL(effectiveImage)))

  if (readyFields === 3) {
    return {
      label: 'SEO',
      tone: 'success',
      value: 'Ready',
    }
  }

  if (readyFields > 0) {
    return {
      label: 'SEO',
      tone: 'warning',
      value: 'Incomplete',
    }
  }

  return {
    label: 'SEO',
    tone: 'danger',
    value: 'Missing',
  }
}

export function buildPublishingSnapshot(args: {
  activeLocale: AppLocale
  content?: null | string
  excerpt?: null | string
  heroImage?: unknown
  seo?: null | Post['seo']
  slug?: null | string
  status?: null | Post['_status']
  title?: null | string
  translationStatus?: LocaleSnapshot['translationStatus']
  updatedAt?: null | string
}) {
  const contentSnapshot = {
    content: args.content ?? null,
    title: args.title ?? null,
  }
  const coverage = getLocaleCoverage(contentSnapshot)

  return {
    content: {
      label: 'Content',
      tone: getCoverageTone(coverage),
      value: getCoverageBadgeLabel(contentSnapshot),
    } satisfies SnapshotItem,
    noindex: {
      label: 'Indexing',
      tone: args.seo?.noindex ? 'warning' : 'muted',
      value: args.seo?.noindex ? 'Noindex' : 'Indexable',
    } satisfies SnapshotItem,
    seo: getSeoReadiness(args),
    slug: {
      label: 'Slug',
      tone: hasText(args.slug) ? 'neutral' : 'warning',
      value: hasText(args.slug) ? args.slug.trim() : 'Missing',
    } satisfies SnapshotItem,
    status: {
      label: 'Status',
      tone: args.status === 'published' ? 'success' : 'neutral',
      value: args.status === 'published' ? 'Published' : 'Draft',
    } satisfies SnapshotItem,
    translation: {
      label: 'Translation',
      tone: getStatusTone(args.translationStatus),
      value: formatStatus(args.translationStatus),
    } satisfies SnapshotItem,
    updatedAt: {
      label: 'Updated',
      tone: 'neutral',
      value: formatDate(args.updatedAt, args.activeLocale),
    } satisfies SnapshotItem,
  }
}

export function buildContentAssetSummary(
  args: Pick<Post, 'attachments' | 'bibliographyFile' | 'heroImage' | 'tags'>,
) {
  const heroImage = getHeroImage(args.heroImage)

  return {
    attachmentCount: Array.isArray(args.attachments) ? args.attachments.length : 0,
    bibliographyLabel: getBibliographyTitle(args.bibliographyFile) ?? 'None linked',
    hasHeroImage: Boolean(getPreviewURL(heroImage)),
    heroImage,
    tagCount: Array.isArray(args.tags) ? args.tags.length : 0,
  }
}

export function summarizeLocaleCoverage(locales: LocaleInsight[]) {
  return {
    completeCount: locales.filter((locale) => locale.coverage === 'complete').length,
    missingCount: locales.filter((locale) => locale.coverage === 'missing').length,
    partialCount: locales.filter((locale) => locale.coverage === 'partial').length,
    reviewedCount: locales.filter((locale) => locale.snapshot?.translationStatus === 'reviewed').length,
  }
}
