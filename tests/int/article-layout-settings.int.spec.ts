import { describe, expect, it } from 'vitest'

import { SiteSettings } from '@/globals/SiteSettings'
import {
  articleLayoutPresets,
  defaultArticleLayoutPresetID,
  resolveArticleLayoutConfig,
} from '@/lib/article-layout'

function collectFields(fields: any[]): any[] {
  return fields.flatMap((field) => [
    field,
    ...(Array.isArray(field.fields) ? collectFields(field.fields) : []),
  ])
}

describe('article layout settings', () => {
  it('exposes compact article layout controls and live preview in site settings', () => {
    const tabsField = SiteSettings.fields.find((field: any) => field.type === 'tabs') as any
    const articleLayoutTab = tabsField.tabs.find((tab: any) => tab.id === 'article-layout') as any
    const articleLayoutField = articleLayoutTab.fields.find(
      (field: any) => field.name === 'articleLayout',
    ) as any
    const layoutRow = articleLayoutField.fields[0] as any
    const controlsField = layoutRow.fields.find((field: any) => field.type === 'collapsible') as any
    const allLayoutFields = collectFields(articleLayoutField.fields)

    expect(tabsField.tabs.map((tab: any) => tab.id)).toEqual([
      'general',
      'homepage',
      'seo',
      'article-layout',
      'footer',
    ])
    expect(articleLayoutField.type).toBe('group')
    expect(layoutRow.type).toBe('row')
    expect(layoutRow.admin.className).toBe('article-layout-settings-grid')
    expect(controlsField.label).toBe('Layout controls')
    expect(controlsField.admin.width).toBeUndefined()

    const presetField = allLayoutFields.find((field: any) => field.name === 'preset') as any

    expect(presetField.defaultValue).toBe(defaultArticleLayoutPresetID)
    expect(presetField.options.map((option: any) => option.value)).toEqual(
      articleLayoutPresets.map((preset) => preset.id),
    )

    const typographyField = allLayoutFields.find((field: any) => field.name === 'typography') as any

    expect(typographyField.type).toBe('group')
    expect(typographyField.fields.map((field: any) => field.name)).toEqual([
      'latinFont',
      'cjkFont',
      'headingFont',
      'codeFont',
    ])
    expect(typographyField.fields.every((field: any) => field.admin.width === '50%')).toBe(true)

    const advancedField = allLayoutFields.find((field: any) => field.name === 'advanced') as any

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
    expect(advancedField.admin.width).toBe('100%')
    expect(advancedField.fields.every((field: any) => field.admin.width === '50%')).toBe(true)

    const previewField = allLayoutFields.find((field: any) => field.name === 'preview') as any

    expect(previewField.type).toBe('ui')
    expect(previewField.admin.width).toBeUndefined()
    expect(previewField.admin.components.Field).toBe(
      '/components/payload/ArticleLayoutPreview#ArticleLayoutPreview',
    )
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

  it('resolves controlled typography settings into article font tokens', () => {
    const resolved = resolveArticleLayoutConfig({
      preset: 'dense-technical',
      typography: {
        cjkFont: 'songti-serif',
        codeFont: 'technical-mono',
        headingFont: 'display-serif',
        latinFont: 'literary-serif',
      },
    })

    expect(resolved.style['--article-layout-latin-font-family']).toContain('Georgia')
    expect(resolved.style['--article-layout-cjk-font-family']).toContain('Songti SC')
    expect(resolved.style['--article-layout-heading-font-family']).toContain('var(--font-serif)')
    expect(resolved.style['--article-layout-code-font-family']).toContain('JetBrains Mono')
  })

  it('falls back to the default preset for missing or unknown values', () => {
    expect(resolveArticleLayoutConfig(null).presetID).toBe(defaultArticleLayoutPresetID)
    expect(resolveArticleLayoutConfig({ preset: 'unknown' }).presetID).toBe(
      defaultArticleLayoutPresetID,
    )
  })
})
