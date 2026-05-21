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

    expect(en.siteName).toBe('zblog')
    expect(en.siteDescription).toBe('')
    expect(en.homeHero?.title).toBe('Notes on tech, products, and everyday work')
    expect(en.seo?.homeTitle).toBe('ZBlog | Notes on tech, products, and everyday work')
    expect(en.appearance?.accentColor).toBe('oklch(0.64 0.14 220)')
    expect(en.articleLayout?.advanced?.blockGap).toBe('0.5rem')
    expect(en.footer?.bottomBar?.note).toBe('')
    expect(en.footer?.compliance?.filings).toEqual([
      {
        href: 'https://beian.miit.gov.cn',
        label: '',
        value: '中 ICP 备 20xx123456 号',
      },
      {
        href: 'https://github.com/zenor0/zblog',
        label: '',
        value: 'Powered by zblog',
      },
    ])
    expect(en.footer?.layoutStyle).toBe('balanced')
    expect(en.footer?.legalLinks).toMatchObject([
      {
        label: 'Privacy',
        link: {
          internalPath: '/privacy',
          openInNewTab: false,
          type: 'internal',
        },
      },
      {
        label: 'Terms',
        link: {
          internalPath: '/terms',
          openInNewTab: false,
          type: 'internal',
        },
      },
      {
        label: 'RSS',
        link: {
          internalPath: '/rss.xml',
          openInNewTab: false,
          type: 'internal',
        },
      },
      {
        label: 'Sitemap',
        link: {
          externalUrl: '/sitemap.xml',
          openInNewTab: false,
          type: 'external',
        },
      },
    ])
    expect(en.footer?.legalLinks?.map((link) => link.link.type)).toEqual([
      'internal',
      'internal',
      'internal',
      'external',
    ])
    expect(en.footer?.socialLinks).toEqual([
      {
        label: '@zenor0',
        openInNewTab: true,
        platform: 'github',
        url: 'https://github.com/zenor0',
      },
      {
        label: 'zenor0@outlook.com',
        openInNewTab: true,
        platform: 'email',
        url: 'mailto:zenor0@outlook.com',
      },
    ])
    expect(en.globalVariables?.owner?.email).toBe('zenor0@outlook.com')
    expect(en.globalVariables?.owner?.handle).toBe('@zenor0')
    expect(en.globalVariables?.owner?.websiteUrl).toBe('blog.zenor0.site')
    expect(en.globalVariables?.socialLinks).toEqual([
      {
        label: '@zenor0',
        openInNewTab: true,
        platform: 'github',
        url: 'https://github.com/zenor0',
      },
    ])
    expect(en.globalVariables?.contactItems).toEqual([])
    expect(en.globalVariables?.customVariables?.[0]?.value).toBe(
      'Notes about technology, products, and everyday work.',
    )
    expect(JSON.stringify(en)).not.toMatch(/your-id|hello@example\.com|example\.com/)

    expect(zh.siteName).toBe('zblog')
    expect(zh.siteDescription).toBe('')
    expect(zh.globalVariables?.owner?.bio).toBe('你好，世界。')
    expect(zh.globalVariables?.owner?.name).toBe('zenor0')
    expect(zh.homeHero?.description).toBe('你好，世界。')
    expect(zh.homeHero?.title).toBe('坏坏学习')
    expect(zh.seo?.homeDescription).toBe('一个持续记录技术、产品与日常工作的博客。')
    expect(zh.seo?.homeTitle).toBe('ZBlog')
    expect(zh.footer?.bottomBar?.note).toBe('')
    expect(zh.footer?.compliance?.copyright).toBe(
      'Copyright {{site.currentYear}} {{site.name}}. 保留所有权利。',
    )
    expect(zh.footer?.legalLinks?.map((link) => link.label)).toEqual([
      '隐私政策',
      '用户协议',
      'RSS',
      '站点地图',
    ])
    expect(zh.globalVariables?.customVariables?.[0]?.value).toBe('持续记录技术、产品与日常工作。')
    expect(zh.globalVariables?.customVariables?.[1]?.value).toBe('hidden')
  })

  it('does not overwrite existing current-locale editor copy or settings while filling gaps', () => {
    const data = buildSeedSiteSettingsData({
      locale: 'en',
      settings: {
        appearance: {
          accentColor: '#123456',
        },
        articleLayout: {
          advanced: {
            blockGap: '2rem',
          },
          preset: 'balanced-editorial',
        },
        footer: {
          bottomBar: {
            note: 'Existing footer note.',
          },
          socialLinks: [
            {
              label: '@real',
              platform: 'github',
              url: 'https://github.com/real-footer',
            },
          ],
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
    expect(data.homeHero?.description).toBe(
      'A simple blog for articles, notes, and project updates.',
    )
    expect(data.appearance?.accentColor).toBe('#123456')
    expect(data.articleLayout?.advanced?.blockGap).toBe('2rem')
    expect(data.articleLayout?.preset).toBe('balanced-editorial')
    expect(data.footer?.bottomBar?.note).toBe('Existing footer note.')
    expect(data.footer?.legalLinks?.map((link) => link.label)).toEqual([
      'Privacy',
      'Terms',
      'RSS',
      'Sitemap',
    ])
    expect(data.footer?.socialLinks?.[0]?.label).toBe('@real')
    expect(data.footer?.socialLinks?.[0]?.url).toBe('https://github.com/real-footer')
    expect(data.footer?.socialLinks?.[1]?.platform).toBe('email')
    expect(data.globalVariables?.owner?.name).toBe('Existing Owner')
    expect(data.globalVariables?.owner?.email).toBe('real@example.com')
    expect(data.globalVariables?.socialLinks?.[0]?.label).toBe('@zenor0')
    expect(data.globalVariables?.socialLinks?.[0]?.url).toBe('https://github.com/real')
  })

  it('replaces Payload schema defaults with the seeded current site configuration', () => {
    const data = buildSeedSiteSettingsData({
      locale: 'zh-Hans',
      settings: {
        appearance: {
          accentColor: 'oklch(0.62 0.14 190)',
        },
        footer: {
          brand: {
            description: '{{site.description}}',
            link: {
              internalPath: '/',
              openInNewTab: false,
              type: 'internal',
            },
            name: '{{site.name}}',
            supportingText: '{{custom.tagline}}',
          },
          layoutStyle: 'compact',
          legalLinks: [
            {
              label: '隐私政策',
              link: {
                internalPath: '/privacy',
                openInNewTab: false,
                type: 'internal',
              },
            },
            {
              label: '用户协议',
              link: {
                internalPath: '/terms',
                openInNewTab: false,
                type: 'internal',
              },
            },
          ],
        },
        homeHero: {
          description: '这里会持续发布文章、笔记和项目更新。',
          eyebrow: '个人博客',
          title: '记录技术、产品与日常思考',
        },
        siteDescription: '一个持续记录技术、产品与日常工作的双语博客。',
        siteName: 'Personal Blog',
      } as any,
    })

    expect(data.siteName).toBe('zblog')
    expect(data.siteDescription).toBe('')
    expect(data.homeHero?.description).toBe('你好，世界。')
    expect(data.homeHero?.title).toBe('坏坏学习')
    expect(data.appearance?.accentColor).toBe('oklch(0.64 0.14 220)')
    expect(data.footer?.layoutStyle).toBe('balanced')
    expect(data.footer?.legalLinks?.map((link) => link.label)).toEqual([
      '隐私政策',
      '用户协议',
      'RSS',
      '站点地图',
    ])
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
    expect(enUpdate?.data.footer.bottomBar.note).toBe('')
    expect(enUpdate?.data.globalVariables.socialLinks).toEqual([
      {
        label: '@zenor0',
        openInNewTab: true,
        platform: 'github',
        url: 'https://github.com/zenor0',
      },
    ])
  })
})
