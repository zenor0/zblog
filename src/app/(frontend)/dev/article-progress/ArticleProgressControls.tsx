'use client'

import type { Dispatch, SetStateAction } from 'react'

import { Button } from '@/components/ui/button'

import {
  headingLevelOptions,
  lineWeightOptions,
  pathStyleOptions,
  railHeightOptions,
  type HeadingLevel,
  type LineWeight,
  type PathStyle,
  type RailHeight,
} from './articleProgressModel'

type ArticleProgressControlsProps = {
  activeLabel: string
  bendScale: number
  indentScale: number
  lineWeight: LineWeight
  pathStyle: PathStyle
  railHeight: RailHeight
  readingRangeLabel: string
  scrollLeadScale: number
  setBendScale: Dispatch<SetStateAction<number>>
  setIndentScale: Dispatch<SetStateAction<number>>
  setLineWeight: Dispatch<SetStateAction<LineWeight>>
  setPathStyle: Dispatch<SetStateAction<PathStyle>>
  setRailHeight: Dispatch<SetStateAction<RailHeight>>
  setScrollLeadScale: Dispatch<SetStateAction<number>>
  setShowDebugBoundaries: Dispatch<SetStateAction<boolean>>
  setSpacingScale: Dispatch<SetStateAction<number>>
  setTrackOverlapScale: Dispatch<SetStateAction<number>>
  showDebugBoundaries: boolean
  spacingScale: number
  toggleHeadingLevel: (level: HeadingLevel) => void
  trackOverlapScale: number
  visibleHeadingLevels: Record<HeadingLevel, boolean>
}

export function ArticleProgressControls(props: ArticleProgressControlsProps) {
  const {
    activeLabel,
    bendScale,
    indentScale,
    lineWeight,
    pathStyle,
    railHeight,
    readingRangeLabel,
    scrollLeadScale,
    setBendScale,
    setIndentScale,
    setLineWeight,
    setPathStyle,
    setRailHeight,
    setScrollLeadScale,
    setShowDebugBoundaries,
    setSpacingScale,
    setTrackOverlapScale,
    showDebugBoundaries,
    spacingScale,
    toggleHeadingLevel,
    trackOverlapScale,
    visibleHeadingLevels,
  } = props

  return (
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
        <div className="dev-progress-floating-controls__buttons" role="group" aria-label="折线样式">
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
        <label className="dev-progress-floating-controls__label" htmlFor="dev-progress-bend">
          弯曲
        </label>
        <div className="dev-progress-floating-controls__range">
          <input
            aria-label="目录线弯曲程度"
            id="dev-progress-bend"
            max="1"
            min="0"
            onChange={(event) => {
              setBendScale(Number(event.currentTarget.value))
            }}
            step="0.01"
            type="range"
            value={bendScale}
          />
          <span>{bendScale.toFixed(2)}</span>
        </div>
      </div>

      <div className="dev-progress-floating-controls__row">
        <span className="dev-progress-floating-controls__label">高度</span>
        <div className="dev-progress-floating-controls__buttons" role="group" aria-label="目录高度">
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
        <label className="dev-progress-floating-controls__label" htmlFor="dev-progress-overlap">
          穿插
        </label>
        <div className="dev-progress-floating-controls__range">
          <input
            aria-label="目录线进入标题区域程度"
            id="dev-progress-overlap"
            max="1"
            min="0"
            onChange={(event) => {
              setTrackOverlapScale(Number(event.currentTarget.value))
            }}
            step="0.01"
            type="range"
            value={trackOverlapScale}
          />
          <span>{trackOverlapScale.toFixed(2)}</span>
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
        <div className="dev-progress-floating-controls__buttons" role="group" aria-label="线条强度">
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
  )
}
