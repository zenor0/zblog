import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SiteFooterPreviewFrame } from '@/features/site-settings/ui/SiteFooterPreviewFrame'
import { siteFooterPreviewMessageType } from '@/features/site-settings/model/site-footer-preview'

describe('SiteFooterPreviewFrame', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

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

  it('localizes empty preview frame states from the active locale', async () => {
    render(<SiteFooterPreviewFrame initialLocale="zh-Hans" />)

    expect(screen.getByText('等待页脚数据。')).toBeTruthy()

    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          locale: 'zh-Hans',
          settings: {
            footer: null,
            siteName: 'ZBlog',
          },
          type: siteFooterPreviewMessageType,
        },
        origin: window.location.origin,
      }),
    )

    expect(await screen.findByText('还没有可用的页脚内容。')).toBeTruthy()
  })

  it('hydrates a media ID logo before rendering the production footer image', async () => {
    const fetchMedia = vi.fn().mockResolvedValue({
      json: async () => ({
        alt: 'ZBlog logo',
        id: 42,
        url: '/media/zblog-logo.png',
      }),
      ok: true,
    })

    vi.stubGlobal('fetch', fetchMedia)

    render(<SiteFooterPreviewFrame initialLocale="en" />)

    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          locale: 'en',
          settings: {
            siteName: 'ZBlog',
            footer: {
              brand: {
                logo: 42,
                name: 'ZBlog',
              },
              layoutStyle: 'compact',
            },
          },
          type: siteFooterPreviewMessageType,
        },
        origin: window.location.origin,
      }),
    )

    await waitFor(() => {
      expect(fetchMedia).toHaveBeenCalledWith('/api/media/42?depth=0', {
        credentials: 'same-origin',
      })
    })

    const logo = await screen.findByRole('img', { name: 'ZBlog logo' })

    expect(logo.getAttribute('src')).toBe('/media/zblog-logo.png')
  })

  it('renders an already populated logo without fetching media', async () => {
    const fetchMedia = vi.fn()

    vi.stubGlobal('fetch', fetchMedia)

    render(<SiteFooterPreviewFrame initialLocale="en" />)

    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          locale: 'en',
          settings: {
            siteName: 'ZBlog',
            footer: {
              brand: {
                logo: {
                  alt: 'Existing logo',
                  id: 42,
                  url: '/media/existing-logo.png',
                },
                name: 'ZBlog',
              },
              layoutStyle: 'compact',
            },
          },
          type: siteFooterPreviewMessageType,
        },
        origin: window.location.origin,
      }),
    )

    const logo = await screen.findByRole('img', { name: 'Existing logo' })

    expect(logo.getAttribute('src')).toBe('/media/existing-logo.png')
    expect(fetchMedia).not.toHaveBeenCalled()
  })

  it('keeps rendering footer text when media logo hydration fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({ id: 42 }),
        ok: true,
      }),
    )

    render(<SiteFooterPreviewFrame initialLocale="en" />)

    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          locale: 'en',
          settings: {
            siteName: 'ZBlog',
            footer: {
              brand: {
                logo: 42,
                name: 'ZBlog',
              },
              layoutStyle: 'compact',
            },
          },
          type: siteFooterPreviewMessageType,
        },
        origin: window.location.origin,
      }),
    )

    expect(await screen.findByText('ZBlog')).toBeTruthy()

    await waitFor(() => {
      expect(screen.queryByRole('img')).toBeNull()
    })
  })
})
