'use client'

import type { ComponentProps } from 'react'

import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import type { ArticleLinkPreview } from '@/features/article/model/article-link-previews'

type ArticleLinkPreviewLinkProps = ComponentProps<'a'> & {
  preview?: ArticleLinkPreview | null
}

function ArticleLinkPreviewContent(props: { preview: ArticleLinkPreview }) {
  const { preview } = props

  return (
    <div data-link-preview-card="" data-link-preview-card-kind={preview.kind}>
      <p className="section-kicker">{preview.meta}</p>
      <p className="article-link-preview__title">{preview.title}</p>
      {preview.subtitle ? (
        <p className="article-link-preview__subtitle">{preview.subtitle}</p>
      ) : null}
      {preview.description ? (
        <p className="article-link-preview__description">{preview.description}</p>
      ) : null}
    </div>
  )
}

export function ArticleLinkPreviewLink(props: ArticleLinkPreviewLinkProps) {
  const { children, preview, ...anchorProps } = props
  const anchor = (
    <a
      {...anchorProps}
      data-link-preview-description={preview?.description}
      data-link-preview-kind={preview?.kind}
      data-link-preview-meta={preview?.meta}
      data-link-preview-subtitle={preview?.subtitle}
      data-link-preview-title={preview?.title}
    >
      {children}
    </a>
  )

  if (!preview) {
    return anchor
  }

  return (
    <HoverCard closeDelay={80} openDelay={140}>
      <HoverCardTrigger asChild>{anchor}</HoverCardTrigger>
      <HoverCardContent
        align="start"
        className="article-link-preview"
        collisionPadding={16}
        side="top"
      >
        <ArticleLinkPreviewContent preview={preview} />
      </HoverCardContent>
    </HoverCard>
  )
}
