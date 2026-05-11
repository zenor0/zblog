import { describe, expect, it } from 'vitest'

import {
  articleBlockPreviewCategories,
  getArticleBlockPreviewCategory,
  getArticleBlockPreviewItems,
} from '@/features/article/model/article-block-previews'

describe('article block preview registry', () => {
  it('exposes category routes under the design system article block section', () => {
    expect(articleBlockPreviewCategories.map((category) => category.slug)).toEqual([
      'text',
      'callouts',
      'media',
      'tables',
      'components',
    ])
    expect(getArticleBlockPreviewCategory('callouts')?.href).toBe(
      '/dev/design-system/article-blocks/callouts',
    )
  })

  it('enumerates static examples for every supported article block family', () => {
    const sampleIDs = getArticleBlockPreviewItems().map((item) => item.id)

    expect(sampleIDs).toContain('heading-scale')
    expect(sampleIDs).toContain('blockquote')
    expect(sampleIDs).toContain('callout-warning')
    expect(sampleIDs).toContain('figure-caption')
    expect(sampleIDs).toContain('captioned-table')
    expect(sampleIDs).toContain('notice-card')
    expect(sampleIDs).toContain('feature-grid')
  })
})
