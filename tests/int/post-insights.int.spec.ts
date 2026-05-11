import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { PostInsights } from '@/features/posts/admin/PostInsights'

describe('PostInsights', () => {
  it('renders publishing snapshot, locale coverage, content assets, and owned resource summaries', async () => {
    const findByID = vi
      .fn()
      .mockResolvedValueOnce({
        content: '正文',
        title: '你好',
        translatedAt: null,
        translatedFromLocale: null,
        translationStatus: 'original',
      })
      .mockResolvedValueOnce({
        content: 'Body copy',
        title: 'Hello',
        translatedAt: '2026-04-02T09:00:00.000Z',
        translatedFromLocale: 'zh-Hans',
        translationStatus: 'reviewed',
      })
      .mockResolvedValueOnce({
        _status: 'draft',
        attachments: [{ file: 1 }],
        bibliography: {
          filename: 'references.bib',
          source:
            '@article{doe2025,\n  author = {Doe, Jane},\n  title = {Composable Publishing Workflows},\n  journaltitle = {Payload Journal},\n  date = {2025}\n}',
        },
        content: 'Body copy',
        excerpt: 'Short excerpt',
        heroImage: {
          alt: 'Hero image',
          thumbnailURL: '/media/hero-thumb.png',
          url: '/media/hero.png',
        },
        seo: {
          metaDescription: null,
          metaImage: null,
          metaTitle: null,
          noindex: false,
        },
        slug: 'payload-overview',
        tags: [{ value: 'payload' }],
        title: 'Hello',
        updatedAt: '2026-04-02T10:00:00.000Z',
      })

    const find = vi.fn().mockResolvedValueOnce({ totalDocs: 3 }).mockResolvedValueOnce({
      docs: [
        {
          lastViewedAt: '2026-04-02T11:00:00.000Z',
          rawHits: 14,
          uniqueVisitors: 9,
          viewCount: 12,
        },
      ],
      totalDocs: 1,
    })

    const markup = renderToStaticMarkup(
      await (PostInsights as any)({
        id: 42,
        req: {
          locale: 'en',
          payload: {
            find,
            findByID,
          },
          user: {
            id: 7,
            roles: ['editor'],
          },
        },
      } as any),
    )

    expect(markup).toContain('Publishing snapshot')
    expect(markup).toContain('Locale coverage')
    expect(markup).toContain('Content assets')
    expect(markup).toContain('Owned resources')
    expect(markup).toContain('Reader metrics')
    expect(markup).toContain('Public views')
    expect(markup).toContain('12')
    expect(markup).toContain('Raw hits')
    expect(markup).toContain('14')
    expect(markup).toContain('payload-overview')
    expect(markup).toContain('1 entries')
    expect(markup).toContain('references.bib')
    expect(markup).toContain('SEO')
  })

  it('shows a save-first empty state for unsaved documents', async () => {
    const markup = renderToStaticMarkup(
      await (PostInsights as any)({
        id: undefined,
        req: {
          locale: 'en',
          payload: {
            find: vi.fn(),
            findByID: vi.fn(),
          },
        },
      } as any),
    )

    expect(markup).toContain('Save this post first')
    expect(markup).toContain('Post overview')
  })
})
