import { describe, expect, it, vi } from 'vitest'

import {
  buildSeedSiteSettingsData,
  seedSiteSettings,
} from '@/features/site-settings/seed/seed-site-settings'

describe('seed site settings', () => {
  it('builds complete localized public copy for each supported locale', () => {
    const en = buildSeedSiteSettingsData({
      locale: 'en',
      settings: {
        footer: null,
        globalVariables: {},
      } as any,
    })
    const zh = buildSeedSiteSettingsData({
      locale: 'zh-Hans',
      settings: {
        footer: null,
        globalVariables: {},
      } as any,
    })

    expect(en.siteName).toBe('ZBlog')
    expect(en.siteDescription).toBe('A bilingual blog about tech, products, and everyday work.')
    expect(en.homeHero?.title).toBe('Notes on tech, products, and everyday work')
    expect(en.seo?.homeTitle).toBe('ZBlog | Notes on tech, products, and everyday work')
    expect(en.footer?.bottomBar?.note).toBe('Powered by Payload CMS and Next.js.')
    expect(en.globalVariables?.owner?.name).toBe('Your Name')
    expect(en.globalVariables?.customVariables?.[0]?.value).toBe(
      'Notes about technology, products, and everyday work.',
    )

    expect(zh.siteName).toBe('ZBlog')
    expect(zh.siteDescription).toBe('一个持续记录技术、产品与日常工作的双语博客。')
    expect(zh.homeHero?.title).toBe('记录技术、产品与日常思考')
    expect(zh.seo?.homeTitle).toBe('ZBlog | 记录技术、产品与日常思考')
    expect(zh.footer?.bottomBar?.note).toBe('由 Payload CMS 和 Next.js 驱动。')
    expect(zh.globalVariables?.owner?.name).toBe('你的名字')
    expect(zh.globalVariables?.customVariables?.[0]?.value).toBe(
      '持续记录技术、产品与日常工作。',
    )
  })

  it('does not overwrite existing current-locale editor copy while filling gaps', () => {
    const data = buildSeedSiteSettingsData({
      locale: 'en',
      settings: {
        footer: {
          bottomBar: {
            note: 'Existing footer note.',
          },
        },
        globalVariables: {
          owner: {
            email: 'real@example.com',
            name: 'Existing Owner',
          },
          socialLinks: [
            {
              platform: 'github',
              url: 'https://github.com/real',
            },
          ],
        },
        homeHero: {
          title: 'Existing hero title',
        },
        siteDescription: 'Existing site description.',
        siteName: 'Existing Site',
      } as any,
    })

    expect(data.siteName).toBe('Existing Site')
    expect(data.siteDescription).toBe('Existing site description.')
    expect(data.homeHero?.title).toBe('Existing hero title')
    expect(data.homeHero?.description).toBe('A simple blog for articles, notes, and project updates.')
    expect(data.footer?.bottomBar?.note).toBe('Existing footer note.')
    expect(data.globalVariables?.owner?.name).toBe('Existing Owner')
    expect(data.globalVariables?.owner?.email).toBe('real@example.com')
    expect(data.globalVariables?.socialLinks?.[0]?.label).toBe('@your-id')
    expect(data.globalVariables?.socialLinks?.[0]?.url).toBe('https://github.com/real')
  })

  it('reads each locale without fallback before applying seed settings', async () => {
    const payload = {
      findGlobal: vi.fn(async (_args: any) => ({
        footer: null,
        globalVariables: {},
      })),
      updateGlobal: vi.fn(async (_args: any) => ({})),
    }

    await seedSiteSettings(payload as any)

    expect(payload.findGlobal).toHaveBeenCalledWith({
      slug: 'site-settings',
      depth: 1,
      fallbackLocale: false,
      locale: 'zh-Hans',
    })
    expect(payload.findGlobal).toHaveBeenCalledWith({
      slug: 'site-settings',
      depth: 1,
      fallbackLocale: false,
      locale: 'en',
    })
    expect(payload.updateGlobal).toHaveBeenCalledTimes(2)

    const enUpdate = payload.updateGlobal.mock.calls.find(
      ([args]) => args.locale === 'en',
    )?.[0] as any

    expect(enUpdate?.data.homeHero.title).toBe('Notes on tech, products, and everyday work')
    expect(enUpdate?.data.footer.bottomBar.note).toBe('Powered by Payload CMS and Next.js.')
  })
})
