import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { footerLayoutCandidates } from '@/app/(frontend)/dev/footer-layouts/footerLayoutCandidates'
import FooterLayoutLabPage from '@/app/(frontend)/dev/footer-layouts/page'
import { siteFooterLayoutStyleOptions } from '@/components/frontend/site-footer'

describe('footer layout lab', () => {
  it('offers one preview for every selectable footer layout style', () => {
    expect(footerLayoutCandidates.map((candidate) => candidate.layoutStyle)).toEqual(
      siteFooterLayoutStyleOptions.map((option) => option.value),
    )
  })

  it('renders compliance-oriented sample content for choosing a production footer', () => {
    const markup = renderToStaticMarkup(<FooterLayoutLabPage />)

    expect(markup).toContain('/dev/footer-layouts')
    expect(markup).toContain('Footer Layouts')
    expect(markup).toContain('Copyright 2026 ZBlog. All rights reserved.')
    expect(markup).toContain('ICP备案')
    expect(markup).toContain('data-footer-layout="compact"')
    expect(markup).toContain('data-footer-layout="directory"')
    expect(markup).toContain('data-footer-layout="ledger"')
  })
})
