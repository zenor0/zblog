import { describe, expect, it } from 'vitest'

import { SiteSettings } from '@/globals/SiteSettings'

function collectFields(fields: any[]): any[] {
  return fields.flatMap((field) => [
    field,
    ...(Array.isArray(field.fields) ? collectFields(field.fields) : []),
    ...(Array.isArray(field.tabs)
      ? field.tabs.flatMap((tab: any) => collectFields(tab.fields ?? []))
      : []),
  ])
}

describe('Site settings footer config', () => {
  it('defines the rebuilt footer controls with a production-backed preview area', () => {
    const tabsField = SiteSettings.fields.find((field: any) => field.type === 'tabs') as any
    const footerTab = tabsField.tabs.find((tab: any) => tab.id === 'footer') as any
    const footerField = collectFields(footerTab.fields).find(
      (field: any) => field.name === 'footer',
    ) as any
    const layoutRow = footerField.fields[0] as any
    const controlsField = layoutRow.fields.find((field: any) => field.type === 'collapsible') as any
    const allFooterFields = collectFields(footerField.fields)

    expect(footerField.type).toBe('group')
    expect(layoutRow.type).toBe('row')
    expect(layoutRow.admin.className).toContain('site-settings-preview-grid')
    expect(controlsField.label).toBe('Footer controls')
    expect(controlsField.admin.className).toContain('site-settings-preview-grid__controls')
    expect(controlsField.fields[0].name).toBe('footerPresetActions')
    expect(controlsField.fields[0].admin.components.Field).toBe(
      '/features/site-settings/admin/SiteFooterPresetActions#SiteFooterPresetActions',
    )
    expect(controlsField.fields[1].name).toBe('footerEditorMode')
    expect(controlsField.fields[1].admin.components.Field).toBe(
      '/features/site-settings/admin/SiteSettingsSectionModeSwitch#SiteSettingsSectionModeSwitch',
    )
    expect(controlsField.fields[2].type).toBe('group')
    expect(
      controlsField.fields[2].admin.condition({}, { footerEditorMode: 'form' }, {} as any),
    ).toBe(true)
    expect(
      controlsField.fields[2].admin.condition({}, { footerEditorMode: 'yaml' }, {} as any),
    ).toBe(false)
    expect(controlsField.fields[2].fields.map((field: any) => field.name)).toEqual([
      'layoutStyle',
      'brand',
      'navigationSections',
      'socialLinks',
      'contactItems',
      'legalLinks',
      'compliance',
      'bottomBar',
    ])
    expect(controlsField.fields[3].name).toBe('footerRawConfig')
    expect(
      controlsField.fields[3].admin.condition({}, { footerEditorMode: 'yaml' }, {} as any),
    ).toBe(true)

    const previewField = allFooterFields.find((field: any) => field.name === 'footerPreview') as any
    const layoutStyleField = controlsField.fields[2].fields.find(
      (field: any) => field.name === 'layoutStyle',
    ) as any
    expect(layoutStyleField.defaultValue).toBe('compact')
    expect(layoutStyleField.options.map((option: any) => option.value)).toEqual([
      'compact',
      'directory',
      'ledger',
      'balanced',
    ])

    expect(previewField.type).toBe('ui')
    expect(previewField.admin.components.Field).toBe(
      '/features/site-settings/admin/SiteFooterPreview#SiteFooterPreview',
    )

    const brandField = allFooterFields.find((field: any) => field.name === 'brand') as any
    expect(brandField.admin.description).toContain('Top-left identity')
    expect(brandField.fields.map((field: any) => field.name)).toEqual([
      'logo',
      'name',
      'description',
      'supportingText',
      'link',
    ])

    const brandLinkField = brandField.fields.find((field: any) => field.name === 'link') as any
    expect(brandLinkField.fields.map((field: any) => field.name)).toEqual([
      'type',
      'internalPath',
      'externalUrl',
      'openInNewTab',
    ])

    const socialLinksField = allFooterFields.find(
      (field: any) => field.name === 'socialLinks',
    ) as any
    expect(socialLinksField.admin.description).toContain('Middle profile layer')
    expect(socialLinksField.fields.map((field: any) => field.name)).toEqual([
      'platform',
      'label',
      'url',
      'openInNewTab',
    ])
    expect(socialLinksField.fields.find((field: any) => field.name === 'label').required).toBe(true)

    const navigationSectionsField = allFooterFields.find(
      (field: any) => field.name === 'navigationSections',
    ) as any
    expect(navigationSectionsField.admin.description).toContain('Top directory layer')

    const legalLinksField = allFooterFields.find((field: any) => field.name === 'legalLinks') as any
    expect(legalLinksField.admin.description).toContain('Bottom-left metadata layer')

    const complianceField = allFooterFields.find((field: any) => field.name === 'compliance') as any
    const filingsField = complianceField.fields.find(
      (field: any) => field.name === 'filings',
    ) as any
    expect(
      filingsField.fields.find((field: any) => field.name === 'label').required,
    ).toBeUndefined()
    expect(
      filingsField.fields.find((field: any) => field.name === 'value').required,
    ).toBeUndefined()
  })
})
