'use client'

import { useEffect, useState } from 'react'
import { CornerUpLeftIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function getClickElement(target: EventTarget | null) {
  if (target instanceof Element) {
    return target
  }

  if (target instanceof Node) {
    return target.parentElement
  }

  return null
}

function getHashTarget(href: string) {
  if (!href.startsWith('#') || href === '#') {
    return null
  }

  try {
    return document.getElementById(decodeURIComponent(href.slice(1)))
  } catch {
    return document.getElementById(href.slice(1))
  }
}

function isPlainPrimaryClick(event: MouseEvent) {
  return (
    event.button === 0 &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey &&
    !event.defaultPrevented
  )
}

export function ArticleAnchorNavigation(props: { returnLabel: string }) {
  const { returnLabel } = props
  const [returnTop, setReturnTop] = useState<null | number>(null)

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

      setReturnTop(window.scrollY)
      target.scrollIntoView({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'start',
      })

      if (window.location.hash !== href) {
        window.history.pushState(null, '', href)
      }
    }

    document.addEventListener('click', handleClick)

    return () => {
      document.removeEventListener('click', handleClick)
    }
  }, [])

  if (returnTop == null) {
    return null
  }

  return (
    <Button
      aria-label={returnLabel}
      className="article-anchor-return"
      onClick={() => {
        window.scrollTo({
          behavior: prefersReducedMotion() ? 'auto' : 'smooth',
          top: returnTop,
        })
        setReturnTop(null)
      }}
      size="sm"
      type="button"
      variant="secondary"
    >
      <CornerUpLeftIcon aria-hidden="true" data-icon="inline-start" />
      <span>{returnLabel}</span>
    </Button>
  )
}
