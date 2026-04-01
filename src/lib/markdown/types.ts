import type { ReactNode } from 'react'

import type { Media } from '@/payload-types'

import type { NonBibliographyPrefix } from '@/lib/citations'
import type { MarkdownHeading } from '@/lib/markdown-headings'
import { resolveMediaAsset } from '@/lib/media'

export type MarkdownRendererProps = {
  citationIndex?: Map<string, number>
  headings?: MarkdownHeading[]
  mediaBySource?: Record<string, MarkdownMediaLike>
  source: string
}

export type MarkdownMediaLike = Pick<
  Media,
  | 'alt'
  | 'caption'
  | 'credit'
  | 'filename'
  | 'height'
  | 'mimeType'
  | 'previewSVGURL'
  | 'url'
  | 'width'
>

export type ArticleElementMeta = {
  anchorId: null | string
  caption: null | string
  kind: NonBibliographyPrefix
  label: null | string
  number: number
}

export type MarkdownMediaRenderResult = {
  asset: NonNullable<ReturnType<typeof resolveMediaAsset>>
  caption: null | string
  credit: null | string
  surface: ReactNode
}
