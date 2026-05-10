'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { CornerUpLeftIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  getClickElement,
  getHashTarget,
  isPlainPrimaryClick,
  readArticleAnchorScrollBehavior,
  scheduleArticleAnchorScroll,
  scrollToArticleAnchorTarget,
  shouldDeferArticleAnchorScroll,
} from '@/components/frontend/article-anchor-navigation-utils'

const anchorHighlightAttribute = 'data-article-anchor-highlight'
const anchorHighlightDuration = 1800
const defaultReturnButtonHeight = 32
const defaultReturnButtonWidth = 190
const returnButtonOffset = 12
const viewportPadding = 16

type ReturnButtonPosition = {
  left: number
  top: number
}

type ReturnState = {
  position: ReturnButtonPosition
  targetID: string
  top: number
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function resolveReturnButtonPosition(target: HTMLElement, button: HTMLButtonElement | null) {
  const rect = target.getBoundingClientRect()
  const buttonHeight = button?.offsetHeight || defaultReturnButtonHeight
  const buttonWidth = button?.offsetWidth || defaultReturnButtonWidth
  const maxLeft = Math.max(viewportPadding, window.innerWidth - buttonWidth - viewportPadding)
  const maxTop = Math.max(viewportPadding, window.innerHeight - buttonHeight - viewportPadding)
  const top = clamp(rect.top, viewportPadding, maxTop)
  let left = rect.right + returnButtonOffset

  if (left + buttonWidth > window.innerWidth - viewportPadding) {
    left = rect.left - buttonWidth - returnButtonOffset
  }

  if (left < viewportPadding || left + buttonWidth > window.innerWidth - viewportPadding) {
    left = clamp(rect.left, viewportPadding, maxLeft)
  }

  return {
    left: Math.round(left),
    top: Math.round(top),
  } satisfies ReturnButtonPosition
}

export function ArticleAnchorNavigation(props: { returnLabel: string }) {
  const { returnLabel } = props
  const buttonRef = useRef<HTMLButtonElement>(null)
  const highlightedTargetRef = useRef<HTMLElement | null>(null)
  const highlightTimeoutRef = useRef<null | number>(null)
  const [returnState, setReturnState] = useState<null | ReturnState>(null)

  const clearHighlight = useCallback(() => {
    if (highlightTimeoutRef.current != null) {
      window.clearTimeout(highlightTimeoutRef.current)
      highlightTimeoutRef.current = null
    }

    highlightedTargetRef.current?.removeAttribute(anchorHighlightAttribute)
    highlightedTargetRef.current = null
  }, [])

  const highlightTarget = useCallback(
    (target: HTMLElement) => {
      clearHighlight()

      target.setAttribute(anchorHighlightAttribute, 'true')
      highlightedTargetRef.current = target
      highlightTimeoutRef.current = window.setTimeout(() => {
        if (highlightedTargetRef.current === target) {
          clearHighlight()
        }
      }, anchorHighlightDuration)
    },
    [clearHighlight],
  )

  const syncReturnPosition = useCallback(() => {
    setReturnState((current) => {
      if (!current) {
        return current
      }

      const target = document.getElementById(current.targetID)

      if (!target) {
        return null
      }

      const position = resolveReturnButtonPosition(target, buttonRef.current)

      if (current.position.left === position.left && current.position.top === position.top) {
        return current
      }

      return {
        ...current,
        position,
      }
    })
  }, [])

  useEffect(() => {
    return () => {
      clearHighlight()
    }
  }, [clearHighlight])

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!isPlainPrimaryClick(event)) {
        return
      }

      const link = getClickElement(event.target)?.closest<HTMLAnchorElement>('a[href]')
      const href = link?.getAttribute('href')
      const target = href ? getHashTarget(href) : null

      if (!link || !href || !target) {
        return
      }

      event.preventDefault()

      const behavior = readArticleAnchorScrollBehavior()

      setReturnState({
        position: resolveReturnButtonPosition(target, buttonRef.current),
        targetID: target.id,
        top: window.scrollY,
      })

      highlightTarget(target)

      if (shouldDeferArticleAnchorScroll(target)) {
        scheduleArticleAnchorScroll(target, behavior)
      } else {
        scrollToArticleAnchorTarget(target, behavior)
      }

      if (window.location.hash !== href) {
        window.history.pushState(null, '', href)
      }
    }

    document.addEventListener('click', handleClick)

    return () => {
      document.removeEventListener('click', handleClick)
    }
  }, [highlightTarget])

  useEffect(() => {
    if (!returnState) {
      return undefined
    }

    let frame = 0
    const sync = () => {
      cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(syncReturnPosition)
    }

    syncReturnPosition()
    window.addEventListener('resize', sync)
    window.addEventListener('scroll', sync, { passive: true })

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', sync)
      window.removeEventListener('scroll', sync)
    }
  }, [returnState?.targetID, syncReturnPosition])

  if (!returnState) {
    return null
  }

  const returnButtonStyle: CSSProperties = {
    left: returnState.position.left,
    top: returnState.position.top,
  }

  return (
    <Button
      aria-label={returnLabel}
      className="article-anchor-return"
      data-anchor-return-positioned="true"
      onClick={() => {
        window.scrollTo({
          behavior: readArticleAnchorScrollBehavior(),
          top: returnState.top,
        })
        setReturnState(null)
      }}
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
