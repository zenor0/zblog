import { beforeEach, describe, expect, it, vi } from 'vitest'

const payloadMocks = vi.hoisted(() => ({
  findGlobal: vi.fn(),
  getPayloadClient: vi.fn(),
}))

vi.mock('@/lib/payload', () => ({
  getPayloadClient: payloadMocks.getPayloadClient,
}))

import { getResolvedSiteSettings } from '@/lib/site-settings'

describe('resolved site settings loader', () => {
  beforeEach(() => {
    payloadMocks.findGlobal.mockReset()
    payloadMocks.getPayloadClient.mockReset()
    payloadMocks.getPayloadClient.mockResolvedValue({
      findGlobal: payloadMocks.findGlobal,
    })
  })

  it('returns display-ready settings with shared variable references resolved', async () => {
    payloadMocks.findGlobal.mockResolvedValue({
      siteName: 'ZBlog',
      globalVariables: {
        owner: {
          name: 'Zenoro',
        },
      },
      footer: {
        brand: {
          name: '{{site.name}}',
        },
      },
      homeHero: {
        title: '{{site.name}} by {{owner.name}}',
      },
      seo: {
        homeTitle: '{{site.name}}',
      },
    })

    const settings = await getResolvedSiteSettings('en')

    expect(settings.homeHero?.title).toBe('ZBlog by Zenoro')
    expect(settings.footer?.brand?.name).toBe('ZBlog')
    expect(settings.seo?.homeTitle).toBe('ZBlog')
    expect(payloadMocks.findGlobal).toHaveBeenCalledWith({
      slug: 'site-settings',
      depth: 1,
      fallbackLocale: 'zh-Hans',
      locale: 'en',
    })
  })
})
