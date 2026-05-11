import type { Media } from '@/payload-types'

import { resolveMediaAsset, type ResolvedMediaAsset } from '@/features/media/model/media'
import { cn } from '@/shared/utils/cn'

type MediaVariant = 'attachment' | 'card' | 'hero' | 'inline'

type MediaSurfaceProps = {
  alt?: null | string
  asset?: ResolvedMediaAsset | null
  className?: string
  loading?: 'eager' | 'lazy'
  media?: null | Pick<
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
  src?: null | string
  variant?: MediaVariant
}

export function MediaSurface(props: MediaSurfaceProps) {
  const variant = props.variant ?? 'card'
  const asset =
    props.asset ??
    resolveMediaAsset({
      alt: props.alt,
      media: props.media,
      src: props.src,
    })

  if (!asset) {
    return null
  }

  const label = asset.filename || asset.alt
  const extensionLabel = asset.extensionLabel || 'FILE'

  return (
    <span
      className={cn('media-surface', `media-surface--${variant}`, props.className)}
      data-kind={asset.kind}
    >
      {asset.previewURL ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={asset.kind === 'pdf' ? `${asset.alt} PDF preview` : asset.alt}
          className={cn('media-surface__image', `media-surface__image--${variant}`)}
          decoding="async"
          height={asset.height ?? undefined}
          loading={props.loading ?? 'lazy'}
          src={asset.previewURL}
          width={asset.width ?? undefined}
        />
      ) : (
        <span className="media-surface__fallback">
          <span className="media-surface__extension">{extensionLabel}</span>
          <span className="media-surface__fallback-text">{label}</span>
        </span>
      )}

      {asset.kind === 'pdf' ? <span className="media-surface__badge">PDF</span> : null}
    </span>
  )
}
