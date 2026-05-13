import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import {
  PostArticleTitleBlock,
  postArticleTitleLayoutOptions,
} from '@/features/posts/ui/PostArticleTitleBlock'

describe('article title layouts', () => {
  it('defines compact comparison candidates for the dev page', () => {
    expect(postArticleTitleLayoutOptions.map((option) => option.id)).toEqual([
      'compact-stack',
      'title-led',
      'split-meta',
    ])
  })

  it('renders formal article titles without a published status label', () => {
    const html = renderToStaticMarkup(
      <PostArticleTitleBlock
        excerpt="这是一段用于比较标题和摘要距离的文章摘要。"
        meta={
          <>
            <span>2026年5月1日</span>
            <span>8 分钟阅读</span>
          </>
        }
        title="文章标题排版实验"
      />,
    )

    expect(html).toContain('data-article-frontmatter=""')
    expect(html).toContain('data-article-title-layout="compact-stack"')
    expect(html).toContain('data-article-title-copy-spacing="compact"')
    expect(html).not.toContain('已发布')
    expect(html).not.toContain('Published')
  })

  it('keeps the preview label available when explicitly provided', () => {
    const html = renderToStaticMarkup(
      <PostArticleTitleBlock
        label="预览模式"
        meta={<span>草稿预览</span>}
        title="草稿文章标题"
      />,
    )

    expect(html).toContain('预览模式')
  })
})
