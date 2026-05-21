import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Page } from '@/payload-types'

const payloadFind = vi.fn()

vi.mock('@/shared/payload/client', () => ({
  getPayloadClient: vi.fn(async () => ({
    find: payloadFind,
  })),
}))

function pageFixture(overrides: Partial<Page> = {}): Page {
  return {
    id: 1,
    content: '## Body\n\nEditable page copy.',
    createdAt: '2026-05-01T00:00:00.000Z',
    description: 'Editable page description.',
    slug: 'about',
    title: 'About',
    updatedAt: '2026-05-02T00:00:00.000Z',
    _status: 'published',
    ...overrides,
  } as Page
}

describe('CMS page queries', () => {
  beforeEach(() => {
    payloadFind.mockReset()
  })

  it('loads a published page by slug with access control enforced', async () => {
    const { getPageBySlug } = await import('@/features/pages/server/queries')

    payloadFind.mockResolvedValueOnce({
      docs: [pageFixture()],
    })

    const resolved = await getPageBySlug({
      locale: 'en',
      slug: 'about',
    })

    expect(resolved?.page.slug).toBe('about')
    expect(payloadFind).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'pages',
        depth: 1,
        fallbackLocale: false,
        limit: 1,
        locale: 'en',
        overrideAccess: false,
        where: {
          and: [
            {
              _status: {
                equals: 'published',
              },
            },
            {
              slug: {
                equals: 'about',
              },
            },
          ],
        },
      }),
    )
  })

  it('allows editor draft lookup without dropping access checks', async () => {
    const { getPageBySlug } = await import('@/features/pages/server/queries')
    const user = {
      id: 1,
      roles: ['editor'],
    } as any

    payloadFind.mockResolvedValueOnce({
      docs: [
        pageFixture({
          _status: 'draft',
        }),
      ],
    })

    await getPageBySlug({
      draft: true,
      locale: 'en',
      slug: 'draft-page',
      user,
    })

    expect(payloadFind).toHaveBeenCalledWith(
      expect.objectContaining({
        draft: true,
        overrideAccess: false,
        user,
      }),
    )
    expect(payloadFind.mock.calls[0]?.[0].where.and).toEqual([
      {
        slug: {
          equals: 'draft-page',
        },
      },
    ])
  })

  it('filters empty and noindex pages from public page listings', async () => {
    const { getPublishedPages } = await import('@/features/pages/server/queries')

    payloadFind.mockResolvedValueOnce({
      docs: [
        pageFixture({ slug: 'about' }),
        pageFixture({ content: '', id: 2, slug: 'empty' }),
        pageFixture({ id: 3, seo: { noindex: true }, slug: 'hidden' }),
      ],
    })

    const pages = await getPublishedPages('en')

    expect(pages.map((page) => page.slug)).toEqual(['about'])
    expect(payloadFind).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'pages',
        fallbackLocale: false,
        locale: 'en',
        overrideAccess: false,
        where: {
          _status: {
            equals: 'published',
          },
        },
      }),
    )
  })
})
