import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import {
  HomePageSkeleton,
  PostArticleSkeleton,
} from '@/features/posts/ui/FrontendLoadingSkeletons'

function countSkeletonSlots(markup: string) {
  return markup.match(/data-slot="skeleton"/g)?.length ?? 0
}

describe('frontend loading skeletons', () => {
  it('renders a home-page loading structure with reusable skeleton slots', () => {
    const markup = renderToStaticMarkup(<HomePageSkeleton />)

    expect(markup).toContain('data-frontend-loading="home"')
    expect(markup).toContain('aria-busy="true"')
    expect(countSkeletonSlots(markup)).toBeGreaterThanOrEqual(14)
  })

  it('renders an article loading structure with hero, body, and toc placeholders', () => {
    const markup = renderToStaticMarkup(<PostArticleSkeleton />)

    expect(markup).toContain('data-frontend-loading="article"')
    expect(markup).toContain('data-article-layout=""')
    expect(countSkeletonSlots(markup)).toBeGreaterThanOrEqual(18)
  })
})
