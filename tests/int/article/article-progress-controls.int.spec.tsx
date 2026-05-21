import { render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { describe, expect, it } from 'vitest'

import { ArticleProgressControls } from '@/app/(frontend)/dev/article-progress/ArticleProgressControls'

const noop = () => undefined

function renderControls(props?: Partial<ComponentProps<typeof ArticleProgressControls>>) {
  render(
    <ArticleProgressControls
      activeLabel="当前章节"
      bendScale={0.48}
      indentScale={1}
      isTrackOffsetLocked={true}
      lineWeight="regular"
      lockedTrackOffsetPx={22}
      mobileTocVariant="right-rail"
      pathStyle="rounded"
      railHeight="regular"
      readingRangeLabel="10%-40%"
      scrollLeadScale={0.46}
      setBendScale={noop}
      setIndentScale={noop}
      setIsTrackOffsetLocked={noop}
      setLineWeight={noop}
      setLockedTrackOffsetPx={noop}
      setMobileTocVariant={noop}
      setPathStyle={noop}
      setRailHeight={noop}
      setScrollLeadScale={noop}
      setShowDebugBoundaries={noop}
      setSpacingScale={noop}
      setTrackOverlapScale={noop}
      showDebugBoundaries={false}
      spacingScale={0.72}
      toggleHeadingLevel={noop}
      trackOverlapScale={0.46}
      visibleHeadingLevels={{ 2: true, 3: true, 4: true }}
      {...props}
    />,
  )
}

describe('ArticleProgressControls', () => {
  it('defaults to locked track spacing and disables free overlap adjustment', () => {
    renderControls()

    expect(screen.getByRole('switch', { name: '锁距' }).getAttribute('aria-checked')).toBe('true')
    expect(screen.getByLabelText('目录线距标题边缘')).toHaveProperty('disabled', false)
    expect(screen.getByLabelText('目录线进入标题区域程度')).toHaveProperty('disabled', true)
  })

  it('re-enables overlap adjustment when locked spacing is off', () => {
    renderControls({ isTrackOffsetLocked: false })

    expect(screen.getByRole('switch', { name: '锁距' }).getAttribute('aria-checked')).toBe('false')
    expect(screen.getByLabelText('目录线距标题边缘')).toHaveProperty('disabled', true)
    expect(screen.getByLabelText('目录线进入标题区域程度')).toHaveProperty('disabled', false)
  })
})
