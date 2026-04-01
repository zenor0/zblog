import React from 'react'

import { MediaDetails } from '@/components/frontend/MediaDetails'
import { MediaSurface } from '@/components/frontend/MediaSurface'
import { resolveMediaAsset, resolveMediaCaption } from '@/lib/media'
import type { MarkdownMediaLike, MarkdownMediaRenderResult } from '@/lib/markdown/types'

function resolveMarkdownMedia(props: {
  alt?: null | string
  mediaBySource?: Record<string, MarkdownMediaLike>
  src?: Blob | null | string
  title?: null | string
}): MarkdownMediaRenderResult | null {
  const source = typeof props.src === 'string' ? props.src : null
  const media = source ? props.mediaBySource?.[source] ?? null : null
  const asset = resolveMediaAsset({
    alt: props.alt,
    media,
    src: source,
  })

  if (!asset) {
    return null
  }

  return {
    asset,
    caption: resolveMediaCaption({
      alt: asset.alt,
      caption: asset.caption,
      title: props.title,
    }),
    credit: asset.credit?.trim() || null,
    surface: <MediaSurface asset={asset} variant="inline" />,
  }
}

export function MarkdownImage(props: {
  alt?: null | string
  mediaBySource?: Record<string, MarkdownMediaLike>
  src?: Blob | null | string
  title?: null | string
}) {
  const media = resolveMarkdownMedia(props)

  if (!media) {
    return null
  }

  const { asset, caption, credit, surface } = media

  if (asset.kind === 'pdf' || asset.kind === 'unknown') {
    return (
      <span className="markdown-media">
        <a className="markdown-media-link" href={asset.downloadURL} rel="noreferrer" target="_blank">
          {surface}
        </a>
        <MediaDetails caption={caption} className="markdown-media__details" credit={credit} />
      </span>
    )
  }

  return (
    <span className="markdown-media">
      {surface}
      <MediaDetails caption={caption} className="markdown-media__details" credit={credit} />
    </span>
  )
}

export function MarkdownFigure(props: {
  alt?: null | string
  anchorId: string
  label: string
  mediaBySource?: Record<string, MarkdownMediaLike>
  src?: Blob | null | string
  title?: null | string
}) {
  const media = resolveMarkdownMedia(props)

  if (!media) {
    return null
  }

  const { asset, caption, credit, surface } = media
  const resolvedCaption = caption ? `${props.label}. ${caption}` : props.label
  const figureSurface =
    asset.kind === 'pdf' || asset.kind === 'unknown' ? (
      <a className="markdown-media-link" href={asset.downloadURL} rel="noreferrer" target="_blank">
        {surface}
      </a>
    ) : (
      surface
    )

  return (
    <figure className="markdown-figure markdown-figure--image" id={props.anchorId}>
      {figureSurface}
      <figcaption className="markdown-figure__details">
        <MediaDetails caption={resolvedCaption} credit={credit} />
      </figcaption>
    </figure>
  )
}

export function extractCodeBlockLanguage(children: React.ReactNode) {
  for (const child of React.Children.toArray(children)) {
    if (!React.isValidElement(child)) {
      continue
    }

    const className =
      typeof (child.props as { className?: unknown }).className === 'string'
        ? (child.props as { className: string }).className
        : ''
    const languageMatch = className.match(/language-([a-z0-9-]+)/i)

    if (languageMatch) {
      return languageMatch[1].toLowerCase()
    }
  }

  return null
}
