import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { PostTableOfContents } from '@/components/frontend/PostTableOfContents'
import type { MarkdownHeading } from '@/lib/markdown-headings'

describe('PostTableOfContents', () => {
  it('renders plain anchor links without article hover preview metadata', () => {
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

    const html = renderToStaticMarkup(
      <PostTableOfContents headings={headings} label="Contents" progressLabel="Progress" />,
    )

    expect(html).toContain('href="#overview"')
    expect(html).toContain('href="#details"')
    expect(html).not.toContain('data-link-preview-kind')
    expect(html).not.toContain('data-slot="hover-card"')
    expect(html).not.toContain('data-slot="hover-card-trigger"')
  })
})
