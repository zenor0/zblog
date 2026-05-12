import { describe, expect, it } from 'vitest'

import {
  buildMobileTocSegments,
  resolveMobileTocSegmentByRatio,
} from '@/app/(frontend)/dev/article-progress/articleProgressModel'
import type { MarkdownHeading } from '@/features/article/model/markdown-headings'

const headings: MarkdownHeading[] = [
  { depth: 2, displayNumber: '1', id: 'intro', text: 'Intro' },
  { depth: 3, displayNumber: '1.1', id: 'method', text: 'Method' },
  { depth: 2, displayNumber: '2', id: 'results', text: 'Results' },
]

describe('mobile article toc model', () => {
  it('sizes each heading segment from its article section length', () => {
    const segments = buildMobileTocSegments({
      articleBottom: 1000,
      articleTop: 0,
      headingTops: [100, 300, 900],
      headings,
    })

    expect(
      segments.map((segment) => ({
        end: segment.endPercent,
        id: segment.heading.id,
        size: segment.sizePercent,
        start: segment.startPercent,
      })),
    ).toEqual([
      { end: 30, id: 'intro', size: 20, start: 10 },
      { end: 90, id: 'method', size: 60, start: 30 },
      { end: 100, id: 'results', size: 10, start: 90 },
    ])
  })

  it('resolves a scrub ratio to the matching heading segment', () => {
    const segments = buildMobileTocSegments({
      articleBottom: 1000,
      articleTop: 0,
      headingTops: [100, 300, 900],
      headings,
    })

    expect(resolveMobileTocSegmentByRatio(segments, -0.2)?.heading.id).toBe('intro')
    expect(resolveMobileTocSegmentByRatio(segments, 0.31)?.heading.id).toBe('method')
    expect(resolveMobileTocSegmentByRatio(segments, 0.99)?.heading.id).toBe('results')
  })
})
