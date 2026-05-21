import { describe, expect, it } from 'vitest'

import {
  getTocTitleStartX,
  getTocTrackX,
  getTocX,
  tocPath,
  tocTrackOffset,
  type HeadingLevel,
} from '@/app/(frontend)/dev/article-progress/articleProgressModel'

describe('article progress track model', () => {
  it('locks each track point to the same offset from the measured title edge', () => {
    const lockedTrackOffsetPx = 22
    const titleLeftByLevel: Record<HeadingLevel, number> = {
      2: 36,
      3: 49.25,
      4: 62.5,
    }

    const gaps = ([2, 3, 4] as HeadingLevel[]).map((level) => {
      const titleLeftX = titleLeftByLevel[level]
      const trackX = getTocTrackX({
        indentScale: 1.35,
        isTrackOffsetLocked: true,
        level,
        lockedTrackOffsetPx,
        titleLeftX,
        trackOverlapScale: 1,
      })

      return Number((titleLeftX - trackX).toFixed(2))
    })

    expect(gaps).toEqual([lockedTrackOffsetPx, lockedTrackOffsetPx, lockedTrackOffsetPx])
  })

  it('keeps the locked gap stable as heading indentation changes', () => {
    const lockedTrackOffsetPx = 18

    const gaps = [0.55, 1, 1.8].map((indentScale) => {
      const titleLeftX = getTocTitleStartX(4, indentScale)
      const trackX = getTocTrackX({
        indentScale,
        isTrackOffsetLocked: true,
        level: 4,
        lockedTrackOffsetPx,
        titleLeftX,
        trackOverlapScale: 0.46,
      })

      return Number((titleLeftX - trackX).toFixed(2))
    })

    expect(gaps).toEqual([lockedTrackOffsetPx, lockedTrackOffsetPx, lockedTrackOffsetPx])
  })

  it('uses the existing overlap model when the track offset is unlocked', () => {
    const indentScale = 1.2
    const trackOverlapScale = 0.46

    expect(
      getTocTrackX({
        indentScale,
        isTrackOffsetLocked: false,
        level: 4,
        lockedTrackOffsetPx: 22,
        titleLeftX: 88,
        trackOverlapScale,
      }),
    ).toBeCloseTo(getTocX(4, indentScale, trackOverlapScale))
  })

  it('keeps the maximum locked offset inside the unclamped H2 range', () => {
    const titleLeftX = getTocTitleStartX(2, 1)

    expect(titleLeftX - tocTrackOffset.maxLockedPx).toBeGreaterThanOrEqual(tocPath.minX)
  })
})
