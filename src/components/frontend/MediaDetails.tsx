import { cn } from '@/lib/utils'

type MediaDetailsProps = {
  caption?: null | string
  className?: string
  credit?: null | string
  creditPrefix?: null | string
}

export function MediaDetails(props: MediaDetailsProps) {
  const caption = props.caption?.trim() || null
  const credit = props.credit?.trim() || null

  if (!caption && !credit) {
    return null
  }

  return (
    <span className={cn('media-details', props.className)}>
      {caption ? <span className="media-details__caption">{caption}</span> : null}
      {credit ? (
        <span className="media-details__credit">
          {props.creditPrefix ? `${props.creditPrefix} ${credit}` : credit}
        </span>
      ) : null}
    </span>
  )
}
