import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

let mockedFormFields: Record<string, any>
let mockedLocale = 'en'

vi.mock('@payloadcms/ui', () => ({
  useFormFields: (selector: any) => selector([mockedFormFields]),
  useLocale: () => ({ code: mockedLocale }),
}))

import { SiteFooterPreview } from '@/features/site-settings/admin/SiteFooterPreview'
import {
  siteFooterPreviewMessageType,
  siteFooterPreviewReadyMessageType,
  siteFooterPreviewResizeMessageType,
} from '@/features/site-settings/model/site-footer-preview'

function installIframePostMessage() {
  const iframe = screen.getByTestId('site-footer-preview-iframe') as HTMLIFrameElement
  const postMessage = vi.fn()

  Object.defineProperty(iframe, 'contentWindow', {
    configurable: true,
    value: {
      postMessage,
    },
  })

  return {
    iframe,
    postMessage,
  }
}

describe('SiteFooterPreview', () => {
  beforeEach(() => {
    mockedLocale = 'en'
  })

  it('renders a production iframe and posts current site settings values to it', () => {
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
            note: 'Updated weekly.',
          },
        },
      },
      siteName: {
        value: 'ZBlog',
      },
    }

    render(<SiteFooterPreview field={{ name: 'footerPreview', type: 'ui' } as any} path="footer" />)

    const preview = screen.getByTestId('site-footer-preview')
    const { iframe, postMessage } = installIframePostMessage()

    expect(screen.getByText('Footer preview')).toBeTruthy()
    expect(screen.getByText('Production iframe')).toBeTruthy()
    expect(iframe.getAttribute('src')).toBe('/preview/site-footer?locale=en')

    fireEvent.load(iframe)

    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        locale: 'en',
        settings: expect.objectContaining({
          footer: expect.objectContaining({
            layoutStyle: 'balanced',
            brand: expect.objectContaining({
              name: 'ZBlog',
            }),
          }),
          siteName: 'ZBlog',
        }),
        type: siteFooterPreviewMessageType,
      }),
      window.location.origin,
    )
    expect(preview.querySelector('footer')).toBeNull()
  })

  it('updates iframe height from trusted resize messages', async () => {
    mockedFormFields = {
      footer: {
        value: null,
      },
      siteName: {
        value: 'ZBlog',
      },
    }

    render(<SiteFooterPreview field={{ name: 'footerPreview', type: 'ui' } as any} path="footer" />)

    const { iframe } = installIframePostMessage()

    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          height: 512,
          type: siteFooterPreviewResizeMessageType,
        },
        origin: window.location.origin,
      }),
    )

    await waitFor(() => {
      expect(iframe.style.height).toBe('512px')
    })
  })

  it('prefers live nested path values over stale footer group values when posting settings', () => {
    mockedFormFields = {
      footer: {
        value: {
          brand: {
            logo: 7,
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
      'footer.brand.logo': {
        value: 42,
      },
      'footer.socialLinks.0.label': {
        value: '@live',
      },
      siteName: {
        value: 'ZBlog',
      },
    }

    render(<SiteFooterPreview field={{ name: 'footerPreview', type: 'ui' } as any} path="footer" />)

    const { iframe, postMessage } = installIframePostMessage()

    fireEvent.load(iframe)

    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: expect.objectContaining({
          footer: expect.objectContaining({
            brand: expect.objectContaining({
              logo: 42,
              name: 'Live brand',
            }),
            socialLinks: [
              expect.objectContaining({
                label: '@live',
              }),
            ],
          }),
        }),
      }),
      window.location.origin,
    )
  })

  it('reposts settings when the iframe reports it is ready', () => {
    mockedFormFields = {
      footer: {
        value: {
          brand: {
            name: 'ZBlog',
          },
        },
      },
      siteName: {
        value: 'ZBlog',
      },
    }

    render(<SiteFooterPreview field={{ name: 'footerPreview', type: 'ui' } as any} path="footer" />)

    const { postMessage } = installIframePostMessage()

    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          type: siteFooterPreviewReadyMessageType,
        },
        origin: window.location.origin,
      }),
    )

    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: siteFooterPreviewMessageType,
      }),
      window.location.origin,
    )
  })

  it('localizes preview chrome for the active admin locale', () => {
    mockedLocale = 'zh-Hans'
    mockedFormFields = {
      footer: {
        value: null,
      },
      siteName: {
        value: 'ZBlog',
      },
    }

    render(<SiteFooterPreview field={{ name: 'footerPreview', type: 'ui' } as any} path="footer" />)

    const iframe = screen.getByTestId('site-footer-preview-iframe')

    expect(screen.getByText('页脚预览')).toBeTruthy()
    expect(screen.getByText('生产 iframe')).toBeTruthy()
    expect(iframe.getAttribute('title')).toBe('生产页脚预览')
    expect(iframe.getAttribute('src')).toBe('/preview/site-footer?locale=zh-Hans')
  })
})
