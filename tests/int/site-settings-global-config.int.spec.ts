import { describe, expect, it } from 'vitest'

import { SiteSettings } from '@/globals/SiteSettings'

function getTabsField() {
  return SiteSettings.fields.find((field: any) => field.type === 'tabs') as any
}

function collectFields(fields: any[]): any[] {
  return fields.flatMap((field) => [
    field,
    ...(Array.isArray(field.fields) ? collectFields(field.fields) : []),
    ...(Array.isArray(field.tabs)
      ? field.tabs.flatMap((tab: any) => collectFields(tab.fields ?? []))
      : []),
  ])
}

describe('site settings global config schema', () => {
  it('defines wizard-ready global variables in General', () => {
    const tabsField = getTabsField()
    const generalTab = tabsField.tabs.find((tab: any) => tab.id === 'general') as any
    const fields = collectFields(generalTab.fields)
    const globalVariables = fields.find((field: any) => field.name === 'globalVariables') as any
    const appearance = fields.find((field: any) => field.name === 'appearance') as any
    const siteName = fields.find((field: any) => field.name === 'siteName') as any

    expect(siteName.localized).toBe(true)
    expect(globalVariables.type).toBe('group')
    expect(globalVariables.fields.map((field: any) => field.name)).toEqual([
      'owner',
      'assets',
      'socialLinks',
      'contactItems',
      'customVariables',
    ])

    const owner = globalVariables.fields.find((field: any) => field.name === 'owner') as any
    expect(owner.fields.map((field: any) => field.name)).toEqual([
      'name',
      'handle',
      'email',
      'bio',
      'websiteUrl',
      'avatar',
    ])
    expect(owner.fields.find((field: any) => field.name === 'name').localized).toBe(true)
    expect(owner.fields.find((field: any) => field.name === 'bio').localized).toBe(true)

    const customVariables = globalVariables.fields.find(
      (field: any) => field.name === 'customVariables',
    ) as any
    expect(customVariables.fields.map((field: any) => field.name)).toEqual([
      'key',
      'value',
      'description',
    ])
    expect(typeof customVariables.fields.find((field: any) => field.name === 'key').validate).toBe(
      'function',
    )

    expect(appearance.type).toBe('group')
    expect(appearance.fields.map((field: any) => field.name)).toEqual(['accentColor'])
    expect(appearance.fields[0].defaultValue).toBe('oklch(0.62 0.14 190)')
    expect(typeof appearance.fields[0].validate).toBe('function')
  })

  it('exposes local Form/YAML switches without replacing preview layouts', () => {
    const tabsField = getTabsField()
    const expectedSections = [
      ['general', 'generalEditorMode', 'generalRawConfig'],
      ['homepage', 'homepageEditorMode', 'homepageRawConfig'],
      ['seo', 'seoEditorMode', 'seoRawConfig'],
      ['article-layout', 'articleLayoutEditorMode', 'articleLayoutRawConfig'],
      ['footer', 'footerEditorMode', 'footerRawConfig'],
    ] as const

    const sectionEditors = expectedSections.map(([tabID, modeName, rawName]) => {
      const tab = tabsField.tabs.find((item: any) => item.id === tabID) as any
      const fields = collectFields(tab.fields)
      const modeField = fields.find((field: any) => field.name === modeName) as any
      const rawEditor = fields.find((field: any) => field.name === rawName) as any
      const nestedTabs = fields.filter((field: any) => field.type === 'tabs')

      expect(nestedTabs).toHaveLength(0)
      expect(modeField.type).toBe('radio')
      expect(modeField.virtual).toBe(true)
      expect(modeField.defaultValue).toBe('form')
      expect(modeField.admin.components.Field).toBe(
        '/features/site-settings/admin/SiteSettingsSectionModeSwitch#SiteSettingsSectionModeSwitch',
      )
      expect(modeField.options.map((option: any) => option.value)).toEqual(['form', 'yaml'])
      expect(rawEditor.type).toBe('ui')
      expect(rawEditor.admin.condition({}, { [modeName]: 'yaml' }, {} as any)).toBe(true)
      expect(rawEditor.admin.condition({}, { [modeName]: 'form' }, {} as any)).toBe(false)

      return {
        modeField,
        rawEditor,
        tabID,
      }
    })

    expect(sectionEditors.map((item: any) => item.rawEditor.name)).toEqual([
      'generalRawConfig',
      'homepageRawConfig',
      'seoRawConfig',
      'articleLayoutRawConfig',
      'footerRawConfig',
    ])
    expect(
      sectionEditors.every(
        (item: any) =>
          item.rawEditor.admin.components.Field ===
          '/features/site-settings/admin/SiteSettingsRawSectionEditor#SiteSettingsRawSectionEditor',
      ),
    ).toBe(true)
  })

  it('blocks unknown template references before saving settings', async () => {
    const hook = SiteSettings.hooks?.beforeChange?.[0]

    await expect(
      hook?.({
        data: {
          siteName: 'ZBlog',
          homeHero: {
            title: '{{missing.value}}',
          },
        },
        req: {},
      } as any),
    ).rejects.toThrow(/Unknown site setting reference/)
  })
})
