import { describe, expect, it } from 'vitest'

import { getSiteHeaderConfig } from '@/features/site-settings/model/site-header'
import type { SiteSettings } from '@/features/site-settings/model/site-settings'

function buildSettings(
  customVariables: NonNullable<SiteSettings['globalVariables']>['customVariables'],
) {
  return {
    globalVariables: {
      customVariables,
    },
    siteDescription: 'Fallback site description',
    siteName: 'ZBlog',
  } as SiteSettings
}

describe('site header config', () => {
  it('defaults to a hidden tagline while keeping the resolved tagline available', () => {
    const config = getSiteHeaderConfig(
      buildSettings([
        {
          key: 'tagline',
          value: '持续记录技术、产品与日常工作。',
        },
      ]),
    )

    expect(config.tagline).toBe('持续记录技术、产品与日常工作。')
    expect(config.taglineMode).toBe('hidden')
  })

  it('allows inline and stacked tagline modes from custom variables', () => {
    expect(
      getSiteHeaderConfig(
        buildSettings([
          {
            key: 'tagline',
            value: '技术、产品与日常工作',
          },
          {
            key: 'headerTaglineMode',
            value: 'inline',
          },
        ]),
      ).taglineMode,
    ).toBe('inline')

    expect(
      getSiteHeaderConfig(
        buildSettings([
          {
            key: 'tagline',
            value: '技术、产品与日常工作',
          },
          {
            key: 'headerTaglineMode',
            value: 'stacked',
          },
        ]),
      ).taglineMode,
    ).toBe('stacked')
  })
})
