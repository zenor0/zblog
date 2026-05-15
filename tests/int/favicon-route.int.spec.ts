import { beforeEach, describe, expect, it, vi } from 'vitest'

const siteSettingsMocks = vi.hoisted(() => ({
  getResolvedSiteSettings: vi.fn(),
}))

vi.mock('@/features/site-settings/model/site-settings', () => ({
  getResolvedSiteSettings: siteSettingsMocks.getResolvedSiteSettings,
}))

import { GET } from '@/app/favicon.ico/route'

describe('favicon route', () => {
  beforeEach(() => {
    siteSettingsMocks.getResolvedSiteSettings.mockReset()
  })

  it('redirects to the configured shared site icon when available', async () => {
    siteSettingsMocks.getResolvedSiteSettings.mockResolvedValue({
      globalVariables: {
        assets: {
          icon: {
            alt: 'Configured icon',
            url: '/media/configured-icon.png',
          },
        },
      },
      siteName: 'Configured Site',
    })

    const response = await GET()

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:3000/media/configured-icon.png')
  })

  it('serves a neutral generated favicon fallback without hardcoded project branding', async () => {
    siteSettingsMocks.getResolvedSiteSettings.mockResolvedValue({
      globalVariables: {
        assets: {},
      },
      siteName: 'Configured Site',
    })

    const response = await GET()
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('image/svg+xml')
    expect(body).toContain('<svg')
    expect(body).toContain('Configured Site')
    expect(body).not.toContain('ZBlog')
  })
})
