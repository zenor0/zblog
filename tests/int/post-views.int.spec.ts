import { describe, expect, it, vi } from 'vitest'

import {
  buildPostViewDedupeKey,
  getPostViewMetric,
  recordPostView,
} from '@/lib/post-views'

type StoredMetric = {
  id: number
  lastViewedAt: null | string
  locale: string
  metricKey: string
  post: number
  rawHits: number
  uniqueVisitors: number
  viewCount: number
}

type StoredDedupe = {
  id: number
  dedupeKey: string
  expiresAt: string
  firstSeenAt: string
  lastSeenAt: string
  locale: string
  post: number
}

function createMemoryPayload(args: { postStatus?: 'draft' | 'published' } = {}) {
  const metrics: StoredMetric[] = []
  const dedupeEntries: StoredDedupe[] = []
  let nextMetricID = 1
  let nextDedupeID = 1
  const postStatus = args.postStatus ?? 'published'

  const payload = {
    create: vi.fn(async (operation: any) => {
      if (operation.collection === 'post-view-metrics') {
        if (metrics.some((metric) => metric.metricKey === operation.data.metricKey)) {
          throw new Error('duplicate metric key')
        }

        const metric = {
          id: nextMetricID++,
          ...operation.data,
        } as StoredMetric

        metrics.push(metric)

        return metric
      }

      if (operation.collection === 'post-view-dedupe') {
        if (dedupeEntries.some((entry) => entry.dedupeKey === operation.data.dedupeKey)) {
          throw new Error('duplicate dedupe key')
        }

        const entry = {
          id: nextDedupeID++,
          ...operation.data,
        } as StoredDedupe

        dedupeEntries.push(entry)

        return entry
      }

      throw new Error(`Unexpected create collection ${operation.collection}`)
    }),
    delete: vi.fn(async (operation: any) => {
      if (operation.collection !== 'post-view-dedupe') {
        throw new Error(`Unexpected delete collection ${operation.collection}`)
      }

      const before = dedupeEntries.length
      const cutoff = operation.where?.expiresAt?.less_than

      if (typeof cutoff === 'string') {
        for (let index = dedupeEntries.length - 1; index >= 0; index -= 1) {
          if (dedupeEntries[index]!.expiresAt < cutoff) {
            dedupeEntries.splice(index, 1)
          }
        }
      }

      return {
        docs: [],
        totalDocs: before - dedupeEntries.length,
      }
    }),
    find: vi.fn(async (operation: any) => {
      if (operation.collection === 'post-view-metrics') {
        const metricKey = operation.where?.metricKey?.equals
        const docs = metrics.filter((metric) => metric.metricKey === metricKey)

        return {
          docs,
          totalDocs: docs.length,
        }
      }

      if (operation.collection === 'post-view-dedupe') {
        const dedupeKey = operation.where?.dedupeKey?.equals
        const docs = dedupeEntries.filter((entry) => entry.dedupeKey === dedupeKey)

        return {
          docs,
          totalDocs: docs.length,
        }
      }

      throw new Error(`Unexpected find collection ${operation.collection}`)
    }),
    findByID: vi.fn(async (operation: any) => {
      if (operation.collection !== 'posts' || operation.id !== 10 || postStatus !== 'published') {
        return null
      }

      return {
        _status: 'published',
        content: 'Published body',
        id: 10,
        title: 'Published post',
      }
    }),
    update: vi.fn(async (operation: any) => {
      if (operation.collection === 'post-view-metrics') {
        const metric = metrics.find((candidate) => candidate.id === operation.id)

        if (!metric) {
          throw new Error('metric not found')
        }

        Object.assign(metric, operation.data)

        return metric
      }

      if (operation.collection === 'post-view-dedupe') {
        const entry = dedupeEntries.find((candidate) => candidate.id === operation.id)

        if (!entry) {
          throw new Error('dedupe not found')
        }

        Object.assign(entry, operation.data)

        return entry
      }

      throw new Error(`Unexpected update collection ${operation.collection}`)
    }),
  }

  return {
    dedupeEntries,
    metrics,
    payload,
  }
}

describe('post view tracking', () => {
  it('builds stable dedupe keys within a window and separates posts, locales, and windows', () => {
    const first = buildPostViewDedupeKey({
      clientAddress: '203.0.113.10',
      locale: 'en',
      now: new Date('2026-05-09T00:10:00.000Z'),
      postId: 10,
      secret: 'test-secret',
      userAgent: 'Test browser',
      windowMs: 60 * 60 * 1000,
    })

    expect(first).toBe(
      buildPostViewDedupeKey({
        clientAddress: '203.0.113.10',
        locale: 'en',
        now: new Date('2026-05-09T00:59:00.000Z'),
        postId: 10,
        secret: 'test-secret',
        userAgent: 'Test browser',
        windowMs: 60 * 60 * 1000,
      }),
    )
    expect(first).not.toBe(
      buildPostViewDedupeKey({
        clientAddress: '203.0.113.10',
        locale: 'zh-Hans',
        now: new Date('2026-05-09T00:10:00.000Z'),
        postId: 10,
        secret: 'test-secret',
        userAgent: 'Test browser',
        windowMs: 60 * 60 * 1000,
      }),
    )
    expect(first).not.toBe(
      buildPostViewDedupeKey({
        clientAddress: '203.0.113.10',
        locale: 'en',
        now: new Date('2026-05-09T01:01:00.000Z'),
        postId: 10,
        secret: 'test-secret',
        userAgent: 'Test browser',
        windowMs: 60 * 60 * 1000,
      }),
    )
  })

  it('records raw hits while deduping public views within the same window', async () => {
    const { metrics, payload } = createMemoryPayload()
    const headers = new Headers({
      'user-agent': 'Test browser',
      'x-forwarded-for': '203.0.113.10',
    })

    const first = await recordPostView({
      headers,
      locale: 'en',
      now: new Date('2026-05-09T00:10:00.000Z'),
      payload: payload as any,
      postId: 10,
      secret: 'test-secret',
      windowMs: 60 * 60 * 1000,
    })
    const second = await recordPostView({
      headers,
      locale: 'en',
      now: new Date('2026-05-09T00:20:00.000Z'),
      payload: payload as any,
      postId: 10,
      secret: 'test-secret',
      windowMs: 60 * 60 * 1000,
    })

    expect(first.status).toBe('recorded')
    expect(second.status).toBe('deduped')
    expect(metrics[0]).toMatchObject({
      locale: 'en',
      post: 10,
      rawHits: 2,
      uniqueVisitors: 1,
      viewCount: 1,
    })
  })

  it('returns zero metrics when no aggregate row exists', async () => {
    const { payload } = createMemoryPayload()

    await expect(
      getPostViewMetric({
        locale: 'en',
        payload: payload as any,
        postId: 10,
      }),
    ).resolves.toEqual({
      lastViewedAt: null,
      rawHits: 0,
      uniqueVisitors: 0,
      viewCount: 0,
    })
  })

  it('does not record views for unpublished or missing posts', async () => {
    const { metrics, payload } = createMemoryPayload({ postStatus: 'draft' })

    const result = await recordPostView({
      headers: new Headers(),
      locale: 'en',
      now: new Date('2026-05-09T00:10:00.000Z'),
      payload: payload as any,
      postId: 10,
      secret: 'test-secret',
    })

    expect(result.status).toBe('not-found')
    expect(metrics).toEqual([])
  })
})
