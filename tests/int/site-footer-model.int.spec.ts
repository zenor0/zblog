import { describe, expect, it } from 'vitest'

import {
  defaultSiteFooterLayoutStyle,
  normalizeSiteFooter,
  resolveFooterLink,
  siteFooterLayoutStyleOptions,
} from '@/components/frontend/site-footer'

describe('site footer model helpers', () => {
  it('defines the selectable footer layout styles', () => {
    expect(defaultSiteFooterLayoutStyle).toBe('compact')
    expect(siteFooterLayoutStyleOptions.map((option) => option.value)).toEqual([
      'compact',
      'directory',
      'ledger',
      'balanced',
    ])
  })
  it('resolves internal and external footer links', () => {
    expect(
      resolveFooterLink('en', {
        type: 'internal',
        internalPath: '/posts',
        openInNewTab: false,
      }),
    ).toEqual({
      href: '/en/posts',
      isExternal: false,
      rel: undefined,
      target: undefined,
    })

    expect(
      resolveFooterLink('zh-Hans', {
        type: 'external',
        externalUrl: 'https://github.com/zenor0/zblog',
        openInNewTab: true,
      }),
    ).toEqual({
      href: 'https://github.com/zenor0/zblog',
      isExternal: true,
      rel: 'noreferrer',
      target: '_blank',
    })
  })

  it('falls back to siteName and drops empty footer sections', () => {
    const footer = normalizeSiteFooter({
      locale: 'en',
      settings: {
        siteName: 'ZBlog',
        footer: {
          brand: {
            name: '',
            description: 'Editorial notes and product writing.',
            supportingText: null,
          },
          layoutStyle: 'directory',
          navigationSections: [
            {
              title: 'Read',
              links: [
                {
                  label: 'Posts',
                  description: '',
                  link: { type: 'internal', internalPath: '/posts', openInNewTab: false },
                },
              ],
            },
            {
              title: '',
              links: [],
            },
          ],
          socialLinks: [
            {
              platform: 'github',
              label: '@your-github-id',
              openInNewTab: true,
              url: 'https://github.com/zenor0',
            },
          ],
          contactItems: [{ label: 'Email', value: 'hi@example.com', link: null }],
          legalLinks: [],
          compliance: { copyright: '© 2026 ZBlog', filings: [] },
          bottomBar: { note: '' },
        },
      } as any,
    })

    expect(footer?.brand.name).toBe('ZBlog')
    expect(footer?.layoutStyle).toBe('directory')
    expect(footer?.navigationSections).toHaveLength(1)
    expect(footer?.socialLinks[0]?.label).toBe('@your-github-id')
    expect(footer?.socialLinks[0]?.href).toBe('https://github.com/zenor0')
    expect(footer?.contactItems[0]?.value).toBe('hi@example.com')
    expect(footer?.legalLinks).toHaveLength(0)
  })

  it('falls back to the compact layout when the stored style is missing or unknown', () => {
    const footer = normalizeSiteFooter({
      locale: 'zh-Hans',
      settings: {
        siteName: 'ZBlog',
        footer: {
          layoutStyle: 'unknown',
          compliance: { copyright: 'Copyright 2026 ZBlog. All rights reserved.', filings: [] },
        },
      } as any,
    })

    expect(footer?.layoutStyle).toBe('compact')
  })
})
