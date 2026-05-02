import { describe, expect, it } from 'vitest'

import { SiteSettings } from '@/globals/SiteSettings'
import {
  articleLayoutPresets,
  defaultArticleLayoutPresetID,
  resolveArticleLayoutConfig,
} from '@/lib/article-layout'

describe('article layout settings', () => {
  it('exposes article layout preset and advanced overrides in site settings', () => {
    const articleLayoutField = SiteSettings.fields.find(
      (field: any) => field.name === 'articleLayout',
    ) as any

    expect(articleLayoutField.type).toBe('group')
    expect(articleLayoutField.fields.map((field: any) => field.name)).toEqual([
      'preset',
      'advanced',
    ])

    const presetField = articleLayoutField.fields.find((field: any) => field.name === 'preset') as any

    expect(presetField.defaultValue).toBe(defaultArticleLayoutPresetID)
    expect(presetField.options.map((option: any) => option.value)).toEqual(
      articleLayoutPresets.map((preset) => preset.id),
    )

    const advancedField = articleLayoutField.fields.find(
      (field: any) => field.name === 'advanced',
    ) as any

    expect(advancedField.fields.map((field: any) => field.name)).toEqual([
      'contentWidth',
      'bodyFontSize',
      'bodyLineHeight',
      'paragraphGap',
      'flowGap',
      'blockGap',
      'captionGap',
      'gridGap',
    ])
  })

  it('resolves preset tokens and safe advanced overrides into CSS variables', () => {
    const resolved = resolveArticleLayoutConfig({
      preset: 'prose-baseline',
      advanced: {
        blockGap: '1.8rem',
        bodyLineHeight: '1.68',
        captionGap: '6px',
        contentWidth: '70ch',
        paragraphGap: 'url(javascript:alert(1))',
      },
    })

    expect(resolved.presetID).toBe('prose-baseline')
    expect(resolved.style['--article-layout-reading-column-max']).toBe('70ch')
    expect(resolved.style['--article-layout-copy-max-width']).toBe('70ch')
    expect(resolved.style['--article-layout-block-gap']).toBe('1.8rem')
    expect(resolved.style['--article-layout-caption-gap']).toBe('6px')
    expect(resolved.style['--article-layout-copy-line-height']).toBe('1.68')
    expect(resolved.style['--article-layout-paragraph-gap']).toBe('1rem')
  })

  it('falls back to the default preset for missing or unknown values', () => {
    expect(resolveArticleLayoutConfig(null).presetID).toBe(defaultArticleLayoutPresetID)
    expect(resolveArticleLayoutConfig({ preset: 'unknown' }).presetID).toBe(
      defaultArticleLayoutPresetID,
    )
  })
})
