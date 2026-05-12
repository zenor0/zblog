import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { MobileArticleTocPrototypes } from '@/app/(frontend)/dev/article-progress/MobileArticleTocPrototypes'
import type { MarkdownHeading } from '@/features/article/model/markdown-headings'

const headings: MarkdownHeading[] = [
  { depth: 2, displayNumber: '1', id: 'overview', text: 'Overview' },
  { depth: 3, displayNumber: '1.1', id: 'details', text: 'Details' },
]

describe('MobileArticleTocPrototypes', () => {
  it('renders the right rail candidate by default with plain heading anchors', () => {
    const { container } = render(
      <MobileArticleTocPrototypes
        activeHeadingID="overview"
        headings={headings}
        label="Contents"
        progressLabel="Progress"
        variant="right-rail"
      />,
    )

    expect(container.querySelector('[data-mobile-toc-variant="right-rail"]')).toBeTruthy()
    expect(container.querySelector('a[href="#overview"]')).toBeTruthy()
    expect(container.querySelector('a[href="#details"]')).toBeTruthy()
    expect(container.innerHTML).not.toContain('data-link-preview-kind')
    expect(container.innerHTML).not.toContain('data-slot="hover-card"')
  })

  it('renders a compact sheet candidate trigger for narrow screens', () => {
    const { container } = render(
      <MobileArticleTocPrototypes
        activeHeadingID="details"
        headings={headings}
        label="Contents"
        progressLabel="Progress"
        variant="sheet-map"
      />,
    )

    expect(container.querySelector('[data-mobile-toc-variant="sheet-map"]')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Open mobile contents' })).toBeTruthy()
  })
})
