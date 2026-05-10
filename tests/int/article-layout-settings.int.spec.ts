import { describe, expect, it } from 'vitest'

import { SiteSettings } from '@/globals/SiteSettings'
import {
  articleDesignAdvancedControlConfigs,
  articleDesignCJKFontOptions,
  articleDesignCodeFontOptions,
  articleDesignHeadingFontOptions,
  articleDesignLatinFontOptions,
  articleDesignPresets,
  defaultArticleDesignPresetID,
  resolveArticleDesignConfig,
} from '@/lib/article-design'

function collectFields(fields: any[]): any[] {
  return fields.flatMap((field) => [
    field,
    ...(Array.isArray(field.fields) ? collectFields(field.fields) : []),
    ...(Array.isArray(field.tabs)
      ? field.tabs.flatMap((tab: any) => collectFields(tab.fields ?? []))
      : []),
  ])
}

describe('article layout settings', () => {
  it('exposes compact article design controls and live preview in site settings', () => {
    const tabsField = SiteSettings.fields.find((field: any) => field.type === 'tabs') as any
    const articleLayoutTab = tabsField.tabs.find((tab: any) => tab.id === 'article-layout') as any
    const articleLayoutField = collectFields(articleLayoutTab.fields).find(
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
    expect(controlsField.label).toBe('Article design controls')
    expect(controlsField.admin.width).toBeUndefined()
    expect(controlsField.fields[0].name).toBe('articleLayoutEditorMode')
    expect(controlsField.fields[0].admin.components.Field).toBe(
      '/components/payload/SiteSettingsSectionModeSwitch#SiteSettingsSectionModeSwitch',
    )
    expect(controlsField.fields[1].type).toBe('group')
    expect(
      controlsField.fields[1].admin.condition({}, { articleLayoutEditorMode: 'form' }, {} as any),
    ).toBe(true)
    expect(
      controlsField.fields[1].admin.condition({}, { articleLayoutEditorMode: 'yaml' }, {} as any),
    ).toBe(false)
    expect(controlsField.fields[2].name).toBe('articleLayoutRawConfig')
    expect(
      controlsField.fields[2].admin.condition({}, { articleLayoutEditorMode: 'yaml' }, {} as any),
    ).toBe(true)

    const presetField = allLayoutFields.find((field: any) => field.name === 'preset') as any

    expect(presetField.defaultValue).toBe(defaultArticleDesignPresetID)
    expect(presetField.options.map((option: any) => option.value)).toEqual(
      articleDesignPresets.map((preset) => preset.id),
    )

    const typographyField = allLayoutFields.find((field: any) => field.name === 'typography') as any

    expect(typographyField.type).toBe('group')
    expect(typographyField.fields.map((field: any) => field.name)).toEqual([
      'latinFont',
      'cjkFont',
      'headingFont',
      'codeFont',
    ])
    expect(articleDesignLatinFontOptions.length).toBeGreaterThanOrEqual(5)
    expect(articleDesignCJKFontOptions.length).toBeGreaterThanOrEqual(5)
    expect(articleDesignHeadingFontOptions.length).toBeGreaterThanOrEqual(4)
    expect(articleDesignCodeFontOptions.length).toBeGreaterThanOrEqual(4)
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
    expect(advancedField.fields.every((field: any) => field.type === 'text')).toBe(true)
    expect(
      advancedField.fields.every(
        (field: any) =>
          field.admin.components.Field ===
          '/components/payload/ArticleDesignRangeField#ArticleDesignRangeField',
      ),
    ).toBe(true)
    expect(articleDesignAdvancedControlConfigs.map((config) => config.name)).toEqual(
      advancedField.fields.map((field: any) => field.name),
    )

    const previewField = allLayoutFields.find((field: any) => field.name === 'preview') as any

    expect(previewField.type).toBe('ui')
    expect(previewField.admin.width).toBeUndefined()
    expect(previewField.admin.components.Field).toBe(
      '/components/payload/ArticleLayoutPreview#ArticleLayoutPreview',
    )
  })

  it('resolves preset tokens and safe advanced overrides into CSS variables', () => {
    const resolved = resolveArticleDesignConfig({
      preset: 'balanced-editorial',
      advanced: {
        blockGap: '1.8rem',
        bodyLineHeight: '1.68',
        captionGap: '6px',
        contentWidth: '70ch',
        paragraphGap: 'url(javascript:alert(1))',
      },
    })

    expect(resolved.presetID).toBe('balanced-editorial')
    expect(resolved.style['--article-layout-reading-column-max']).toBe('70ch')
    expect(resolved.style['--article-layout-copy-max-width']).toBe('70ch')
    expect(resolved.style['--article-layout-block-gap']).toBe('1.8rem')
    expect(resolved.style['--article-layout-caption-gap']).toBe('6px')
    expect(resolved.style['--article-layout-copy-line-height']).toBe('1.68')
    expect(resolved.style['--article-layout-paragraph-gap']).toBe('0.95rem')
  })

  it('resolves richer controlled typography options into article font tokens', () => {
    const resolved = resolveArticleDesignConfig({
      preset: 'compact-editorial',
      typography: {
        cjkFont: 'source-han-serif-sc',
        codeFont: 'ui-mono',
        headingFont: 'system-serif',
        latinFont: 'system-sans',
      },
    })

    expect(resolved.style['--article-layout-latin-font-family']).toContain('system-ui')
    expect(resolved.style['--article-layout-cjk-font-family']).toContain('Source Han Serif SC')
    expect(resolved.style['--article-layout-heading-font-family']).toContain('Georgia')
    expect(resolved.style['--article-layout-code-font-family']).toContain('ui-monospace')
  })

  it('resolves controlled typography settings into article font tokens', () => {
    const resolved = resolveArticleDesignConfig({
      preset: 'compact-editorial',
      typography: {
        cjkFont: 'noto-sans-sc',
        codeFont: 'jetbrains-mono',
        headingFont: 'editorial-serif',
        latinFont: 'source-sans-3',
      },
    })

    expect(resolved.style['--article-layout-latin-font-family']).toContain('Source Sans 3')
    expect(resolved.style['--article-layout-latin-font-family']).not.toMatch(
      /\b(?:sans-serif|serif)\b/,
    )
    expect(resolved.style['--article-layout-cjk-font-family']).toContain('Noto Sans SC')
    expect(resolved.style['--article-layout-heading-font-family']).toContain('Newsreader')
    expect(resolved.style['--article-layout-code-font-family']).toContain('JetBrains Mono')
  })

  it('falls back to the default preset for missing or unknown values', () => {
    expect(resolveArticleDesignConfig(null).presetID).toBe(defaultArticleDesignPresetID)
    expect(resolveArticleDesignConfig({ preset: 'unknown' }).presetID).toBe(
      defaultArticleDesignPresetID,
    )
  })
})
