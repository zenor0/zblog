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
    expect(preset.footer?.bottomBar?.note).toBe('Powered by Payload CMS and Next.js.')
    expect(preset.globalVariables?.owner?.name).toBe('Your Name')
    expect(preset.globalVariables?.socialLinks?.[0]?.url).toBe('https://github.com/your-id')
  })

  it('localizes starter labels for the active admin locale', () => {
    const preset = getStarterSiteFooterPreset('zh-Hans')

    expect(preset.footer?.navigationSections?.[0]?.title).toBe('阅读')
    expect(preset.footer?.navigationSections?.[0]?.links?.[0]?.label).toBe('文章')
    expect(preset.footer?.legalLinks?.[0]?.label).toBe('隐私政策')
    expect(preset.footer?.compliance?.copyright).toBe(
      'Copyright {{site.currentYear}} {{site.name}}. 保留所有权利。',
    )
    expect(preset.footer?.bottomBar?.note).toBe('由 Payload CMS 和 Next.js 驱动。')
    expect(preset.globalVariables?.owner?.name).toBe('你的名字')
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

    expect(merged?.socialLinks?.find((link) => link.platform === 'github')?.label).toBe('@your-id')
    expect(merged?.socialLinks?.find((link) => link.platform === 'github')?.url).toBe(
      'https://github.com/real',
    )
    expect(merged?.contactItems?.find((item) => item.key === 'email')?.label).toBe('Email')
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
