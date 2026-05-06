import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

let mockedFormFields: Record<string, any>

vi.mock('@payloadcms/ui', () => ({
  useFormFields: (selector: any) => selector([mockedFormFields]),
}))

import { ArticleLayoutPreview } from '@/components/payload/ArticleLayoutPreview'

describe('ArticleLayoutPreview', () => {
  it('renders a live preview using current form values', () => {
    mockedFormFields = {
      articleLayout: {
        value: {
          advanced: {
            captionGap: '5px',
            contentWidth: '70ch',
            paragraphGap: '0.7rem',
          },
          preset: 'prose-baseline',
          typography: {
            cjkFont: 'songti-serif',
            latinFont: 'literary-serif',
          },
        },
      },
    }

    render(
      <ArticleLayoutPreview
        field={{ name: 'preview', type: 'ui' } as any}
        path="articleLayout.preview"
      />,
    )

    const preview = screen.getByTestId('article-layout-preview')

    expect(preview.getAttribute('data-article-layout-preset')).toBe('prose-baseline')
    expect(preview.getAttribute('style')).toContain('--article-layout-reading-column-max: 70ch')
    expect(preview.getAttribute('style')).toContain('--article-layout-caption-gap: 5px')
    expect(preview.getAttribute('style')).toContain('--article-layout-latin-font-family: Georgia')
    expect(preview.getAttribute('style')).toContain('Songti SC')
    expect(screen.getByText('Live article layout preview')).toBeTruthy()
    expect(screen.getByText('Prose')).toBeTruthy()
    expect(screen.getByText(/阅读节奏/)).toBeTruthy()
  })

  it('prefers live path values over stale article layout group values', () => {
    mockedFormFields = {
      articleLayout: {
        value: {
          preset: 'dense-technical',
          typography: {
            cjkFont: 'heiti-sans',
            latinFont: 'system-sans',
          },
        },
      },
      'articleLayout.preset': {
        value: 'prose-baseline',
      },
      'articleLayout.typography.cjkFont': {
        value: 'songti-serif',
      },
      'articleLayout.typography.latinFont': {
        value: 'literary-serif',
      },
    }

    render(
      <ArticleLayoutPreview
        field={{ name: 'preview', type: 'ui' } as any}
        path="articleLayout.preview"
      />,
    )

    const preview = screen.getByTestId('article-layout-preview')

    expect(preview.getAttribute('data-article-layout-preset')).toBe('prose-baseline')
    expect(preview.getAttribute('style')).toContain('--article-layout-latin-font-family: Georgia')
    expect(preview.getAttribute('style')).toContain('Songti SC')
    expect(preview.getAttribute('style')).not.toContain('PingFang SC')
  })
})
