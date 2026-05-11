import type { NonBibliographyPrefix } from '@/features/article/model/citations'
import { describeBibliographyEntry, type BibliographyEntry } from '@/features/article/model/bibliography'
import type { MarkdownHeading } from '@/features/article/model/markdown-headings'

export type ArticleLinkPreviewKind =
  | 'articleElement'
  | 'bibliography'
  | 'external'
  | 'heading'
  | 'internal'

export type ArticleLinkPreview = {
  description?: string
  href: string
  kind: ArticleLinkPreviewKind
  meta?: string
  subtitle?: string
  title: string
}

export type BibliographyLinkPreviewLabels = {
  referenceItem: string
  references?: string
  referenceUntitled: string
}

export type BibliographyLinkPreviewIndex = {
  byHref: Record<string, ArticleLinkPreview>
  byKey: Record<string, ArticleLinkPreview>
}

function compactJoin(values: Array<null | string | undefined>, separator = ' · ') {
  return values.filter((value): value is string => Boolean(value?.trim())).join(separator)
}

function normalizePreviewTitle(title: null | string | undefined, fallback: string) {
  return title?.trim() || fallback
}

function normalizeCitationKey(key: string) {
  return key.trim().toLowerCase()
}

function formatArticleElementKind(kind: NonBibliographyPrefix) {
  switch (kind) {
    case 'fig':
      return 'Figure'
    case 'tbl':
      return 'Table'
    case 'sec':
      return 'Section'
    default:
      return kind.toUpperCase()
  }
}

function resolveExternalHost(href: string) {
  try {
    return new URL(href).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

export function buildBibliographyLinkPreviews(
  entries: BibliographyEntry[],
  labels: BibliographyLinkPreviewLabels,
): BibliographyLinkPreviewIndex {
  const byHref: Record<string, ArticleLinkPreview> = {}
  const byKey: Record<string, ArticleLinkPreview> = {}
  const referenceLabel = labels.references?.trim() || 'Reference'

  entries.forEach((entry, index) => {
    const display = describeBibliographyEntry(entry)
    const href = `#reference-${index + 1}`
    const typeLabel = entry.entryType.trim().replace(/-/g, ' ') || labels.referenceItem
    const preview: ArticleLinkPreview = {
      description:
        display.container || display.secondary[0] || display.links[0]?.value || undefined,
      href,
      kind: 'bibliography',
      meta: `${referenceLabel} [${index + 1}] · ${typeLabel}`,
      subtitle: compactJoin([display.creators, display.year]) || undefined,
      title: normalizePreviewTitle(display.title, labels.referenceUntitled),
    }

    byHref[href] = preview
    byKey[normalizeCitationKey(entry.citationKey)] = preview
  })

  return {
    byHref,
    byKey,
  }
}

export function buildHeadingLinkPreviews(
  headings: MarkdownHeading[],
): Record<string, ArticleLinkPreview> {
  return Object.fromEntries(
    headings.map((heading) => {
      const href = `#${heading.id}`
      const meta = compactJoin([`Heading H${heading.depth}`, heading.displayNumber])

      return [
        href,
        {
          description: undefined,
          href,
          kind: 'heading',
          meta,
          subtitle: 'Article section',
          title: heading.text,
        } satisfies ArticleLinkPreview,
      ]
    }),
  )
}

export function createArticleElementLinkPreview(args: {
  caption?: null | string
  href: string
  kind: NonBibliographyPrefix
  label: string
}) {
  return {
    description: args.caption?.trim() || undefined,
    href: args.href,
    kind: 'articleElement',
    meta: `${formatArticleElementKind(args.kind)} reference`,
    subtitle: 'Article reference',
    title: args.label,
  } satisfies ArticleLinkPreview
}

export function createFallbackLinkPreview(
  href: null | string | undefined,
  label?: null | string,
): ArticleLinkPreview | null {
  if (!href) {
    return null
  }

  const title = normalizePreviewTitle(label, href)

  if (/^https?:\/\//i.test(href)) {
    const host = resolveExternalHost(href)

    return {
      description: href,
      href,
      kind: 'external',
      meta: 'External link',
      subtitle: host || 'External site',
      title,
    }
  }

  return {
    description: href,
    href,
    kind: 'internal',
    meta: 'Internal link',
    subtitle: href.startsWith('#') ? 'Article anchor' : 'Site link',
    title,
  }
}

export function readLinkPreviewFromDataAttributes(
  props: Record<string, unknown>,
  href: null | string | undefined,
): ArticleLinkPreview | null {
  const kind = props['data-link-preview-kind']
  const title = props['data-link-preview-title']

  if (
    !href ||
    (kind !== 'articleElement' &&
      kind !== 'bibliography' &&
      kind !== 'external' &&
      kind !== 'heading' &&
      kind !== 'internal') ||
    typeof title !== 'string'
  ) {
    return null
  }

  return {
    description:
      typeof props['data-link-preview-description'] === 'string'
        ? props['data-link-preview-description']
        : undefined,
    href,
    kind,
    meta:
      typeof props['data-link-preview-meta'] === 'string'
        ? props['data-link-preview-meta']
        : undefined,
    subtitle:
      typeof props['data-link-preview-subtitle'] === 'string'
        ? props['data-link-preview-subtitle']
        : undefined,
    title,
  }
}
