'use client'

import { useCallback, useLayoutEffect, useRef, useState } from 'react'

import type { MarkdownHeading } from '@/lib/markdown-headings'

import {
  buildPathModel,
  clamp,
  formatPercent,
  getHeadingState,
  getTocX,
  initialProgress,
  mapDocumentYToPathOffset,
  readingOffsets,
  tocPath,
  type HeadingLevel,
  type PathStyle,
  type ReadingProgress,
  type ScrollDirection,
  type TocPoint,
} from './articleProgressModel'

type UseArticleProgressMeasurementArgs = {
  bendScale: number
  displayedHeadings: MarkdownHeading[]
  indentScale: number
  pathStyle: PathStyle
  scrollLeadScale: number
  showDebugBoundaries: boolean
  trackOverlapScale: number
}

function setAttributeIfChanged(element: Element | null, name: string, value: string) {
  if (!element || element.getAttribute(name) === value) {
    return
  }

  element.setAttribute(name, value)
}

function syncTitleOverflow(itemElement: HTMLLIElement) {
  const titleElement = itemElement.querySelector<HTMLElement>('.dev-progress-map__title')
  const titleTextElement = itemElement.querySelector<HTMLElement>('.dev-progress-map__title-text')

  if (!titleElement || !titleTextElement) {
    return
  }

  const overflowDistance = Math.ceil(titleTextElement.scrollWidth - titleElement.clientWidth)

  if (overflowDistance > 8) {
    setAttributeIfChanged(itemElement, 'data-title-overflow', 'true')
    itemElement.style.setProperty('--title-scroll-distance', `${overflowDistance}px`)
    return
  }

  itemElement.removeAttribute('data-title-overflow')
  itemElement.style.removeProperty('--title-scroll-distance')
}

function shouldSyncProgressState(
  previousProgress: ReadingProgress,
  nextProgress: ReadingProgress,
  includeDebugDetails: boolean,
) {
  if (includeDebugDetails) {
    return true
  }

  return (
    previousProgress.activeStartIndex !== nextProgress.activeStartIndex ||
    previousProgress.activeEndIndex !== nextProgress.activeEndIndex ||
    previousProgress.pathD !== nextProgress.pathD ||
    previousProgress.pathHeight !== nextProgress.pathHeight ||
    previousProgress.pathLength !== nextProgress.pathLength ||
    previousProgress.pathWidth !== nextProgress.pathWidth ||
    Math.round(previousProgress.visibleEndPercent) !== Math.round(nextProgress.visibleEndPercent)
  )
}

export function useArticleProgressMeasurement(args: UseArticleProgressMeasurementArgs) {
  const {
    bendScale,
    displayedHeadings,
    indentScale,
    pathStyle,
    scrollLeadScale,
    showDebugBoundaries,
    trackOverlapScale,
  } = args
  const scrollViewportRef = useRef<HTMLElement | null>(null)
  const tocItemRefs = useRef<Record<string, HTMLLIElement | null>>({})
  const tocListRef = useRef<HTMLOListElement | null>(null)
  const progressSvgRef = useRef<SVGSVGElement | null>(null)
  const trackPathRef = useRef<SVGPathElement | null>(null)
  const activePathRef = useRef<SVGPathElement | null>(null)
  const mobileProgressRef = useRef<HTMLDivElement | null>(null)
  const visibleEndPercentRef = useRef<HTMLSpanElement | null>(null)
  const mobileVisibleEndPercentRef = useRef<HTMLSpanElement | null>(null)
  const progressRef = useRef<ReadingProgress>(initialProgress)
  const paintedRangeRef = useRef({ activeEndIndex: -1, activeStartIndex: -1, pathD: '' })
  const shouldSyncTitleOverflowRef = useRef(true)
  const lastScrollYRef = useRef(0)
  const scrollDirectionRef = useRef<ScrollDirection>(1)
  const [progress, setProgress] = useState<ReadingProgress>(initialProgress)

  const paintProgress = useCallback(
    (nextProgress: ReadingProgress) => {
      const previousProgress = progressRef.current
      const pathLength = String(nextProgress.pathLength)
      const pathHeight = String(nextProgress.pathHeight)
      const pathWidth = String(nextProgress.pathWidth)

      setAttributeIfChanged(progressSvgRef.current, 'height', pathHeight)
      setAttributeIfChanged(progressSvgRef.current, 'width', pathWidth)
      setAttributeIfChanged(
        progressSvgRef.current,
        'viewBox',
        `0 0 ${nextProgress.pathWidth} ${nextProgress.pathHeight}`,
      )
      setAttributeIfChanged(trackPathRef.current, 'd', nextProgress.pathD)
      setAttributeIfChanged(trackPathRef.current, 'pathLength', pathLength)
      setAttributeIfChanged(activePathRef.current, 'd', nextProgress.pathD)
      setAttributeIfChanged(activePathRef.current, 'pathLength', pathLength)
      setAttributeIfChanged(
        activePathRef.current,
        'stroke-dasharray',
        `${nextProgress.activePathLength} ${nextProgress.pathLength}`,
      )
      setAttributeIfChanged(
        activePathRef.current,
        'stroke-dashoffset',
        String(-nextProgress.activePathOffset),
      )

      if (visibleEndPercentRef.current) {
        visibleEndPercentRef.current.textContent = formatPercent(nextProgress.visibleEndPercent)
      }

      if (mobileVisibleEndPercentRef.current) {
        mobileVisibleEndPercentRef.current.textContent = formatPercent(
          nextProgress.visibleEndPercent,
        )
      }

      if (mobileProgressRef.current) {
        const startPercent = `${nextProgress.visibleStartPercent}%`
        const widthPercent = `${Math.max(
          nextProgress.visibleEndPercent - nextProgress.visibleStartPercent,
          1,
        )}%`

        mobileProgressRef.current.style.setProperty('--mobile-progress-start', startPercent)
        mobileProgressRef.current.style.setProperty('--mobile-progress-size', widthPercent)
      }

      const paintedRange = paintedRangeRef.current
      const shouldPaintItems =
        paintedRange.activeStartIndex !== nextProgress.activeStartIndex ||
        paintedRange.activeEndIndex !== nextProgress.activeEndIndex ||
        paintedRange.pathD !== nextProgress.pathD

      if (shouldPaintItems) {
        displayedHeadings.forEach((heading, index) => {
          tocItemRefs.current[heading.id]?.setAttribute(
            'data-state',
            getHeadingState(index, nextProgress.activeStartIndex, nextProgress.activeEndIndex),
          )
        })

        paintedRangeRef.current = {
          activeEndIndex: nextProgress.activeEndIndex,
          activeStartIndex: nextProgress.activeStartIndex,
          pathD: nextProgress.pathD,
        }
      }

      progressRef.current = nextProgress

      if (shouldSyncProgressState(previousProgress, nextProgress, showDebugBoundaries)) {
        setProgress(nextProgress)
      }
    },
    [displayedHeadings, showDebugBoundaries],
  )

  const measureProgress = useCallback(() => {
    const articleElement = document.querySelector<HTMLElement>('[data-post-reading-root]')

    if (!articleElement) {
      return false
    }

    const currentScrollY = window.scrollY
    const scrollDelta = currentScrollY - lastScrollYRef.current

    if (Math.abs(scrollDelta) > 0.5) {
      scrollDirectionRef.current = scrollDelta > 0 ? 1 : -1
    }

    lastScrollYRef.current = currentScrollY

    const articleRect = articleElement.getBoundingClientRect()
    const articleTop = currentScrollY + articleRect.top
    const articleBottom = currentScrollY + articleRect.bottom
    const articleHeight = Math.max(articleBottom - articleTop, 1)
    const viewportTop = currentScrollY + readingOffsets.top
    const viewportBottom = currentScrollY + window.innerHeight - readingOffsets.bottom
    const visibleStartPercent = clamp(((viewportTop - articleTop) / articleHeight) * 100, 0, 100)
    const visibleEndPercent = clamp(((viewportBottom - articleTop) / articleHeight) * 100, 0, 100)

    const headingTops = displayedHeadings.map((heading) => {
      const headingElement = document.getElementById(heading.id)

      if (!headingElement) {
        return articleTop
      }

      return currentScrollY + headingElement.getBoundingClientRect().top
    })

    const visibleHeadingIndexes = headingTops.reduce<number[]>((indexes, headingTop, index) => {
      const nextHeadingTop = headingTops[index + 1] ?? articleBottom

      if (nextHeadingTop >= viewportTop && headingTop <= viewportBottom) {
        indexes.push(index)
      }

      return indexes
    }, [])

    let fallbackIndex = 0

    for (let index = 0; index < headingTops.length; index += 1) {
      if ((headingTops[index] ?? articleTop) <= viewportTop) {
        fallbackIndex = index
      }
    }

    const activeStartIndex = visibleHeadingIndexes[0] ?? fallbackIndex
    const activeEndIndex = visibleHeadingIndexes.at(-1) ?? fallbackIndex
    const tocListElement = tocListRef.current
    let activePathLength = 0.01
    let activePathOffset = 0
    let pathD = ''
    let pathHeight = 1
    let pathLength = 1

    if (tocListElement) {
      const listRect = tocListElement.getBoundingClientRect()
      const headingPoints = displayedHeadings.reduce<TocPoint[]>((points, heading, index) => {
        const itemElement = tocItemRefs.current[heading.id]

        if (!itemElement) {
          return points
        }

        if (shouldSyncTitleOverflowRef.current) {
          syncTitleOverflow(itemElement)
        }

        const itemRect = itemElement.getBoundingClientRect()

        points.push({
          documentY: headingTops[index] ?? articleTop,
          x: getTocX(heading.depth as HeadingLevel, indentScale, trackOverlapScale),
          y: itemRect.top + itemRect.height / 2 - listRect.top,
        })

        return points
      }, [])

      const lastPoint = headingPoints.at(-1)

      if (lastPoint) {
        headingPoints.push({
          documentY: articleBottom,
          x: lastPoint.x,
          y: Math.max(tocListElement.offsetHeight - tocPath.bottomPadding, lastPoint.y + 18),
        })
      }

      const finalPoint = headingPoints.at(-1)

      if (finalPoint) {
        const pathModel = buildPathModel(headingPoints, pathStyle, bendScale)
        const mappedTop = mapDocumentYToPathOffset(
          viewportTop,
          headingPoints,
          pathModel.cumulativeLengths,
        )
        const mappedBottom = mapDocumentYToPathOffset(
          viewportBottom,
          headingPoints,
          pathModel.cumulativeLengths,
        )

        activePathOffset = clamp(Math.min(mappedTop, mappedBottom), 0, pathModel.totalLength)
        activePathLength = clamp(
          Math.abs(mappedBottom - mappedTop),
          0.01,
          Math.max(pathModel.totalLength - activePathOffset, 0.01),
        )
        pathD = pathModel.d
        pathHeight = Math.max(tocListElement.offsetHeight, finalPoint.y + tocPath.bottomPadding)
        pathLength = pathModel.totalLength
      }
    }

    const viewportElement = scrollViewportRef.current
    const scrollDirection = scrollDirectionRef.current
    let shouldContinueMeasuring = false

    if (
      viewportElement &&
      displayedHeadings.length > 0 &&
      viewportElement.scrollHeight > viewportElement.clientHeight
    ) {
      const forwardLead = window.innerHeight * scrollLeadScale
      const trailingLead = window.innerHeight * Math.min(scrollLeadScale * 0.34, 0.22)
      const guideTop = scrollDirection > 0 ? viewportTop - trailingLead : viewportTop - forwardLead
      const guideBottom =
        scrollDirection > 0 ? viewportBottom + forwardLead : viewportBottom + trailingLead
      const guidedHeadingIndexes = headingTops.reduce<number[]>((indexes, headingTop, index) => {
        const nextHeadingTop = headingTops[index + 1] ?? articleBottom

        if (nextHeadingTop >= guideTop && headingTop <= guideBottom) {
          indexes.push(index)
        }

        return indexes
      }, [])
      const targetStartIndex = guidedHeadingIndexes[0] ?? activeStartIndex
      const targetEndIndex = guidedHeadingIndexes.at(-1) ?? activeEndIndex
      const startHeading = displayedHeadings[targetStartIndex]
      const endHeading = displayedHeadings[targetEndIndex] ?? startHeading
      const startItem = startHeading ? tocItemRefs.current[startHeading.id] : null
      const endItem = endHeading ? tocItemRefs.current[endHeading.id] : startItem

      if (startItem && endItem) {
        const rangeTop = Math.min(startItem.offsetTop, endItem.offsetTop)
        const rangeBottom = Math.max(
          startItem.offsetTop + startItem.offsetHeight,
          endItem.offsetTop + endItem.offsetHeight,
        )
        const viewportHeight = viewportElement.clientHeight
        const maxScrollTop = viewportElement.scrollHeight - viewportHeight
        const edgePadding = viewportHeight * clamp(scrollLeadScale * 0.34, 0.08, 0.24)
        const isGuidingToStart = targetStartIndex <= 0
        const isGuidingToEnd = targetEndIndex >= displayedHeadings.length - 1
        const rawTargetTop =
          scrollDirection > 0
            ? isGuidingToEnd
              ? maxScrollTop
              : rangeBottom - viewportHeight + edgePadding
            : isGuidingToStart
              ? 0
              : rangeTop - edgePadding
        const targetTop = clamp(rawTargetTop, 0, maxScrollTop)
        const currentTop = viewportElement.scrollTop
        const distance = targetTop - currentTop
        const followStrength = clamp(0.58 + Math.abs(scrollDelta) / 520, 0.58, 0.9)
        const nextTop =
          Math.abs(distance) < 0.75 ? targetTop : currentTop + distance * followStrength

        if (Math.abs(nextTop - currentTop) > 0.1) {
          viewportElement.scrollTop = nextTop
        }

        shouldContinueMeasuring = Math.abs(targetTop - nextTop) > 0.75
      }
    }

    if (shouldSyncTitleOverflowRef.current) {
      shouldSyncTitleOverflowRef.current = false
    }

    paintProgress({
      activeEndIndex,
      activePathLength,
      activePathOffset,
      activeStartIndex,
      debugBottomOffset: readingOffsets.bottom,
      debugTopOffset: readingOffsets.top,
      pathD,
      pathHeight,
      pathLength,
      pathWidth:
        tocPath.width + Math.max(indentScale - 1, 0) * tocPath.depthX * 2 + trackOverlapScale * 16,
      visibleEndPercent,
      visibleStartPercent,
    })

    return shouldContinueMeasuring
  }, [
    bendScale,
    displayedHeadings,
    indentScale,
    paintProgress,
    pathStyle,
    scrollLeadScale,
    trackOverlapScale,
  ])

  useLayoutEffect(() => {
    let animationFrame = 0

    const requestMeasure = () => {
      if (animationFrame) {
        return
      }

      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = 0

        if (measureProgress()) {
          requestMeasure()
        }
      })
    }

    const requestLayoutMeasure = () => {
      shouldSyncTitleOverflowRef.current = true
      requestMeasure()
    }

    const resizeObserver = new ResizeObserver(requestLayoutMeasure)
    const articleElement = document.querySelector<HTMLElement>('[data-post-reading-root]')

    if (articleElement) {
      resizeObserver.observe(articleElement)
    }

    if (tocListRef.current) {
      resizeObserver.observe(tocListRef.current)
    }

    shouldSyncTitleOverflowRef.current = true
    lastScrollYRef.current = window.scrollY
    window.addEventListener('scroll', requestMeasure, { passive: true })
    window.addEventListener('resize', requestLayoutMeasure)
    document.fonts.ready.then(requestLayoutMeasure).catch(() => undefined)
    requestLayoutMeasure()

    return () => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame)
      }

      resizeObserver.disconnect()
      window.removeEventListener('scroll', requestMeasure)
      window.removeEventListener('resize', requestLayoutMeasure)
    }
  }, [measureProgress])

  return {
    activePathRef,
    mobileProgressRef,
    mobileVisibleEndPercentRef,
    progress,
    progressSvgRef,
    scrollViewportRef,
    tocItemRefs,
    tocListRef,
    trackPathRef,
    visibleEndPercentRef,
  }
}
