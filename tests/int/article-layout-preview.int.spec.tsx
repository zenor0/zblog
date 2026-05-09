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
          preset: 'compact-editorial',
          typography: {
            cjkFont: 'noto-sans-sc',
            codeFont: 'jetbrains-mono',
            headingFont: 'editorial-serif',
            latinFont: 'source-sans-3',
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

    const preview = screen.getByTestId('article-design-preview')

    expect(preview.getAttribute('data-article-design-preset')).toBe('compact-editorial')
    expect(preview.getAttribute('style')).toContain('--article-layout-reading-column-max: 70ch')
    expect(preview.getAttribute('style')).toContain('--article-layout-caption-gap: 5px')
    expect(preview.getAttribute('style')).toContain('Source Sans 3')
    expect(preview.getAttribute('style')).toContain('Noto Sans SC')
    expect(preview.getAttribute('style')).toContain('JetBrains Mono')
    expect(screen.getByText('Article design preview')).toBeTruthy()
    expect(screen.getByText('Compact editorial')).toBeTruthy()
    expect(screen.getByText(/字体系统应该让重点自然浮出来/)).toBeTruthy()
    expect(screen.getByTestId('article-design-preview-codeblock')).toBeTruthy()
  })

  it('prefers live path values over stale article layout group values', () => {
    mockedFormFields = {
      articleLayout: {
        value: {
          preset: 'balanced-editorial',
          typography: {
            cjkFont: 'noto-serif-sc',
            latinFont: 'newsreader',
          },
        },
      },
      'articleLayout.preset': {
        value: 'compact-editorial',
      },
      'articleLayout.typography.cjkFont': {
        value: 'noto-sans-sc',
      },
      'articleLayout.typography.latinFont': {
        value: 'source-sans-3',
      },
    }

    render(
      <ArticleLayoutPreview
        field={{ name: 'preview', type: 'ui' } as any}
        path="articleLayout.preview"
      />,
    )

    const preview = screen.getByTestId('article-design-preview')
    const style = preview.getAttribute('style') ?? ''

    expect(preview.getAttribute('data-article-design-preset')).toBe('compact-editorial')
    expect(style).toMatch(/--article-layout-latin-font-family:[^;]*Source Sans 3/)
    expect(style).toMatch(/--article-layout-cjk-font-family:[^;]*Noto Sans SC/)
    expect(style).not.toMatch(/--article-layout-cjk-font-family:[^;]*Noto Serif SC/)
  })
})
