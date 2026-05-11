'use client'

const anchorScrollViewportRatio = 0.28

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function readArticleAnchorScrollBehavior(): ScrollBehavior {
  return prefersReducedMotion() ? 'auto' : 'smooth'
}

export function getClickElement(target: EventTarget | null) {
  if (target instanceof Element) {
    return target
  }

  if (target instanceof Node) {
    return target.parentElement
  }

  return null
}

export function getHashTarget(href: string) {
  if (!href.startsWith('#') || href === '#') {
    return null
  }

  try {
    return document.getElementById(decodeURIComponent(href.slice(1)))
  } catch {
    return document.getElementById(href.slice(1))
  }
}

export function isPlainPrimaryClick(event: MouseEvent) {
  return (
    event.button === 0 &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey &&
    !event.defaultPrevented
  )
}

export function resolveArticleAnchorScrollTop(target: Element) {
  const targetTop = target.getBoundingClientRect().top + window.scrollY

  return Math.max(0, Math.round(targetTop - window.innerHeight * anchorScrollViewportRatio))
}

export function scrollToArticleAnchorTarget(
  target: Element,
  behavior = readArticleAnchorScrollBehavior(),
) {
  const top = resolveArticleAnchorScrollTop(target)

  window.scrollTo({
    behavior,
    top,
  })

  return top
}

export function watchArticleAnchorScrollCompletion(args: {
  onComplete: () => void
  settleDelayMs?: number
  targetTop: number
}) {
  const settleDelayMs = args.settleDelayMs ?? 140
  const settleThreshold = 1
  let completed = false
  let started = Math.abs(window.scrollY - args.targetTop) <= settleThreshold
  let timeout: number | null = null

  const clearTimeoutHandle = () => {
    if (timeout != null) {
      window.clearTimeout(timeout)
      timeout = null
    }
  }

  const detach = () => {
    window.removeEventListener('scroll', handleScroll)
  }

  const complete = () => {
    if (completed) {
      return
    }

    completed = true
    clearTimeoutHandle()
    detach()
    args.onComplete()
  }

  const arm = () => {
    clearTimeoutHandle()
    timeout = window.setTimeout(complete, settleDelayMs)
  }

  const handleScroll = () => {
    if (completed) {
      return
    }

    started = true
    arm()
  }

  window.addEventListener('scroll', handleScroll, { passive: true })

  if (started) {
    arm()
  }

  return () => {
    if (completed) {
      return
    }

    completed = true
    clearTimeoutHandle()
    detach()
  }
}

export function shouldDeferArticleAnchorScroll(target: Element) {
  return Boolean(target.closest('details:not([open])'))
}

export function scheduleArticleAnchorScroll(
  target: Element,
  behavior = readArticleAnchorScrollBehavior(),
) {
  return new Promise<number>((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        resolve(scrollToArticleAnchorTarget(target, behavior))
      })
    })
  })
}
