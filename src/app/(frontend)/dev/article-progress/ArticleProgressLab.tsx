'use client'

import type { CSSProperties } from 'react'
import { useCallback, useMemo, useState } from 'react'

import type { MarkdownHeading } from '@/features/article/model/markdown-headings'

import { ArticleProgressControls } from './ArticleProgressControls'
import { MobileArticleTocPrototypes } from './MobileArticleTocPrototypes'
import {
  formatPercent,
  getHeadingState,
  headingLevelOptions,
  railHeightValues,
  readingOffsets,
  tocTrackOffset,
  type HeadingLevel,
  type LineWeight,
  type MobileTocVariant,
  type PathStyle,
  type RailHeight,
} from './articleProgressModel'
import { useArticleProgressMeasurement } from './useArticleProgressMeasurement'

type ArticleProgressLabProps = {
  headings: MarkdownHeading[]
  label: string
  progressLabel: string
}

export function ArticleProgressLab(props: ArticleProgressLabProps) {
  const { headings, label, progressLabel } = props
  const [pathStyle, setPathStyle] = useState<PathStyle>('rounded')
  const [lineWeight, setLineWeight] = useState<LineWeight>('regular')
  const [railHeight, setRailHeight] = useState<RailHeight>('regular')
  const [mobileTocVariant, setMobileTocVariant] = useState<MobileTocVariant>('right-rail')
  const [bendScale, setBendScale] = useState(0.48)
  const [indentScale, setIndentScale] = useState(1)
  const [isTrackOffsetLocked, setIsTrackOffsetLocked] = useState(true)
  const [lockedTrackOffsetPx, setLockedTrackOffsetPx] = useState(tocTrackOffset.defaultLockedPx)
  const [spacingScale, setSpacingScale] = useState(0.72)
  const [trackOverlapScale, setTrackOverlapScale] = useState(0.46)
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

  const {
    activePathRef,
    progress,
    progressSvgRef,
    scrollViewportRef,
    tocItemRefs,
    tocListRef,
    trackPathRef,
    visibleEndPercentRef,
  } = useArticleProgressMeasurement({
    bendScale,
    displayedHeadings,
    indentScale,
    isTrackOffsetLocked,
    lockedTrackOffsetPx,
    pathStyle,
    scrollLeadScale,
    showDebugBoundaries,
    trackOverlapScale,
  })

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

  const readingRangeLabel = `${formatPercent(progress.visibleStartPercent)}–${formatPercent(
    progress.visibleEndPercent,
  )}`
  const mobileHeading = displayedHeadings[progress.activeStartIndex] ?? displayedHeadings[0]

  if (displayedHeadings.length === 0) {
    return null
  }

  return (
    <>
      {showDebugBoundaries ? (
        <div aria-hidden="true" className="dev-progress-debug-boundaries">
          <span
            className="dev-progress-debug-boundary dev-progress-debug-boundary--top"
            style={{ top: `${readingOffsets.top}px` }}
          >
            <span>Top boundary · {readingOffsets.top}px</span>
          </span>
          <span
            className="dev-progress-debug-boundary dev-progress-debug-boundary--bottom"
            style={{ bottom: `${readingOffsets.bottom}px` }}
          >
            <span>Bottom boundary · {readingOffsets.bottom}px</span>
          </span>
        </div>
      ) : null}

      <ArticleProgressControls
        activeLabel={activeLabel}
        bendScale={bendScale}
        indentScale={indentScale}
        isTrackOffsetLocked={isTrackOffsetLocked}
        lineWeight={lineWeight}
        lockedTrackOffsetPx={lockedTrackOffsetPx}
        mobileTocVariant={mobileTocVariant}
        pathStyle={pathStyle}
        railHeight={railHeight}
        readingRangeLabel={readingRangeLabel}
        scrollLeadScale={scrollLeadScale}
        setBendScale={setBendScale}
        setIndentScale={setIndentScale}
        setIsTrackOffsetLocked={setIsTrackOffsetLocked}
        setLineWeight={setLineWeight}
        setLockedTrackOffsetPx={setLockedTrackOffsetPx}
        setMobileTocVariant={setMobileTocVariant}
        setPathStyle={setPathStyle}
        setRailHeight={setRailHeight}
        setScrollLeadScale={setScrollLeadScale}
        setShowDebugBoundaries={setShowDebugBoundaries}
        setSpacingScale={setSpacingScale}
        setTrackOverlapScale={setTrackOverlapScale}
        showDebugBoundaries={showDebugBoundaries}
        spacingScale={spacingScale}
        toggleHeadingLevel={toggleHeadingLevel}
        trackOverlapScale={trackOverlapScale}
        visibleHeadingLevels={visibleHeadingLevels}
      />

      <MobileArticleTocPrototypes
        activeHeadingID={mobileHeading?.id ?? ''}
        headings={displayedHeadings}
        label={label}
        progress={progress}
        progressLabel={progressLabel}
        variant={mobileTocVariant}
      />

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
            <h2 className="font-serif text-xl text-foreground">{label}</h2>
          </div>
          <span className="editorial-meta shrink-0" ref={visibleEndPercentRef}>
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
