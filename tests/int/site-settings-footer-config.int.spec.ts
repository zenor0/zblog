import { describe, expect, it } from 'vitest'

import { SiteSettings } from '@/globals/SiteSettings'

describe('Site settings footer config', () => {
  it('defines the rebuilt footer groups and reusable link shape', () => {
    const tabsField = SiteSettings.fields.find((field: any) => field.type === 'tabs') as any
    const footerTab = tabsField.tabs.find((tab: any) => tab.id === 'footer') as any
    const footerField = footerTab.fields.find((field: any) => field.name === 'footer') as any

    expect(footerField.type).toBe('group')
    expect(footerField.fields.map((field: any) => field.name)).toEqual([
      'layoutStyle',
      'brand',
      'navigationSections',
      'socialLinks',
      'contactItems',
      'legalLinks',
      'compliance',
      'bottomBar',
    ])

    const layoutStyleField = footerField.fields.find(
      (field: any) => field.name === 'layoutStyle',
    ) as any
    expect(layoutStyleField.defaultValue).toBe('compact')
    expect(layoutStyleField.options.map((option: any) => option.value)).toEqual([
      'compact',
      'directory',
      'ledger',
      'balanced',
    ])

    const brandField = footerField.fields.find((field: any) => field.name === 'brand') as any
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

    const socialLinksField = footerField.fields.find(
      (field: any) => field.name === 'socialLinks',
    ) as any
    expect(socialLinksField.fields.map((field: any) => field.name)).toEqual([
      'platform',
      'label',
      'url',
      'openInNewTab',
    ])
  })
})
