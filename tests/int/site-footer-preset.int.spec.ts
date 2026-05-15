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
      'RSS',
    ])
    expect(preset.footer?.socialLinks?.map((link) => link.platform)).toEqual(['github', 'rss'])
    expect(preset.footer?.contactItems?.[0]?.value).toBe('{{contact.email.value}}')
    expect(preset.footer?.legalLinks?.map((link) => link.label)).toEqual(['Privacy'])
    expect(preset.footer?.compliance?.copyright).toBe(
      'Copyright {{site.currentYear}} {{site.name}}. All rights reserved.',
    )
    expect(preset.globalVariables?.owner?.name).toBe('Your Name')
    expect(preset.globalVariables?.socialLinks?.[0]?.url).toBe('https://github.com/your-id')
  })

  it('localizes starter labels for the active admin locale', () => {
    const preset = getStarterSiteFooterPreset('zh-Hans')

    expect(preset.footer?.navigationSections?.[0]?.title).toBe('阅读')
    expect(preset.footer?.navigationSections?.[0]?.links?.[0]?.label).toBe('文章')
    expect(preset.footer?.legalLinks?.[0]?.label).toBe('隐私政策')
    expect(preset.globalVariables?.customVariables?.[0]?.value).toBe(
      '持续记录技术、产品与日常工作。',
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
    expect(merged?.owner?.handle).toBe('@your-id')
    expect(merged?.socialLinks?.find((link) => link.platform === 'github')?.url).toBe(
      'https://github.com/real',
    )
    expect(merged?.socialLinks?.find((link) => link.platform === 'rss')?.url).toBe('/rss.xml')
    expect(merged?.contactItems?.find((item) => item.key === 'email')?.value).toBe(
      'hello@example.com',
    )
  })
})
