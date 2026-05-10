import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { SiteFooter } from '@/components/frontend/SiteFooter'

describe('SiteFooter', () => {
  it('renders the finalized three-layer footer from configured footer fields', () => {
    const markup = renderToStaticMarkup(
      <SiteFooter
        locale="zh-Hans"
        settings={
          {
            siteName: 'ZBlog',
            footer: {
              layoutStyle: 'balanced',
              brand: {
                name: 'ZBlog',
                description: '技术、产品与日常工作的记录。',
                supportingText: 'Independent writing practice.',
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
                    {
                      label: '归档',
                      link: { type: 'internal', internalPath: '/archive', openInNewTab: false },
                    },
                  ],
                },
                {
                  title: '关于',
                  links: [
                    {
                      label: '关于本站',
                      link: { type: 'internal', internalPath: '/about', openInNewTab: false },
                    },
                  ],
                },
              ],
              socialLinks: [
                {
                  platform: 'github',
                  label: '@zenor0',
                  openInNewTab: true,
                  url: 'https://github.com/zenor0',
                },
                {
                  platform: 'rss',
                  label: 'RSS',
                  openInNewTab: true,
                  url: 'https://example.com/rss.xml',
                },
              ],
              contactItems: [
                {
                  label: 'Email',
                  value: 'hi@example.com',
                  link: {
                    type: 'external',
                    externalUrl: 'mailto:hi@example.com',
                    openInNewTab: false,
                  },
                },
              ],
              legalLinks: [
                {
                  label: '隐私政策',
                  link: { type: 'internal', internalPath: '/privacy', openInNewTab: false },
                },
              ],
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
              bottomBar: { note: 'Powered by Payload CMS and Next.js.' },
            },
          } as any
        }
      />,
    )

    expect(markup).toContain('data-footer-layout="balanced"')
    expect(markup).toContain('data-footer-layer="directory"')
    expect(markup).toContain('data-footer-layer="profile"')
    expect(markup).toContain('data-footer-layer="metadata"')
    expect(markup).toContain('data-footer-adaptive-grid="directory"')
    expect(markup).toContain('data-footer-adaptive-grid="profile"')
    expect(markup).toContain('data-footer-icon="github"')
    expect(markup).toContain('data-footer-meta-align="left"')
    expect(markup).toContain('data-footer-meta-align="right"')
    expect(markup).toContain('/zh-hans/posts')
    expect(markup).toContain('@zenor0')
    expect(markup).not.toContain('>github<')
    expect(markup).toContain('RSS')
    expect(markup).toContain('hi@example.com')
    expect(markup).toContain('沪ICP备00000000号')
    expect(markup).toContain('Copyright 2026 ZBlog. All rights reserved.')
    expect(markup).toContain('Powered by Payload CMS and Next.js.')
  })

  it('renders a balanced layout with directory, profile, and metadata layers', () => {
    const markup = renderToStaticMarkup(
      <SiteFooter
        locale="zh-Hans"
        settings={
          {
            siteName: 'ZBlog',
            footer: {
              layoutStyle: 'balanced',
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
                    {
                      label: '归档',
                      link: { type: 'internal', internalPath: '/archive', openInNewTab: false },
                    },
                  ],
                },
                {
                  title: '关于',
                  links: [
                    {
                      label: '关于本站',
                      link: { type: 'internal', internalPath: '/about', openInNewTab: false },
                    },
                  ],
                },
              ],
              socialLinks: [
                {
                  platform: 'github',
                  label: '@zenor0',
                  openInNewTab: true,
                  url: 'https://github.com/zenor0',
                },
                {
                  platform: 'rss',
                  label: 'RSS',
                  openInNewTab: true,
                  url: 'https://example.com/rss.xml',
                },
              ],
              contactItems: [
                {
                  label: 'Email',
                  value: 'hi@example.com',
                  link: {
                    type: 'external',
                    externalUrl: 'mailto:hi@example.com',
                    openInNewTab: false,
                  },
                },
              ],
              legalLinks: [
                {
                  label: '隐私政策',
                  link: { type: 'internal', internalPath: '/privacy', openInNewTab: false },
                },
              ],
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
              bottomBar: { note: 'Powered by Payload CMS and Next.js.' },
            },
          } as any
        }
      />,
    )

    expect(markup).toContain('data-footer-layout="balanced"')
    expect(markup).toContain('data-footer-layer="directory"')
    expect(markup).toContain('data-footer-layer="profile"')
    expect(markup).toContain('data-footer-layer="metadata"')
    expect(markup).toContain('data-footer-adaptive-grid="directory"')
    expect(markup).toContain('data-footer-adaptive-grid="profile"')
    expect(markup).toContain('data-footer-icon="github"')
    expect(markup).toContain('data-footer-meta-align="left"')
    expect(markup).toContain('data-footer-meta-align="right"')
    expect(markup).toContain('@zenor0')
    expect(markup).toContain('RSS')
    expect(markup).toContain('hi@example.com')
    expect(markup).toContain('沪ICP备00000000号')
    expect(markup).toContain('Copyright 2026 ZBlog. All rights reserved.')
    expect(markup).toContain('Powered by Payload CMS and Next.js.')
  })

  it('renders nothing when the normalized footer has no usable content', () => {
    const markup = renderToStaticMarkup(
      <SiteFooter locale="en" settings={{ siteName: 'ZBlog', footer: null } as any} />,
    )

    expect(markup).toBe('')
  })
})
