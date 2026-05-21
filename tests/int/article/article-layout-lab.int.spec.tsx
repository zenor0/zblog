import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import {
  articleLayoutDemoContent,
  articleLayoutInlineImageSource,
  articleLayoutMarkdownMediaBySource,
} from '@/app/(frontend)/dev/article-layout/articleLayoutDemo'
import {
  articleLayoutPresets,
  articleLayoutPresetTokenNames,
  defaultArticleLayoutPresetID,
} from '@/app/(frontend)/dev/article-layout/articleLayoutPresets'
import { buildCitationIndex } from '@/features/article/model/citations'
import { MarkdownRenderer } from '@/features/article/markdown'

describe('article layout lab', () => {
  it('defines the expected layout comparison presets', () => {
    expect(defaultArticleLayoutPresetID).toBe('compact-editorial')
    expect(articleLayoutPresets.map((preset) => preset.id)).toEqual([
      'compact-editorial',
      'balanced-editorial',
      'current',
    ])
  })

  it('defines a complete token set for each non-current preset', () => {
    const configurablePresets = articleLayoutPresets.filter((preset) => preset.id !== 'current')

    expect(configurablePresets).toHaveLength(2)

    for (const preset of configurablePresets) {
      expect(Object.keys(preset.tokens).sort()).toEqual([...articleLayoutPresetTokenNames].sort())
    }
  })

  it('renders a rich article fixture for layout comparison', () => {
    const html = renderToStaticMarkup(
      <MarkdownRenderer
        articleReferenceLabels={{
          fig: '图',
          tbl: '表',
        }}
        citationIndex={buildCitationIndex(articleLayoutDemoContent)}
        mediaBySource={articleLayoutMarkdownMediaBySource}
        source={articleLayoutDemoContent}
      />,
    )

    expect(articleLayoutDemoContent).not.toContain('## 一、')
    expect(articleLayoutDemoContent).not.toContain('## 二、')
    expect(articleLayoutDemoContent).not.toContain('## 三、')
    expect(articleLayoutDemoContent).not.toContain('## 四、')
    expect(articleLayoutMarkdownMediaBySource[articleLayoutInlineImageSource]?.caption).toContain(
      '图片块',
    )
    expect(html).toContain('<h2')
    expect(html).toContain('<h3')
    expect(html).toContain('<h4')
    expect(html).toContain('md-callout--note')
    expect(html).toContain('markdown-figure--image')
    expect(html).toContain('图 1. 这是一张用于观察图片块上下间距的示意图。')
    expect(html).toContain('markdown-figure--table')
    expect(html).toContain('表 1. 富文本块排版观察点')
    expect(html).toContain('data-language="tsx"')
    expect(html).toContain('data-markdown-component="notice-card"')
    expect(html).toContain('data-markdown-component="feature-grid"')
  })
})
