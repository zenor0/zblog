import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { ArticleProgressTableOfContents } from '@/features/article/ui/ArticleProgressTableOfContents'
import { ArticleTableOfContents } from '@/features/article/ui/ArticleTableOfContents'
import type { MarkdownHeading } from '@/features/article/model/markdown-headings'

const headings: MarkdownHeading[] = [
  {
    depth: 2,
    displayNumber: '1',
    id: 'overview',
    text: 'Overview',
  },
  {
    depth: 3,
    displayNumber: '1.1',
    id: 'details',
    text: 'Details',
  },
  {
    depth: 4,
    displayNumber: '1.1.1',
    id: 'deep-dive',
    text: 'Deep dive',
  },
]

describe('article table-of-contents variants', () => {
  it('renders the progress-map variant without lab controls or dev classes', () => {
    const html = renderToStaticMarkup(
      <ArticleProgressTableOfContents
        headings={headings}
        label="Contents"
        progressLabel="Progress"
      />,
    )

    expect(html).toContain('data-article-toc-variant="progress-map"')
    expect(html).toContain('href="#overview"')
    expect(html).toContain('href="#details"')
    expect(html).toContain('article-progress-map')
    expect(html).not.toContain('Progress lab')
    expect(html).not.toContain('dev-progress')
  })

  it('dispatches to the standard or progress-map TOC variants', () => {
    const standardHTML = renderToStaticMarkup(
      <ArticleTableOfContents
        headings={headings}
        label="Contents"
        progressLabel="Progress"
        variant="standard"
      />,
    )
    const progressHTML = renderToStaticMarkup(
      <ArticleTableOfContents
        headings={headings}
        label="Contents"
        progressLabel="Progress"
        variant="progress-map"
      />,
    )

    expect(standardHTML).toContain('data-article-toc-variant="standard"')
    expect(progressHTML).toContain('data-article-toc-variant="progress-map"')
  })

  it('applies progress-map config to rendering and heading filtering', () => {
    const html = renderToStaticMarkup(
      <ArticleProgressTableOfContents
        config={{
          bendScale: 0.72,
          indentScale: 1.35,
          isTrackOffsetLocked: false,
          lineWeight: 'strong',
          lockedTrackOffsetPx: 18,
          pathStyle: 'flow',
          railHeight: 'compact',
          scrollLeadScale: 0.3,
          spacingScale: 1.1,
          trackOverlapScale: 0.2,
          visibleHeadingLevels: [2],
        }}
        headings={headings}
        label="Contents"
        progressLabel="Progress"
      />,
    )

    expect(html).toContain('data-path-style="flow"')
    expect(html).toContain('data-weight="strong"')
    expect(html).toContain('--toc-panel-height:min(42vh, 22rem)')
    expect(html).toContain('--toc-spacing-scale:1.1')
    expect(html).toContain('--toc-depth-indent:0rem')
    expect(html).toContain('href="#overview"')
    expect(html).not.toContain('href="#details"')
    expect(html).not.toContain('href="#deep-dive"')
  })
})
