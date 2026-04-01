import type { NonBibliographyPrefix } from '@/lib/citations'

import {
  articleLabelPattern,
  createArticleAnchorId,
  extractNodeText,
  formatArticleReference,
  parseArticleLabel,
} from '@/lib/markdown/article-syntax'
import type { ArticleElementMeta } from '@/lib/markdown/types'

export function registerArticleElement(args: {
  caption?: null | string
  counters: Map<NonBibliographyPrefix, number>
  kind: NonBibliographyPrefix
  label?: null | string
  registry: Map<string, ArticleElementMeta>
}): ArticleElementMeta {
  const nextNumber = (args.counters.get(args.kind) ?? 0) + 1
  const candidateLabel = args.label?.trim().toLowerCase() || null
  const label = candidateLabel && !args.registry.has(candidateLabel) ? candidateLabel : null

  args.counters.set(args.kind, nextNumber)

  const meta: ArticleElementMeta = {
    anchorId: label ? createArticleAnchorId(label) : null,
    caption: args.caption?.trim() || null,
    kind: args.kind,
    label,
    number: nextNumber,
  }

  if (label) {
    args.registry.set(label, meta)
  }

  return meta
}

export function buildArticleElementProperties(meta: ArticleElementMeta) {
  return {
    'data-article-anchor-id': meta.anchorId ?? undefined,
    'data-article-caption': meta.caption ?? undefined,
    'data-article-kind': meta.kind,
    'data-article-label': formatArticleReference(meta),
    'data-article-number': String(meta.number),
  }
}

export function parseFigureParagraph(node: any) {
  if (node?.type !== 'paragraph' || !Array.isArray(node.children)) {
    return null
  }

  const meaningfulChildren = node.children.filter(
    (child: any) => !(child.type === 'text' && typeof child.value === 'string' && child.value.trim().length === 0),
  )

  if (meaningfulChildren.length !== 2) {
    return null
  }

  const [imageNode, labelNode] = meaningfulChildren

  if (imageNode?.type !== 'image' || labelNode?.type !== 'text' || typeof labelNode.value !== 'string') {
    return null
  }

  const labelMatch = labelNode.value.match(articleLabelPattern)

  if (!labelMatch) {
    return null
  }

  const parsedLabel = parseArticleLabel(labelMatch[1])

  if (!parsedLabel || parsedLabel.kind !== 'fig') {
    return null
  }

  return {
    imageNode,
    label: parsedLabel.label,
  }
}

export function parseTableCaptionParagraph(node: any) {
  if (node?.type !== 'paragraph') {
    return null
  }

  const rawText = extractNodeText(node).trim()
  const captionMatch = rawText.match(/^:\s*(.+?)\s*$/)

  if (!captionMatch) {
    return null
  }

  let caption = captionMatch[1].trim()
  let label: null | string = null

  const labelMatch = caption.match(/^(.*?)(?:\s*\{#([^}\s]+)\})\s*$/)

  if (labelMatch) {
    caption = labelMatch[1].trim()

    const parsedLabel = parseArticleLabel(labelMatch[2])

    if (parsedLabel?.kind === 'tbl') {
      label = parsedLabel.label
    }
  }

  if (!caption) {
    return null
  }

  return {
    caption,
    label,
  }
}
