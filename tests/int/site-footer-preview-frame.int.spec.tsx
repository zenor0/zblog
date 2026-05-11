import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SiteFooterPreviewFrame } from '@/features/site-settings/ui/SiteFooterPreviewFrame'
import { siteFooterPreviewMessageType } from '@/features/site-settings/model/site-footer-preview'

describe('SiteFooterPreviewFrame', () => {
  it('renders production footer layout after receiving preview settings', async () => {
    render(<SiteFooterPreviewFrame initialLocale="en" />)

    expect(screen.getByText('Waiting for footer data.')).toBeTruthy()

    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          locale: 'en',
          settings: {
            siteName: 'ZBlog',
            footer: {
              layoutStyle: 'balanced',
              brand: {
                name: 'ZBlog',
                description: 'Editorial notes.',
                link: { internalPath: '/', openInNewTab: false, type: 'internal' },
              },
              navigationSections: [
                {
                  links: [
                    {
                      label: 'Posts',
                      link: { internalPath: '/posts', openInNewTab: false, type: 'internal' },
                    },
                  ],
                  title: 'Read',
                },
              ],
              socialLinks: [
                {
                  label: '@zenor0',
                  openInNewTab: true,
                  platform: 'github',
                  url: 'https://github.com/zenor0',
                },
              ],
              compliance: {
                copyright: 'Copyright {{site.currentYear}} ZBlog.',
                filings: [],
              },
            },
          },
          type: siteFooterPreviewMessageType,
        },
        origin: window.location.origin,
      }),
    )

    const preview = await screen.findByTestId('site-footer-preview-frame')

    expect(preview.innerHTML).toContain('data-site-footer=""')
    expect(preview.innerHTML).toContain('data-footer-layer="directory"')
    expect(preview.innerHTML).toContain('data-footer-layer="profile"')
    expect(preview.innerHTML).toContain('data-footer-layer="metadata"')
    expect(preview.innerHTML).toContain('/en/posts')
    expect(screen.getByText('@zenor0')).toBeTruthy()
    expect(screen.getByText(`Copyright ${new Date().getFullYear()} ZBlog.`)).toBeTruthy()
  })
})
