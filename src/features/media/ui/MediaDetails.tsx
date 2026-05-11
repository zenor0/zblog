import { cn } from '@/shared/utils/cn'

type MediaDetailsProps = {
  caption?: null | string
  className?: string
  credit?: null | string
  creditPrefix?: null | string
}

export function MediaDetails(props: MediaDetailsProps) {
  const caption = props.caption?.trim() || null
  const credit = props.credit?.trim() || null
  const shouldSplit = Boolean(caption && credit)

  if (!caption && !credit) {
    return null
  }

  return (
    <span className={cn('media-details', shouldSplit && 'media-details--split', props.className)}>
      {caption ? <span className="media-details__caption">{caption}</span> : null}
      {credit ? (
        <span className="media-details__credit">
          {props.creditPrefix ? `${props.creditPrefix} ${credit}` : credit}
        </span>
      ) : null}
    </span>
  )
}
