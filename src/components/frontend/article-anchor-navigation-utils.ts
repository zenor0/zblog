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

export function shouldDeferArticleAnchorScroll(target: Element) {
  return Boolean(target.closest('details:not([open])'))
}

export function scheduleArticleAnchorScroll(
  target: Element,
  behavior = readArticleAnchorScrollBehavior(),
) {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      scrollToArticleAnchorTarget(target, behavior)
    })
  })
}
