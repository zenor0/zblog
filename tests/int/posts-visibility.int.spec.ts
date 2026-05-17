import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Post } from '@/payload-types'
import type { AppLocale } from '@/shared/i18n/locales'

const payloadMocks = vi.hoisted(() => ({
  find: vi.fn(),
  getPayloadClient: vi.fn(),
}))

vi.mock('@/shared/payload/client', () => ({
  getPayloadClient: payloadMocks.getPayloadClient,
}))

import {
  getPostEffectiveStatus,
  isPostListed,
  isPostPubliclyReadable,
  publishedListedPostWhere,
} from '@/features/posts/model/post-visibility'
import { getPublishedPosts } from '@/features/posts/server/queries'

function postFixture(overrides: Partial<Post> = {}): Post {
  return {
    id: 1,
    title: 'Visible post',
    slug: 'visible-post',
    content: 'Published body',
    publishedAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-02T00:00:00.000Z',
    createdAt: '2026-05-01T00:00:00.000Z',
    _status: 'published',
    visibility: 'listed',
    ...overrides,
  } as Post
}

describe('post visibility model', () => {
  beforeEach(() => {
    payloadMocks.find.mockReset()
    payloadMocks.getPayloadClient.mockReset()
    payloadMocks.getPayloadClient.mockResolvedValue({
      find: payloadMocks.find,
    })
  })

  it('normalizes Payload draft state and post visibility into one effective status', () => {
    expect(getPostEffectiveStatus(postFixture({ _status: 'draft', visibility: 'listed' }))).toBe(
      'draft',
    )
    expect(getPostEffectiveStatus(postFixture({ visibility: 'listed' }))).toBe('listed')
    expect(getPostEffectiveStatus(postFixture({ visibility: 'unlisted' }))).toBe('unlisted')
    expect(getPostEffectiveStatus(postFixture({ visibility: 'private' }))).toBe('private')
    expect(getPostEffectiveStatus({ _status: 'published', visibility: null })).toBe('listed')
    expect(getPostEffectiveStatus(postFixture({ visibility: undefined }))).toBe('listed')
  })

  it('separates direct public access from public index/list inclusion', () => {
    expect(isPostPubliclyReadable(postFixture({ visibility: 'listed' }))).toBe(true)
    expect(isPostPubliclyReadable(postFixture({ visibility: 'unlisted' }))).toBe(true)
    expect(isPostPubliclyReadable(postFixture({ visibility: 'private' }))).toBe(false)
    expect(isPostPubliclyReadable(postFixture({ _status: 'draft', visibility: 'listed' }))).toBe(
      false,
    )

    expect(isPostListed(postFixture({ visibility: 'listed' }))).toBe(true)
    expect(isPostListed(postFixture({ visibility: undefined }))).toBe(true)
    expect(isPostListed(postFixture({ visibility: 'unlisted' }))).toBe(false)
    expect(isPostListed(postFixture({ visibility: 'private' }))).toBe(false)
  })

  it('queries and returns only listed published posts for indexes', async () => {
    payloadMocks.find.mockResolvedValue({
      docs: [
        postFixture({ slug: 'listed', visibility: 'listed' }),
        postFixture({ slug: 'legacy', visibility: undefined }),
        postFixture({ slug: 'unlisted', visibility: 'unlisted' }),
        postFixture({ slug: 'private', visibility: 'private' }),
      ],
    })

    const posts = await getPublishedPosts('en' as AppLocale)

    expect(posts.map((post) => post.slug)).toEqual(['listed', 'legacy'])
    expect(payloadMocks.find).toHaveBeenCalledWith({
      collection: 'posts',
      depth: 1,
      fallbackLocale: 'zh-Hans',
      limit: 100,
      locale: 'en',
      overrideAccess: false,
      sort: '-publishedAt',
      where: publishedListedPostWhere,
    })
  })
})
