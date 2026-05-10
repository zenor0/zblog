import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

let mockedFormFields: Record<string, any>

vi.mock('@payloadcms/ui', () => ({
  useFormFields: (selector: any) => selector([mockedFormFields]),
}))

import { SiteFooterPreview } from '@/components/payload/SiteFooterPreview'

describe('SiteFooterPreview', () => {
  it('renders the production footer layout from current site settings values', () => {
    mockedFormFields = {
      footer: {
        value: {
          layoutStyle: 'balanced',
          brand: {
            description: '技术、产品与日常工作的记录。',
            link: { internalPath: '/', openInNewTab: false, type: 'internal' },
            name: 'ZBlog',
            supportingText: 'Independent writing practice.',
          },
          navigationSections: [
            {
              links: [
                {
                  label: '文章',
                  link: { internalPath: '/posts', openInNewTab: false, type: 'internal' },
                },
              ],
              title: '阅读',
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
            copyright: 'Copyright 2026 ZBlog.',
            filings: [],
          },
          bottomBar: {
            note: 'Powered by Payload CMS and Next.js.',
          },
        },
      },
      siteName: {
        value: 'ZBlog',
      },
    }

    render(<SiteFooterPreview field={{ name: 'footerPreview', type: 'ui' } as any} path="footer" />)

    const preview = screen.getByTestId('site-footer-preview')

    expect(preview.innerHTML).toContain('data-site-footer=""')
    expect(preview.innerHTML).toContain('data-footer-layer="directory"')
    expect(preview.innerHTML).toContain('data-footer-layer="profile"')
    expect(preview.innerHTML).toContain('data-footer-layer="metadata"')
    expect(screen.getByText('Footer preview')).toBeTruthy()
    expect(screen.getByText('ZBlog')).toBeTruthy()
    expect(screen.getByText('@zenor0')).toBeTruthy()
    expect(preview.innerHTML).toContain('/zh-hans/posts')
  })

  it('shows an empty preview state when the current footer has no usable content', () => {
    mockedFormFields = {
      footer: {
        value: null,
      },
      siteName: {
        value: 'ZBlog',
      },
    }

    render(<SiteFooterPreview field={{ name: 'footerPreview', type: 'ui' } as any} path="footer" />)

    expect(screen.getByText('No usable footer content yet.')).toBeTruthy()
  })

  it('prefers live nested path values over stale footer group values', () => {
    mockedFormFields = {
      footer: {
        value: {
          brand: {
            name: 'Old brand',
          },
          socialLinks: [
            {
              label: '@old',
              openInNewTab: true,
              platform: 'github',
              url: 'https://github.com/old',
            },
          ],
        },
      },
      'footer.brand.name': {
        value: 'Live brand',
      },
      'footer.socialLinks.0.label': {
        value: '@live',
      },
      siteName: {
        value: 'ZBlog',
      },
    }

    render(<SiteFooterPreview field={{ name: 'footerPreview', type: 'ui' } as any} path="footer" />)

    expect(screen.getByText('Live brand')).toBeTruthy()
    expect(screen.getByText('@live')).toBeTruthy()
    expect(screen.queryByText('Old brand')).toBeNull()
    expect(screen.queryByText('@old')).toBeNull()
  })
})
