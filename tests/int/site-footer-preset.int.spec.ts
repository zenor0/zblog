import { describe, expect, it } from 'vitest'

import {
  getStarterSiteFooterPreset,
  mergeStarterGlobalVariables,
} from '@/features/site-settings/model/site-footer-preset'

describe('site footer starter preset', () => {
  it('builds a generic blog footer from editable shared variables', () => {
    const preset = getStarterSiteFooterPreset('en')

    expect(preset.footer?.layoutStyle).toBe('balanced')
    expect(preset.footer?.brand?.name).toBe('{{site.name}}')
    expect(preset.footer?.brand?.description).toBe('{{site.description}}')
    expect(preset.footer?.brand?.supportingText).toBe('{{custom.tagline}}')
    expect(preset.footer?.navigationSections?.[0]?.links?.map((link) => link.label)).toEqual([
      'Posts',
      'Archive',
    ])
    expect(preset.footer?.socialLinks).toEqual([])
    expect(preset.footer?.contactItems).toEqual([])
    expect(preset.footer?.legalLinks?.map((link) => link.label)).toEqual(['Privacy'])
    expect(preset.footer?.compliance?.copyright).toBe(
      'Copyright {{site.currentYear}} {{site.name}}. All rights reserved.',
    )
    expect(JSON.stringify(preset)).not.toMatch(/your-id|hello@example\.com|example\.com/)
  })

  it('localizes starter labels for the active admin locale', () => {
    const preset = getStarterSiteFooterPreset('zh-Hans')

    expect(preset.footer?.navigationSections?.[0]?.title).toBe('阅读')
    expect(preset.footer?.navigationSections?.[0]?.links?.[0]?.label).toBe('文章')
    expect(preset.footer?.legalLinks?.[0]?.label).toBe('隐私政策')
    expect(preset.footer?.compliance?.copyright).toBe(
      'Copyright {{site.currentYear}} {{site.name}}. 保留所有权利。',
    )
    expect(preset.globalVariables?.customVariables?.[0]?.value).toBe(
      '持续记录技术、产品与日常工作。',
    )
  })

  it('fills missing localized values inside existing keyed variable rows', () => {
    const preset = getStarterSiteFooterPreset('en')
    const merged = mergeStarterGlobalVariables(
      {
        contactItems: [
          {
            key: 'email',
            url: 'mailto:real@example.com',
          },
        ],
        customVariables: [
          {
            description: 'Existing description',
            key: 'tagline',
          },
        ],
        socialLinks: [
          {
            platform: 'github',
            url: 'https://github.com/real',
          },
        ],
      },
      preset.globalVariables,
    )

    expect(merged?.socialLinks?.find((link) => link.platform === 'github')?.label).toBeUndefined()
    expect(merged?.socialLinks?.find((link) => link.platform === 'github')?.url).toBe(
      'https://github.com/real',
    )
    expect(merged?.contactItems?.find((item) => item.key === 'email')?.label).toBeUndefined()
    expect(merged?.contactItems?.find((item) => item.key === 'email')?.url).toBe(
      'mailto:real@example.com',
    )
    expect(merged?.customVariables?.find((item) => item.key === 'tagline')?.value).toBe(
      'Notes about technology, products, and everyday work.',
    )
    expect(merged?.customVariables?.find((item) => item.key === 'tagline')?.description).toBe(
      'Existing description',
    )
  })

  it('adds starter variables without overwriting existing editor data', () => {
    const preset = getStarterSiteFooterPreset('en')
    const merged = mergeStarterGlobalVariables(
      {
        owner: {
          email: 'real@example.com',
          name: 'Existing Owner',
        },
        socialLinks: [
          {
            label: '@real',
            platform: 'github',
            url: 'https://github.com/real',
          },
        ],
      },
      preset.globalVariables,
    )

    expect(merged?.owner?.name).toBe('Existing Owner')
    expect(merged?.owner?.email).toBe('real@example.com')
    expect(merged?.owner?.handle).toBeUndefined()
    expect(merged?.socialLinks?.find((link) => link.platform === 'github')?.url).toBe(
      'https://github.com/real',
    )
    expect(merged?.socialLinks?.find((link) => link.platform === 'rss')).toBeUndefined()
    expect(merged?.contactItems?.find((item) => item.key === 'email')).toBeUndefined()
  })
})
