import type { MarkdownHeading } from '@/features/article/model/markdown-headings'

export type HeadingLevel = 2 | 3 | 4
export type PathStyle = 'stepped' | 'rounded' | 'flow' | 'diagonal'
export type LineWeight = 'fine' | 'regular' | 'strong'
export type RailHeight = 'compact' | 'regular' | 'tall'
export type ScrollDirection = -1 | 1
export type MobileTocVariant = 'right-rail' | 'bottom-strip' | 'sheet-map'

export type TocPoint = {
  documentY: number
  x: number
  y: number
}

export type PathModel = {
  cumulativeLengths: number[]
  d: string
  totalLength: number
}

export type ReadingProgress = {
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

export type MobileTocSegment = {
  centerPercent: number
  endPercent: number
  heading: MarkdownHeading
  sizePercent: number
  startPercent: number
}

export type BuildMobileTocSegmentsArgs = {
  articleBottom: number
  articleTop: number
  headingTops: number[]
  headings: MarkdownHeading[]
}

export const readingOffsets = {
  bottom: 48,
  top: 96,
}

export const tocPath = {
  bottomPadding: 10,
  depthX: 12,
  minX: 6,
  rightPadding: 18,
  startX: 10,
  titleDepthX: 13.2,
  titleStartX: 36,
  width: 76,
}

export const tocTrackOffset = {
  defaultLockedPx: 22,
  maxLockedPx: 30,
  minLockedPx: 10,
}

export const headingLevelOptions: { label: string; value: HeadingLevel }[] = [
  { label: 'H2', value: 2 },
  { label: 'H3', value: 3 },
  { label: 'H4', value: 4 },
]

export const pathStyleOptions: { label: string; value: PathStyle }[] = [
  { label: '直角', value: 'stepped' },
  { label: '软折', value: 'rounded' },
  { label: '曲线', value: 'flow' },
  { label: '斜切', value: 'diagonal' },
]

export const lineWeightOptions: { label: string; value: LineWeight }[] = [
  { label: '细', value: 'fine' },
  { label: '中', value: 'regular' },
  { label: '强', value: 'strong' },
]

export const railHeightOptions: { label: string; value: RailHeight }[] = [
  { label: '低', value: 'compact' },
  { label: '中', value: 'regular' },
  { label: '高', value: 'tall' },
]

export const mobileTocVariantOptions: { label: string; value: MobileTocVariant }[] = [
  { label: '右轨', value: 'right-rail' },
  { label: '底条', value: 'bottom-strip' },
  { label: '抽屉', value: 'sheet-map' },
]

export const railHeightValues: Record<RailHeight, string> = {
  compact: 'min(42vh, 22rem)',
  regular: 'min(58vh, 30rem)',
  tall: 'min(74vh, 40rem)',
}

export const initialProgress: ReadingProgress = {
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

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`
}

export function buildMobileTocSegments(args: BuildMobileTocSegmentsArgs): MobileTocSegment[] {
  const { articleBottom, articleTop, headingTops, headings } = args

  if (headings.length === 0) {
    return []
  }

  const articleHeight = Math.max(articleBottom - articleTop, 1)
  const fallbackSpan = 100 / headings.length

  return headings.map((heading, index) => {
    const rawStart = headingTops[index]
    const rawEnd = headingTops[index + 1] ?? articleBottom
    const fallbackStartPercent = fallbackSpan * index
    const fallbackEndPercent = index === headings.length - 1 ? 100 : fallbackSpan * (index + 1)
    const startPercent =
      typeof rawStart === 'number' && Number.isFinite(rawStart)
        ? clamp(((rawStart - articleTop) / articleHeight) * 100, 0, 100)
        : fallbackStartPercent
    const endPercent =
      typeof rawEnd === 'number' && Number.isFinite(rawEnd)
        ? clamp(((rawEnd - articleTop) / articleHeight) * 100, startPercent, 100)
        : fallbackEndPercent
    const sizePercent = Math.max(endPercent - startPercent, 0)

    return {
      centerPercent: startPercent + sizePercent / 2,
      endPercent,
      heading,
      sizePercent,
      startPercent,
    }
  })
}

export function buildEqualMobileTocSegments(headings: MarkdownHeading[]): MobileTocSegment[] {
  return buildMobileTocSegments({
    articleBottom: headings.length || 1,
    articleTop: 0,
    headingTops: headings.map((_, index) => index),
    headings,
  })
}

export function resolveMobileTocSegmentByRatio(
  segments: MobileTocSegment[],
  ratio: number,
): MobileTocSegment | null {
  if (segments.length === 0) {
    return null
  }

  const percent = clamp(ratio * 100, 0, 100)

  return (
    segments.find((segment) => percent >= segment.startPercent && percent <= segment.endPercent) ??
    segments.reduce((nearestSegment, segment) => {
      const nearestDistance = Math.abs(nearestSegment.centerPercent - percent)
      const segmentDistance = Math.abs(segment.centerPercent - percent)

      return segmentDistance < nearestDistance ? segment : nearestSegment
    }, segments[0] as MobileTocSegment)
  )
}

export function getTocX(level: HeadingLevel, indentScale: number, trackOverlapScale: number) {
  const depth = level - 2
  const gutterX = tocPath.startX + depth * tocPath.depthX * indentScale

  if (depth <= 0) {
    return gutterX
  }

  const titleEdgeX = tocPath.titleStartX + depth * tocPath.titleDepthX * indentScale - 4
  const overlapWeight = trackOverlapScale * (depth / 2)

  return gutterX + (titleEdgeX - gutterX) * overlapWeight
}

export function getTocTitleStartX(level: HeadingLevel, indentScale: number) {
  const depth = level - 2

  return tocPath.titleStartX + depth * tocPath.titleDepthX * indentScale
}

export function getTocTrackX(args: {
  indentScale: number
  isTrackOffsetLocked: boolean
  level: HeadingLevel
  lockedTrackOffsetPx: number
  titleLeftX?: null | number
  trackOverlapScale: number
}) {
  const {
    indentScale,
    isTrackOffsetLocked,
    level,
    lockedTrackOffsetPx,
    titleLeftX,
    trackOverlapScale,
  } = args

  if (!isTrackOffsetLocked) {
    return getTocX(level, indentScale, trackOverlapScale)
  }

  const resolvedTitleLeftX =
    typeof titleLeftX === 'number' && Number.isFinite(titleLeftX)
      ? titleLeftX
      : getTocTitleStartX(level, indentScale)

  return Math.max(resolvedTitleLeftX - lockedTrackOffsetPx, tocPath.minX)
}

export function getTocPathWidth(
  points: TocPoint[],
  indentScale: number,
  trackOverlapScale: number,
) {
  const baselineWidth =
    tocPath.width + Math.max(indentScale - 1, 0) * tocPath.depthX * 2 + trackOverlapScale * 16
  const widestPointX = points.reduce((width, point) => Math.max(width, point.x), baselineWidth)

  return Math.ceil(widestPointX + tocPath.rightPadding)
}

function getRoundedCornerRadius(startPoint: TocPoint, endPoint: TocPoint, bendScale: number) {
  const horizontalDistance = Math.abs(endPoint.x - startPoint.x)
  const verticalDistance = Math.abs(endPoint.y - startPoint.y)
  const maximumRadius = Math.min(18, horizontalDistance / 2, verticalDistance / 2.4)

  return maximumRadius * clamp(bendScale, 0, 1)
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

function getFlowSegmentLength(startPoint: TocPoint, endPoint: TocPoint, bendScale: number) {
  const verticalDistance = endPoint.y - startPoint.y
  const controlWeight = 0.2 + clamp(bendScale, 0, 1) * 0.34
  const controlPointA = { ...startPoint, y: startPoint.y + verticalDistance * controlWeight }
  const controlPointB = { ...endPoint, y: endPoint.y - verticalDistance * controlWeight }
  let length = 0
  let previousPoint = startPoint

  for (let step = 1; step <= 12; step += 1) {
    const point = getCubicPoint(startPoint, controlPointA, controlPointB, endPoint, step / 12)

    length += Math.hypot(point.x - previousPoint.x, point.y - previousPoint.y)
    previousPoint = { ...point, documentY: startPoint.documentY }
  }

  return length
}

function getSegmentLength(
  startPoint: TocPoint,
  endPoint: TocPoint,
  pathStyle: PathStyle,
  bendScale: number,
) {
  const horizontalDistance = Math.abs(endPoint.x - startPoint.x)
  const verticalDistance = Math.abs(endPoint.y - startPoint.y)

  if (pathStyle === 'diagonal') {
    return Math.hypot(horizontalDistance, verticalDistance)
  }

  if (pathStyle === 'flow') {
    return getFlowSegmentLength(startPoint, endPoint, bendScale)
  }

  if (pathStyle === 'rounded') {
    const radius = getRoundedCornerRadius(startPoint, endPoint, bendScale)

    if (radius === 0) {
      return horizontalDistance + verticalDistance
    }

    return (
      Math.max(verticalDistance - radius * 2, 0) +
      Math.max(horizontalDistance - radius * 2, 0) +
      Math.PI * radius
    )
  }

  return horizontalDistance + verticalDistance
}

function buildSegmentPath(
  startPoint: TocPoint,
  endPoint: TocPoint,
  pathStyle: PathStyle,
  bendScale: number,
) {
  if (pathStyle === 'diagonal') {
    return `L ${endPoint.x} ${endPoint.y}`
  }

  if (pathStyle === 'flow') {
    const verticalDistance = endPoint.y - startPoint.y
    const controlWeight = 0.2 + clamp(bendScale, 0, 1) * 0.34

    return `C ${startPoint.x} ${startPoint.y + verticalDistance * controlWeight} ${endPoint.x} ${
      endPoint.y - verticalDistance * controlWeight
    } ${endPoint.x} ${endPoint.y}`
  }

  const midpointY = (startPoint.y + endPoint.y) / 2

  if (pathStyle === 'rounded') {
    const radius = getRoundedCornerRadius(startPoint, endPoint, bendScale)
    const xDirection = Math.sign(endPoint.x - startPoint.x)
    const yDirection = Math.sign(endPoint.y - startPoint.y) || 1

    if (xDirection === 0) {
      return `L ${endPoint.x} ${endPoint.y}`
    }

    if (radius === 0) {
      return `L ${startPoint.x} ${midpointY} L ${endPoint.x} ${midpointY} L ${endPoint.x} ${endPoint.y}`
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

export function buildPathModel(
  points: TocPoint[],
  pathStyle: PathStyle,
  bendScale: number,
): PathModel {
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

    totalLength += getSegmentLength(previousPoint, point, pathStyle, bendScale)
    cumulativeLengths.push(totalLength)

    return `${path} ${buildSegmentPath(previousPoint, point, pathStyle, bendScale)}`
  }, `M ${firstPoint.x} ${firstPoint.y}`)

  return {
    cumulativeLengths,
    d,
    totalLength: Math.max(totalLength, 1),
  }
}

export function getHeadingState(index: number, activeStartIndex: number, activeEndIndex: number) {
  if (index >= activeStartIndex && index <= activeEndIndex) {
    return 'current'
  }

  if (index < activeStartIndex) {
    return 'read'
  }

  return 'upcoming'
}

export function mapDocumentYToPathOffset(
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
