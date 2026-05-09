import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { SiteFooter } from '@/components/frontend/SiteFooter'

describe('SiteFooter', () => {
  it('renders the brand, navigation, social, contact, and bottom-bar sections', () => {
    const markup = renderToStaticMarkup(
      <SiteFooter
        locale="en"
        settings={
          {
            siteName: 'ZBlog',
            footer: {
              brand: {
                name: 'ZBlog Studio',
                description: 'Essays on software and product work.',
                supportingText: 'Independent writing practice.',
                link: { type: 'internal', internalPath: '/', openInNewTab: false },
              },
              navigationSections: [
                {
                  title: 'Explore',
                  links: [
                    {
                      label: 'Posts',
                      description: 'All published writing',
                      link: { type: 'internal', internalPath: '/posts', openInNewTab: false },
                    },
                  ],
                },
              ],
              socialLinks: [
                {
                  platform: 'github',
                  label: 'GitHub',
                  openInNewTab: true,
                  url: 'https://github.com/zenor0',
                },
              ],
              contactItems: [{ label: 'Email', value: 'hi@example.com', link: null }],
              legalLinks: [
                {
                  label: 'Privacy',
                  link: {
                    type: 'external',
                    externalUrl: 'https://example.com/privacy',
                    openInNewTab: true,
                  },
                },
              ],
              compliance: {
                copyright: '© 2026 ZBlog',
                filings: [
                  { label: 'ICP', value: '沪ICP备00000000号', href: 'https://beian.miit.gov.cn/' },
                ],
              },
              bottomBar: { note: 'Built with Payload and Next.js.' },
            },
          } as any
        }
      />,
    )

    expect(markup).toContain('data-footer-layout="compact"')
    expect(markup).toContain('ZBlog Studio')
    expect(markup).toContain('Essays on software and product work.')
    expect(markup).toContain('/en/posts')
    expect(markup).toContain('GitHub')
    expect(markup).toContain('hi@example.com')
    expect(markup).toContain('Privacy')
    expect(markup).toContain('沪ICP备00000000号')
    expect(markup).toContain('Built with Payload and Next.js.')
  })

  it('renders a configured directory layout without oversized brand treatment', () => {
    const markup = renderToStaticMarkup(
      <SiteFooter
        locale="zh-Hans"
        settings={
          {
            siteName: 'ZBlog',
            footer: {
              layoutStyle: 'directory',
              brand: {
                name: 'ZBlog',
                description: '技术、产品与日常工作的记录。',
                supportingText: null,
                link: { type: 'internal', internalPath: '/', openInNewTab: false },
              },
              navigationSections: [
                {
                  title: '阅读',
                  links: [
                    {
                      label: '文章',
                      link: { type: 'internal', internalPath: '/posts', openInNewTab: false },
                    },
                  ],
                },
              ],
              socialLinks: [],
              contactItems: [],
              legalLinks: [],
              compliance: {
                copyright: 'Copyright 2026 ZBlog. All rights reserved.',
                filings: [
                  {
                    label: 'ICP备案',
                    value: '沪ICP备00000000号',
                    href: 'https://beian.miit.gov.cn/',
                  },
                ],
              },
              bottomBar: { note: null },
            },
          } as any
        }
      />,
    )

    expect(markup).toContain('data-footer-layout="directory"')
    expect(markup).toContain('Copyright 2026 ZBlog. All rights reserved.')
    expect(markup).toContain('沪ICP备00000000号')
    expect(markup).not.toContain('font-serif text-xl')
  })

  it('renders nothing when the normalized footer has no usable content', () => {
    const markup = renderToStaticMarkup(
      <SiteFooter locale="en" settings={{ siteName: 'ZBlog', footer: null } as any} />,
    )

    expect(markup).toBe('')
  })
})
