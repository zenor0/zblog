'use client'

import type { CSSProperties } from 'react'
import { useMemo } from 'react'

import {
  formatPercent,
  getHeadingState,
  railHeightValues,
  type HeadingLevel,
} from '@/features/article/ui/article-progress/articleProgressModel'
import { useArticleProgressMeasurement } from '@/features/article/ui/article-progress/useArticleProgressMeasurement'
import {
  defaultArticleProgressMapConfig,
  type ArticleProgressMapConfig,
} from '@/features/frontend-variants/model/frontend-variants'
import type { MarkdownHeading } from '@/features/article/model/markdown-headings'

type ArticleProgressTableOfContentsProps = {
  config?: Partial<ArticleProgressMapConfig>
  headings: MarkdownHeading[]
  label: string
  progressLabel: string
}

function resolveProgressMapConfig(config: Partial<ArticleProgressMapConfig> | undefined) {
  return {
    ...defaultArticleProgressMapConfig,
    ...config,
    visibleHeadingLevels:
      Array.isArray(config?.visibleHeadingLevels) && config.visibleHeadingLevels.length > 0
        ? config.visibleHeadingLevels
        : defaultArticleProgressMapConfig.visibleHeadingLevels,
  }
}

export function ArticleProgressTableOfContents(props: ArticleProgressTableOfContentsProps) {
  const { headings, label, progressLabel } = props
  const config = resolveProgressMapConfig(props.config)
  const visibleHeadingLevelSet = useMemo(
    () => new Set<HeadingLevel>(config.visibleHeadingLevels),
    [config.visibleHeadingLevels],
  )
  const displayedHeadings = useMemo(
    () => headings.filter((heading) => visibleHeadingLevelSet.has(heading.depth as HeadingLevel)),
    [headings, visibleHeadingLevelSet],
  )
  const {
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
  } = useArticleProgressMeasurement({
    bendScale: config.bendScale,
    classNamePrefix: 'article-progress',
    displayedHeadings,
    indentScale: config.indentScale,
    isTrackOffsetLocked: config.isTrackOffsetLocked,
    lockedTrackOffsetPx: config.lockedTrackOffsetPx,
    pathStyle: config.pathStyle,
    scrollLeadScale: config.scrollLeadScale,
    showDebugBoundaries: false,
    trackOverlapScale: config.trackOverlapScale,
  })
  const mobileHeading = displayedHeadings[progress.activeStartIndex] ?? displayedHeadings[0]

  if (displayedHeadings.length === 0) {
    return null
  }

  return (
    <>
      <div
        className="article-progress-mobile"
        data-article-toc-variant="progress-map"
        data-weight={config.lineWeight}
      >
        <div aria-hidden="true" className="article-progress-mobile__track" ref={mobileProgressRef}>
          <span />
        </div>
        {mobileHeading ? (
          <a className="article-progress-mobile__link" href={`#${mobileHeading.id}`}>
            <span className="article-progress-mobile__level">H{mobileHeading.depth}</span>
            <span className="article-progress-mobile__title">{mobileHeading.text}</span>
            <span className="article-progress-mobile__percent" ref={mobileVisibleEndPercentRef}>
              {formatPercent(progress.visibleEndPercent)}
            </span>
          </a>
        ) : null}
      </div>

      <section
        className="article-progress-rail"
        data-article-toc-variant="progress-map"
        data-toc-rail=""
        style={
          {
            '--toc-panel-height': railHeightValues[config.railHeight],
            '--toc-spacing-scale': config.spacingScale,
          } as CSSProperties
        }
      >
        <div className="article-progress-rail__header">
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
          className="article-progress-map"
          data-path-style={config.pathStyle}
          data-weight={config.lineWeight}
          ref={scrollViewportRef}
        >
          <div className="article-progress-map__content">
            <svg
              aria-hidden="true"
              className="article-progress-map__track"
              height={progress.pathHeight}
              ref={progressSvgRef}
              viewBox={`0 0 ${progress.pathWidth} ${progress.pathHeight}`}
              width={progress.pathWidth}
            >
              <path className="article-progress-map__path" ref={trackPathRef} />
              <path
                className="article-progress-map__path article-progress-map__path--active"
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
                    className="article-progress-map__item"
                    data-level={heading.depth}
                    data-state={state}
                    key={heading.id}
                    ref={(node) => {
                      tocItemRefs.current[heading.id] = node
                    }}
                    style={
                      {
                        '--toc-depth': heading.depth - 2,
                        '--toc-depth-indent': `${(heading.depth - 2) * 0.82 * config.indentScale}rem`,
                      } as CSSProperties
                    }
                  >
                    <a
                      aria-current={state === 'current' ? 'location' : undefined}
                      className="article-progress-map__link"
                      href={`#${heading.id}`}
                      title={heading.text}
                    >
                      <span className="article-progress-map__title">
                        <span className="article-progress-map__title-text">{heading.text}</span>
                      </span>
                      <span className="article-progress-map__level">H{heading.depth}</span>
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
