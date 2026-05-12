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
})
