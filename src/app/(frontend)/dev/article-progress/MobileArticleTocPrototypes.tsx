'use client'

import type { CSSProperties, PointerEvent, RefObject } from 'react'
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { BookOpenIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import type { MarkdownHeading } from '@/features/article/model/markdown-headings'

import {
  buildEqualMobileTocSegments,
  buildMobileTocSegments,
  clamp,
  formatPercent,
  resolveMobileTocSegmentByRatio,
  type MobileTocSegment,
  type MobileTocVariant,
  type ReadingProgress,
} from './articleProgressModel'

type MobileArticleTocPrototypesProps = {
  activeHeadingID: string
  headings: MarkdownHeading[]
  label: string
  progress?: Pick<ReadingProgress, 'visibleEndPercent' | 'visibleStartPercent'>
  progressLabel: string
  variant: MobileTocVariant
}

type ScrubOrientation = 'horizontal' | 'vertical'

type ScrubPreview = {
  heading: MarkdownHeading
  percent: number
  x: number
  y: number
}

type MobileTocSegmentStyle = CSSProperties & {
  '--mobile-toc-depth': number
  '--mobile-toc-segment-size': string
  '--mobile-toc-tick-size': string
}

const fallbackProgress = {
  visibleEndPercent: 0,
  visibleStartPercent: 0,
} satisfies Pick<ReadingProgress, 'visibleEndPercent' | 'visibleStartPercent'>

function useMeasuredMobileTocSegments(headings: MarkdownHeading[]) {
  const [segments, setSegments] = useState<MobileTocSegment[]>(() =>
    buildEqualMobileTocSegments(headings),
  )

  useLayoutEffect(() => {
    let frame = 0
    const observedElements: Element[] = []
    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => {
            requestMeasure()
          })

    const measure = () => {
      const articleElement = document.querySelector<HTMLElement>('[data-post-reading-root]')

      if (!articleElement) {
        setSegments(buildEqualMobileTocSegments(headings))
        return
      }

      const articleRect = articleElement.getBoundingClientRect()
      const articleTop = window.scrollY + articleRect.top
      const articleBottom = window.scrollY + articleRect.bottom
      const headingTops = headings.map((heading) => {
        const headingElement = document.getElementById(heading.id)

        if (!headingElement) {
          return Number.NaN
        }

        return window.scrollY + headingElement.getBoundingClientRect().top
      })

      setSegments(
        buildMobileTocSegments({
          articleBottom,
          articleTop,
          headingTops,
          headings,
        }),
      )
    }

    const requestMeasure = () => {
      if (frame) {
        return
      }

      frame = window.requestAnimationFrame(() => {
        frame = 0
        measure()
      })
    }

    const observe = (element: Element | null) => {
      if (!element || !resizeObserver) {
        return
      }

      resizeObserver.observe(element)
      observedElements.push(element)
    }

    const articleElement = document.querySelector<HTMLElement>('[data-post-reading-root]')

    observe(articleElement)
    headings.forEach((heading) => {
      observe(document.getElementById(heading.id))
    })

    window.addEventListener('resize', requestMeasure)
    document.fonts?.ready.then(requestMeasure).catch(() => undefined)
    requestMeasure()

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame)
      }

      observedElements.forEach((element) => {
        resizeObserver?.unobserve(element)
      })
      resizeObserver?.disconnect()
      window.removeEventListener('resize', requestMeasure)
    }
  }, [headings])

  return segments
}

function getPointerRatio(
  event: PointerEvent<HTMLElement>,
  element: HTMLElement,
  orientation: ScrubOrientation,
) {
  const rect = element.getBoundingClientRect()

  if (orientation === 'horizontal') {
    return clamp((event.clientX - rect.left) / Math.max(rect.width, 1), 0, 1)
  }

  return clamp((event.clientY - rect.top) / Math.max(rect.height, 1), 0, 1)
}

function getSegmentStyle(segment: MobileTocSegment, orientation: ScrubOrientation): CSSProperties {
  const minSize = orientation === 'horizontal' ? 1.8 : 1.2
  const sizePercent = Math.max(segment.sizePercent, minSize)
  const depth = segment.heading.depth - 2
  const tickBaseSize = orientation === 'horizontal' ? 0.58 : 0.72
  const tickScale = orientation === 'horizontal' ? 0.034 : 0.041
  const tickMaxSize = orientation === 'horizontal' ? 2.35 : 2.7
  const tickSize = clamp(tickBaseSize + sizePercent * tickScale - depth * 0.08, 0.54, tickMaxSize)
  const axisStyle =
    orientation === 'horizontal'
      ? {
          left: `${segment.startPercent}%`,
          width: `${sizePercent}%`,
        }
      : {
          height: `${sizePercent}%`,
          top: `${segment.startPercent}%`,
        }

  const style: MobileTocSegmentStyle = {
    ...axisStyle,
    '--mobile-toc-depth': depth,
    '--mobile-toc-segment-size': `${sizePercent}%`,
    '--mobile-toc-tick-size': `${tickSize.toFixed(2)}rem`,
  }

  return style
}

function dispatchAnchorNavigation(root: HTMLElement | null, headingID: string) {
  const scopedAnchors = root
    ? Array.from(root.querySelectorAll<HTMLAnchorElement>('[data-mobile-toc-anchor]'))
    : []
  const portalAnchors = Array.from(
    document.querySelectorAll<HTMLAnchorElement>('[data-mobile-toc-anchor]'),
  )
  const anchor = [...scopedAnchors, ...portalAnchors].find(
    (item) => item.dataset.mobileTocAnchor === headingID,
  )

  if (!anchor) {
    return
  }

  anchor.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      button: 0,
      cancelable: true,
    }),
  )
}

function MobileTocPreview(props: { preview: ScrubPreview; variant: MobileTocVariant }) {
  const { preview, variant } = props

  return (
    <div
      className="dev-mobile-toc-preview"
      data-mobile-toc-preview=""
      data-mobile-toc-preview-variant={variant}
      style={
        {
          '--mobile-toc-preview-x': `${preview.x}px`,
          '--mobile-toc-preview-y': `${preview.y}px`,
        } as CSSProperties
      }
    >
      <span>H{preview.heading.depth}</span>
      <strong>{preview.heading.text}</strong>
      <span>{formatPercent(preview.percent)}</span>
    </div>
  )
}

function MobileTocTrack(props: {
  activeHeadingID: string
  className: string
  label: string
  onScrub: (segment: MobileTocSegment) => void
  orientation: ScrubOrientation
  previewHeadingID?: null | string
  progress: Pick<ReadingProgress, 'visibleEndPercent' | 'visibleStartPercent'>
  rootRef: RefObject<HTMLDivElement | null>
  segments: MobileTocSegment[]
  setPreview: (preview: null | ScrubPreview) => void
  variant: MobileTocVariant
}) {
  const {
    activeHeadingID,
    className,
    label,
    onScrub,
    orientation,
    previewHeadingID,
    progress,
    rootRef,
    segments,
    setPreview,
    variant,
  } = props
  const activeSegmentRef = useRef<MobileTocSegment | null>(null)

  const updatePreview = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const ratio = getPointerRatio(event, event.currentTarget, orientation)
      const segment = resolveMobileTocSegmentByRatio(segments, ratio)

      if (!segment) {
        return null
      }

      activeSegmentRef.current = segment
      setPreview({
        heading: segment.heading,
        percent: ratio * 100,
        x: event.clientX,
        y: event.clientY,
      })

      return segment
    },
    [orientation, segments, setPreview],
  )

  return (
    <nav
      aria-label={`${label} mobile ${variant}`}
      className={className}
      data-mobile-toc-track=""
      data-orientation={orientation}
      onPointerCancel={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId)
        }

        setPreview(null)
      }}
      onPointerDown={(event) => {
        if (event.pointerType === 'mouse' && event.button !== 0) {
          return
        }

        event.preventDefault()
        event.currentTarget.setPointerCapture(event.pointerId)
        updatePreview(event)
      }}
      onPointerMove={(event) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
          return
        }

        event.preventDefault()
        updatePreview(event)
      }}
      onPointerUp={(event) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
          return
        }

        event.preventDefault()
        const segment = updatePreview(event) ?? activeSegmentRef.current

        event.currentTarget.releasePointerCapture(event.pointerId)
        setPreview(null)

        if (segment) {
          onScrub(segment)
        }
      }}
      style={
        {
          '--mobile-toc-visible-size': `${Math.max(
            progress.visibleEndPercent - progress.visibleStartPercent,
            1,
          )}%`,
          '--mobile-toc-visible-start': `${progress.visibleStartPercent}%`,
        } as CSSProperties
      }
    >
      <ol>
        {segments.map((segment) => {
          const isActive = segment.heading.id === activeHeadingID
          const isPreviewed = segment.heading.id === previewHeadingID

          return (
            <li
              data-current={isActive ? 'true' : undefined}
              data-level={segment.heading.depth}
              data-preview={isPreviewed ? 'true' : undefined}
              key={segment.heading.id}
              style={getSegmentStyle(segment, orientation)}
            >
              <a
                aria-current={isActive ? 'location' : undefined}
                aria-label={segment.heading.text}
                data-mobile-toc-anchor={segment.heading.id}
                href={`#${segment.heading.id}`}
                onClick={() => {
                  rootRef.current?.setAttribute('data-mobile-toc-last-click', segment.heading.id)
                }}
                title={segment.heading.text}
              >
                <span data-mobile-toc-tick="" />
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function SheetHeadingList(props: {
  activeHeadingID: string
  headings: MarkdownHeading[]
  rootRef: RefObject<HTMLDivElement | null>
}) {
  const { activeHeadingID, headings, rootRef } = props

  return (
    <ScrollArea className="dev-mobile-toc-sheet__list">
      <ol>
        {headings.map((heading) => {
          const isActive = heading.id === activeHeadingID

          return (
            <li
              data-current={isActive ? 'true' : undefined}
              data-level={heading.depth}
              key={heading.id}
            >
              <a
                aria-current={isActive ? 'location' : undefined}
                data-mobile-toc-anchor={heading.id}
                href={`#${heading.id}`}
                onClick={() => {
                  rootRef.current?.setAttribute('data-mobile-toc-last-click', heading.id)
                }}
              >
                <span>H{heading.depth}</span>
                <span>{heading.text}</span>
              </a>
            </li>
          )
        })}
      </ol>
    </ScrollArea>
  )
}

export function MobileArticleTocPrototypes(props: MobileArticleTocPrototypesProps) {
  const {
    activeHeadingID,
    headings,
    label,
    progress = fallbackProgress,
    progressLabel,
    variant,
  } = props
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [preview, setPreview] = useState<null | ScrubPreview>(null)
  const measuredSegments = useMeasuredMobileTocSegments(headings)
  const segments =
    measuredSegments.length > 0 ? measuredSegments : buildEqualMobileTocSegments(headings)
  const activeHeading = useMemo(
    () => headings.find((heading) => heading.id === activeHeadingID) ?? headings[0],
    [activeHeadingID, headings],
  )
  const handleScrub = useCallback((segment: MobileTocSegment) => {
    dispatchAnchorNavigation(rootRef.current, segment.heading.id)
  }, [])

  if (headings.length === 0) {
    return null
  }

  if (variant === 'sheet-map') {
    return (
      <div
        className="dev-mobile-toc dev-mobile-toc--sheet-map"
        data-mobile-toc-variant="sheet-map"
        ref={rootRef}
      >
        <Sheet>
          <SheetTrigger asChild>
            <Button
              aria-label="Open mobile contents"
              className="dev-mobile-toc-sheet__trigger"
              size="sm"
              type="button"
              variant="secondary"
            >
              <BookOpenIcon aria-hidden="true" data-icon="inline-start" />
              {formatPercent(progress.visibleEndPercent)}
            </Button>
          </SheetTrigger>
          <SheetContent className="dev-mobile-toc-sheet__content" side="bottom">
            <SheetHeader className="dev-mobile-toc-sheet__header">
              <SheetTitle>{label}</SheetTitle>
              <SheetDescription>
                {progressLabel} · {formatPercent(progress.visibleEndPercent)}
              </SheetDescription>
            </SheetHeader>
            <div className="dev-mobile-toc-sheet__body">
              <SheetHeadingList
                activeHeadingID={activeHeading?.id ?? ''}
                headings={headings}
                rootRef={rootRef}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    )
  }

  const orientation = variant === 'bottom-strip' ? 'horizontal' : 'vertical'

  return (
    <div className="dev-mobile-toc" data-mobile-toc-variant={variant} ref={rootRef}>
      <div className="dev-mobile-toc__summary">
        <span>{formatPercent(progress.visibleEndPercent)}</span>
        <strong>{activeHeading?.text ?? label}</strong>
      </div>
      <MobileTocTrack
        activeHeadingID={activeHeading?.id ?? ''}
        className={`dev-mobile-toc-track dev-mobile-toc-track--${variant}`}
        label={label}
        onScrub={handleScrub}
        orientation={orientation}
        previewHeadingID={preview?.heading.id ?? null}
        progress={progress}
        rootRef={rootRef}
        segments={segments}
        setPreview={setPreview}
        variant={variant}
      />
      {preview ? <MobileTocPreview preview={preview} variant={variant} /> : null}
    </div>
  )
}
