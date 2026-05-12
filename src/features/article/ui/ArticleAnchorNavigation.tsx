'use client'

import { CornerUpLeftIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useArticleAnchorReturnNavigation } from '@/features/article/ui/useArticleAnchorReturnNavigation'

export function ArticleAnchorNavigation(props: { returnLabel: string }) {
  const { returnLabel } = props
  const { buttonRef, returnButtonStyle, returnState, returnToReadingPosition } =
    useArticleAnchorReturnNavigation()

  if (!returnState) {
    return null
  }

  return (
    <Button
      aria-label={returnLabel}
      className="article-anchor-return"
      data-anchor-return-positioned="true"
      onClick={returnToReadingPosition}
      ref={buttonRef}
      size="sm"
      style={returnButtonStyle}
      type="button"
      variant="secondary"
    >
      <CornerUpLeftIcon aria-hidden="true" data-icon="inline-start" />
      <span>{returnLabel}</span>
    </Button>
  )
}
