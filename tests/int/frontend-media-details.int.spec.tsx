import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { MediaDetails } from '@/components/frontend/MediaDetails'

describe('MediaDetails', () => {
  it('separates the caption from right-side credit when both are present', () => {
    const markup = renderToStaticMarkup(
      <MediaDetails caption="Figure 1. Image caption" credit="Unsplash" creditPrefix="Credit:" />,
    )

    expect(markup).toContain('media-details--split')
    expect(markup).toContain('media-details__caption')
    expect(markup).toContain('media-details__credit')
    expect(markup).toContain('Figure 1. Image caption')
    expect(markup).toContain('Credit: Unsplash')
  })

  it('does not render an empty details wrapper', () => {
    const markup = renderToStaticMarkup(<MediaDetails caption=" " credit={null} />)

    expect(markup).toBe('')
  })
})
