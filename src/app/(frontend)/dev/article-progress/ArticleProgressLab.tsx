'use client'

import type { CSSProperties } from 'react'
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import type { MarkdownHeading } from '@/lib/markdown-headings'

type HeadingLevel = 2 | 3 | 4
type PathStyle = 'stepped' | 'rounded' | 'flow' | 'diagonal'
type LineWeight = 'fine' | 'regular' | 'strong'
type RailHeight = 'compact' | 'regular' | 'tall'
type ScrollDirection = -1 | 1

type TocPoint = {
  documentY: number
  x: number
  y: number
}

type PathModel = {
  cumulativeLengths: number[]
  d: string
  totalLength: number
}

type ReadingProgress = {
  activeEndIndex: number
  activePathLength: number
  activePathOffset: number
  activeStartIndex: number
  debugBottomOffset: number
  debugTopOffset: number
  pathD: string
  pathHeight: number
  pathLength: number
  pathWidth: number
  visibleEndPercent: number
  visibleStartPercent: number
}

type ArticleProgressLabProps = {
  headings: MarkdownHeading[]
  label: string
  progressLabel: string
}

const readingOffsets = {
  bottom: 48,
  top: 96,
}

const tocPath = {
  bottomPadding: 10,
  depthX: 12,
  startX: 10,
  width: 52,
}

const headingLevelOptions: { label: string; value: HeadingLevel }[] = [
  { label: 'H2', value: 2 },
  { label: 'H3', value: 3 },
  { label: 'H4', value: 4 },
]

const pathStyleOptions: { label: string; value: PathStyle }[] = [
  { label: '直角', value: 'stepped' },
  { label: '圆角', value: 'rounded' },
  { label: '曲线', value: 'flow' },
  { label: '斜切', value: 'diagonal' },
]

const lineWeightOptions: { label: string; value: LineWeight }[] = [
  { label: '细', value: 'fine' },
  { label: '中', value: 'regular' },
  { label: '强', value: 'strong' },
]

const railHeightOptions: { label: string; value: RailHeight }[] = [
  { label: '低', value: 'compact' },
  { label: '中', value: 'regular' },
  { label: '高', value: 'tall' },
]

const railHeightValues: Record<RailHeight, string> = {
  compact: 'min(42vh, 22rem)',
  regular: 'min(58vh, 30rem)',
  tall: 'min(74vh, 40rem)',
}

const initialProgress: ReadingProgress = {
  activeEndIndex: 0,
  activePathLength: 0.01,
  activePathOffset: 0,
  activeStartIndex: 0,
  debugBottomOffset: readingOffsets.bottom,
  debugTopOffset: readingOffsets.top,
  pathD: '',
  pathHeight: 1,
  pathLength: 1,
  pathWidth: tocPath.width,
  visibleEndPercent: 0,
  visibleStartPercent: 0,
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`
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

function getTocX(level: HeadingLevel, indentScale: number) {
  return tocPath.startX + (level - 2) * tocPath.depthX * indentScale
}

function getRoundedCornerRadius(startPoint: TocPoint, endPoint: TocPoint) {
  return Math.min(
    7,
    Math.abs(endPoint.x - startPoint.x) / 2,
    Math.abs(endPoint.y - startPoint.y) / 4,
  )
}

function getCubicPoint(
  startPoint: TocPoint,
  controlPointA: TocPoint,
  controlPointB: TocPoint,
  endPoint: TocPoint,
  progress: number,
) {
  const inverseProgress = 1 - progress

  return {
    x:
      inverseProgress ** 3 * startPoint.x +
      3 * inverseProgress ** 2 * progress * controlPointA.x +
      3 * inverseProgress * progress ** 2 * controlPointB.x +
      progress ** 3 * endPoint.x,
    y:
      inverseProgress ** 3 * startPoint.y +
      3 * inverseProgress ** 2 * progress * controlPointA.y +
      3 * inverseProgress * progress ** 2 * controlPointB.y +
      progress ** 3 * endPoint.y,
  }
}

function getFlowSegmentLength(startPoint: TocPoint, endPoint: TocPoint) {
  const verticalDistance = endPoint.y - startPoint.y
  const controlPointA = { ...startPoint, y: startPoint.y + verticalDistance * 0.42 }
  const controlPointB = { ...endPoint, y: endPoint.y - verticalDistance * 0.42 }
  let length = 0
  let previousPoint = startPoint

  for (let step = 1; step <= 12; step += 1) {
    const point = getCubicPoint(startPoint, controlPointA, controlPointB, endPoint, step / 12)

    length += Math.hypot(point.x - previousPoint.x, point.y - previousPoint.y)
    previousPoint = { ...point, documentY: startPoint.documentY }
  }

  return length
}

function getSegmentLength(startPoint: TocPoint, endPoint: TocPoint, pathStyle: PathStyle) {
  const horizontalDistance = Math.abs(endPoint.x - startPoint.x)
  const verticalDistance = Math.abs(endPoint.y - startPoint.y)

  if (pathStyle === 'diagonal') {
    return Math.hypot(horizontalDistance, verticalDistance)
  }

  if (pathStyle === 'flow') {
    return getFlowSegmentLength(startPoint, endPoint)
  }

  if (pathStyle === 'rounded') {
    const radius = getRoundedCornerRadius(startPoint, endPoint)

    if (radius === 0) {
      return verticalDistance
    }

    return (
      Math.max(verticalDistance - radius * 2, 0) +
      Math.max(horizontalDistance - radius * 2, 0) +
      Math.PI * radius
    )
  }

  return horizontalDistance + verticalDistance
}

function buildSegmentPath(startPoint: TocPoint, endPoint: TocPoint, pathStyle: PathStyle) {
  if (pathStyle === 'diagonal') {
    return `L ${endPoint.x} ${endPoint.y}`
  }

  if (pathStyle === 'flow') {
    const verticalDistance = endPoint.y - startPoint.y

    return `C ${startPoint.x} ${startPoint.y + verticalDistance * 0.42} ${endPoint.x} ${
      endPoint.y - verticalDistance * 0.42
    } ${endPoint.x} ${endPoint.y}`
  }

  const midpointY = (startPoint.y + endPoint.y) / 2

  if (pathStyle === 'rounded') {
    const radius = getRoundedCornerRadius(startPoint, endPoint)
    const xDirection = Math.sign(endPoint.x - startPoint.x)
    const yDirection = Math.sign(endPoint.y - startPoint.y) || 1

    if (radius === 0 || xDirection === 0) {
      return `L ${endPoint.x} ${endPoint.y}`
    }

    return [
      `L ${startPoint.x} ${midpointY - yDirection * radius}`,
      `Q ${startPoint.x} ${midpointY} ${startPoint.x + xDirection * radius} ${midpointY}`,
      `L ${endPoint.x - xDirection * radius} ${midpointY}`,
      `Q ${endPoint.x} ${midpointY} ${endPoint.x} ${midpointY + yDirection * radius}`,
      `L ${endPoint.x} ${endPoint.y}`,
    ].join(' ')
  }

  return `L ${startPoint.x} ${midpointY} L ${endPoint.x} ${midpointY} L ${endPoint.x} ${endPoint.y}`
}

function buildPathModel(points: TocPoint[], pathStyle: PathStyle): PathModel {
  const firstPoint = points[0]

  if (!firstPoint) {
    return { cumulativeLengths: [], d: '', totalLength: 1 }
  }

  let totalLength = 0
  const cumulativeLengths = [0]
  const d = points.slice(1).reduce((path, point, index) => {
    const previousPoint = points[index]

    if (!previousPoint) {
      return path
    }

    totalLength += getSegmentLength(previousPoint, point, pathStyle)
    cumulativeLengths.push(totalLength)

    return `${path} ${buildSegmentPath(previousPoint, point, pathStyle)}`
  }, `M ${firstPoint.x} ${firstPoint.y}`)

  return {
    cumulativeLengths,
    d,
    totalLength: Math.max(totalLength, 1),
  }
}

function getHeadingState(index: number, activeStartIndex: number, activeEndIndex: number) {
  if (index >= activeStartIndex && index <= activeEndIndex) {
    return 'current'
  }

  if (index < activeStartIndex) {
    return 'read'
  }

  return 'upcoming'
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

function mapDocumentYToPathOffset(
  documentY: number,
  points: TocPoint[],
  cumulativeLengths: number[],
) {
  const firstPoint = points[0]
  const lastPoint = points.at(-1)
  const finalLength = cumulativeLengths.at(-1) ?? 0

  if (!firstPoint || !lastPoint) {
    return 0
  }

  if (documentY <= firstPoint.documentY) {
    return 0
  }

  for (let index = 0; index < points.length - 1; index += 1) {
    const startPoint = points[index]
    const endPoint = points[index + 1]

    if (!startPoint || !endPoint) {
      continue
    }

    if (documentY <= endPoint.documentY) {
      const sectionHeight = Math.max(endPoint.documentY - startPoint.documentY, 1)
      const progress = clamp((documentY - startPoint.documentY) / sectionHeight, 0, 1)
      const startLength = cumulativeLengths[index] ?? 0
      const endLength = cumulativeLengths[index + 1] ?? startLength

      return startLength + (endLength - startLength) * progress
    }
  }

  return finalLength
}

export function ArticleProgressLab(props: ArticleProgressLabProps) {
  const { headings, label, progressLabel } = props
  const scrollViewportRef = useRef<HTMLElement | null>(null)
  const tocItemRefs = useRef<Record<string, HTMLLIElement | null>>({})
  const tocListRef = useRef<HTMLOListElement | null>(null)
  const progressSvgRef = useRef<SVGSVGElement | null>(null)
  const trackPathRef = useRef<SVGPathElement | null>(null)
  const activePathRef = useRef<SVGPathElement | null>(null)
  const visibleEndPercentRef = useRef<HTMLSpanElement | null>(null)
  const progressRef = useRef<ReadingProgress>(initialProgress)
  const paintedRangeRef = useRef({ activeEndIndex: -1, activeStartIndex: -1, pathD: '' })
  const shouldSyncTitleOverflowRef = useRef(true)
  const lastScrollYRef = useRef(0)
  const scrollDirectionRef = useRef<ScrollDirection>(1)
  const [progress, setProgress] = useState<ReadingProgress>(initialProgress)
  const [pathStyle, setPathStyle] = useState<PathStyle>('rounded')
  const [lineWeight, setLineWeight] = useState<LineWeight>('regular')
  const [railHeight, setRailHeight] = useState<RailHeight>('regular')
  const [indentScale, setIndentScale] = useState(1)
  const [spacingScale, setSpacingScale] = useState(0.72)
  const [scrollLeadScale, setScrollLeadScale] = useState(0.46)
  const [visibleHeadingLevels, setVisibleHeadingLevels] = useState<Record<HeadingLevel, boolean>>({
    2: true,
    3: true,
    4: true,
  })
  const [showDebugBoundaries, setShowDebugBoundaries] = useState(false)

  const displayedHeadings = useMemo(
    () => headings.filter((heading) => visibleHeadingLevels[heading.depth as HeadingLevel]),
    [headings, visibleHeadingLevels],
  )

  const toggleHeadingLevel = useCallback((level: HeadingLevel) => {
    setVisibleHeadingLevels((currentLevels) => {
      const enabledLevels = headingLevelOptions.filter((option) => currentLevels[option.value])

      if (currentLevels[level] && enabledLevels.length === 1) {
        return currentLevels
      }

      return {
        ...currentLevels,
        [level]: !currentLevels[level],
      }
    })
  }, [])

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
          x: getTocX(heading.depth as HeadingLevel, indentScale),
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
        const pathModel = buildPathModel(headingPoints, pathStyle)
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
      pathWidth: tocPath.width + Math.max(indentScale - 1, 0) * tocPath.depthX * 2,
      visibleEndPercent,
      visibleStartPercent,
    })

    return shouldContinueMeasuring
  }, [displayedHeadings, indentScale, paintProgress, pathStyle, scrollLeadScale])

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

  const activeLabel = useMemo(() => {
    const startHeading = displayedHeadings[progress.activeStartIndex]
    const endHeading = displayedHeadings[progress.activeEndIndex]

    if (!startHeading || !endHeading) {
      return '准备测量'
    }

    if (startHeading.id === endHeading.id) {
      return startHeading.text
    }

    return `${startHeading.text} → ${endHeading.text}`
  }, [displayedHeadings, progress.activeEndIndex, progress.activeStartIndex])

  const readingRangeLabel = `${formatPercent(progress.visibleStartPercent)}–${formatPercent(progress.visibleEndPercent)}`

  if (displayedHeadings.length === 0) {
    return null
  }

  return (
    <>
      {showDebugBoundaries ? (
        <div aria-hidden="true" className="dev-progress-debug-boundaries">
          <span
            className="dev-progress-debug-boundary dev-progress-debug-boundary--top"
            style={{ top: `${progress.debugTopOffset}px` }}
          >
            <span>Top boundary · {progress.debugTopOffset}px</span>
          </span>
          <span
            className="dev-progress-debug-boundary dev-progress-debug-boundary--bottom"
            style={{ bottom: `${progress.debugBottomOffset}px` }}
          >
            <span>Bottom boundary · {progress.debugBottomOffset}px</span>
          </span>
        </div>
      ) : null}

      <div aria-label="进度条配置" className="dev-progress-floating-controls">
        <div className="dev-progress-floating-controls__header">Progress lab</div>

        <div className="dev-progress-floating-controls__row">
          <span className="dev-progress-floating-controls__label">层级</span>
          <div
            className="dev-progress-floating-controls__buttons"
            role="group"
            aria-label="显示的 heading 层级"
          >
            {headingLevelOptions.map((option) => (
              <Button
                aria-pressed={visibleHeadingLevels[option.value]}
                key={option.value}
                onClick={() => {
                  toggleHeadingLevel(option.value)
                }}
                size="xs"
                type="button"
                variant={visibleHeadingLevels[option.value] ? 'secondary' : 'outline'}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="dev-progress-floating-controls__row">
          <span className="dev-progress-floating-controls__label">线型</span>
          <div
            className="dev-progress-floating-controls__buttons"
            role="group"
            aria-label="折线样式"
          >
            {pathStyleOptions.map((option) => (
              <Button
                aria-pressed={pathStyle === option.value}
                key={option.value}
                onClick={() => {
                  setPathStyle(option.value)
                }}
                size="xs"
                type="button"
                variant={pathStyle === option.value ? 'secondary' : 'outline'}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="dev-progress-floating-controls__row">
          <span className="dev-progress-floating-controls__label">高度</span>
          <div
            className="dev-progress-floating-controls__buttons"
            role="group"
            aria-label="目录高度"
          >
            {railHeightOptions.map((option) => (
              <Button
                aria-pressed={railHeight === option.value}
                key={option.value}
                onClick={() => {
                  setRailHeight(option.value)
                }}
                size="xs"
                type="button"
                variant={railHeight === option.value ? 'secondary' : 'outline'}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="dev-progress-floating-controls__row">
          <label className="dev-progress-floating-controls__label" htmlFor="dev-progress-indent">
            缩进
          </label>
          <div className="dev-progress-floating-controls__range">
            <input
              aria-label="目录线缩进程度"
              id="dev-progress-indent"
              max="1.8"
              min="0.55"
              onChange={(event) => {
                setIndentScale(Number(event.currentTarget.value))
              }}
              step="0.01"
              type="range"
              value={indentScale}
            />
            <span>{indentScale.toFixed(2)}</span>
          </div>
        </div>

        <div className="dev-progress-floating-controls__row">
          <label className="dev-progress-floating-controls__label" htmlFor="dev-progress-spacing">
            间距
          </label>
          <div className="dev-progress-floating-controls__range">
            <input
              aria-label="目录层级间距"
              id="dev-progress-spacing"
              max="1.35"
              min="0.35"
              onChange={(event) => {
                setSpacingScale(Number(event.currentTarget.value))
              }}
              step="0.01"
              type="range"
              value={spacingScale}
            />
            <span>{spacingScale.toFixed(2)}</span>
          </div>
        </div>

        <div className="dev-progress-floating-controls__row">
          <label className="dev-progress-floating-controls__label" htmlFor="dev-progress-lead">
            预留
          </label>
          <div className="dev-progress-floating-controls__range">
            <input
              aria-label="目录自动滚动预留量"
              id="dev-progress-lead"
              max="0.8"
              min="0.12"
              onChange={(event) => {
                setScrollLeadScale(Number(event.currentTarget.value))
              }}
              step="0.01"
              type="range"
              value={scrollLeadScale}
            />
            <span>{scrollLeadScale.toFixed(2)}</span>
          </div>
        </div>

        <div className="dev-progress-floating-controls__row">
          <span className="dev-progress-floating-controls__label">粗细</span>
          <div
            className="dev-progress-floating-controls__buttons"
            role="group"
            aria-label="线条强度"
          >
            {lineWeightOptions.map((option) => (
              <Button
                aria-pressed={lineWeight === option.value}
                key={option.value}
                onClick={() => {
                  setLineWeight(option.value)
                }}
                size="xs"
                type="button"
                variant={lineWeight === option.value ? 'secondary' : 'outline'}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <Button
          aria-pressed={showDebugBoundaries}
          className="dev-progress-floating-controls__debug"
          onClick={() => {
            setShowDebugBoundaries((isVisible) => !isVisible)
          }}
          size="xs"
          type="button"
          variant={showDebugBoundaries ? 'secondary' : 'outline'}
        >
          {showDebugBoundaries ? '隐藏边界' : '显示边界'}
        </Button>

        {showDebugBoundaries ? (
          <div className="dev-progress-floating-controls__meta">
            <span>{readingRangeLabel}</span>
            <span>{activeLabel}</span>
          </div>
        ) : null}
      </div>

      <section
        className="dev-progress-rail"
        data-toc-rail=""
        style={
          {
            '--toc-panel-height': railHeightValues[railHeight],
            '--toc-spacing-scale': spacingScale,
          } as CSSProperties
        }
      >
        <div className="dev-progress-rail__header">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="section-kicker">{progressLabel}</p>
            <h2 className="font-serif text-xl tracking-[-0.02em] text-foreground">{label}</h2>
          </div>
          <span
            className="shrink-0 text-[11px] uppercase tracking-[0.22em] text-muted-foreground"
            ref={visibleEndPercentRef}
          >
            {formatPercent(progress.visibleEndPercent)}
          </span>
        </div>

        <nav
          aria-label={label}
          className="dev-progress-map"
          data-path-style={pathStyle}
          data-weight={lineWeight}
          ref={scrollViewportRef}
        >
          <div className="dev-progress-map__content">
            <svg
              aria-hidden="true"
              className="dev-progress-map__track"
              height={progress.pathHeight}
              ref={progressSvgRef}
              viewBox={`0 0 ${progress.pathWidth} ${progress.pathHeight}`}
              width={progress.pathWidth}
            >
              <path className="dev-progress-map__path" ref={trackPathRef} />
              <path
                className="dev-progress-map__path dev-progress-map__path--active"
                ref={activePathRef}
              />
            </svg>

            <ol ref={tocListRef}>
              {displayedHeadings.map((heading, index) => {
                const state = getHeadingState(
                  index,
                  progress.activeStartIndex,
                  progress.activeEndIndex,
                )

                return (
                  <li
                    className="dev-progress-map__item"
                    data-level={heading.depth}
                    data-state={state}
                    key={heading.id}
                    ref={(node) => {
                      tocItemRefs.current[heading.id] = node
                    }}
                    style={
                      {
                        '--toc-depth': heading.depth - 2,
                        '--toc-depth-indent': `${(heading.depth - 2) * 0.82 * indentScale}rem`,
                      } as CSSProperties
                    }
                  >
                    <a
                      aria-current={state === 'current' ? 'location' : undefined}
                      className="dev-progress-map__link"
                      href={`#${heading.id}`}
                      title={heading.text}
                    >
                      <span className="dev-progress-map__title">
                        <span className="dev-progress-map__title-text">{heading.text}</span>
                      </span>
                      <span className="dev-progress-map__level">H{heading.depth}</span>
                    </a>
                  </li>
                )
              })}
            </ol>
          </div>
        </nav>
      </section>
    </>
  )
}
