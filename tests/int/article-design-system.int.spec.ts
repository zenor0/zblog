import { describe, expect, it } from 'vitest'

import {
  articleBlockRegistry,
  articleDesignPresets,
  defaultArticleDesignPresetID,
  getArticleBlockDefinition,
  resolveArticleDesignConfig,
} from '@/features/article/model/article-design'

describe('article design system', () => {
  it('resolves the compact editorial preset into typography, rhythm, and block tokens', () => {
    const resolved = resolveArticleDesignConfig(null)

    expect(resolved.presetID).toBe(defaultArticleDesignPresetID)
    expect(resolved.style['--article-layout-heading-font-family']).toContain('Newsreader')
    expect(resolved.style['--article-layout-heading-font-family']).toContain('Noto Serif SC')
    expect(resolved.style['--article-layout-latin-font-family']).toContain('Source Sans 3')
    expect(resolved.style['--article-layout-cjk-font-family']).toContain('Noto Sans SC')
    expect(resolved.style['--article-layout-code-font-family']).toContain('JetBrains Mono')
    expect(resolved.style['--article-layout-copy-line-height']).toBe('1.62')
    expect(resolved.style['--article-layout-paragraph-gap']).toBe('0.95rem')
    expect(resolved.style['--article-block-strong-font-weight']).toBe('650')
    expect(resolved.style['--article-block-quote-padding-left']).toBe('1.1rem')
  })

  it('keeps presets code-owned and exposes all expected article block definitions', () => {
    expect(articleDesignPresets.map((preset) => preset.id)).toEqual([
      'compact-editorial',
      'balanced-editorial',
      'current',
    ])
    expect(Object.keys(articleBlockRegistry)).toEqual([
      'paragraph',
      'heading',
      'list',
      'blockquote',
      'callout',
      'inline-code',
      'code-block',
      'figure',
      'media',
      'table',
      'citation-link',
      'notice-card',
      'feature-grid',
      'divider',
    ])
    expect(getArticleBlockDefinition('code-block')).toMatchObject({
      className: 'markdown-codeblock',
      id: 'code-block',
      tokenNamespace: '--article-block-code',
    })
  })

  it('uses safe overrides without allowing arbitrary block-level visual configuration', () => {
    const resolved = resolveArticleDesignConfig({
      advanced: {
        bodyLineHeight: '1.58',
        paragraphGap: '1.1rem',
      },
      preset: 'compact-editorial',
      typography: {
        codeFont: 'jetbrains-mono',
        headingFont: 'editorial-serif',
      },
    })

    expect(resolved.style['--article-layout-copy-line-height']).toBe('1.58')
    expect(resolved.style['--article-layout-paragraph-gap']).toBe('1.1rem')
    expect(resolved.style['--article-layout-code-font-family']).toContain('JetBrains Mono')
    expect(resolved.style['--article-layout-heading-font-family']).toContain('Newsreader')
    expect(Object.keys(resolved.style).some((key) => key.includes('arbitrary'))).toBe(false)
  })
})
