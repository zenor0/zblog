import { createHash } from 'crypto'
import type { Payload } from 'payload'

import type { AppLocale } from '@/shared/i18n/locales'

export const defaultPostViewDedupeWindowMs = 24 * 60 * 60 * 1000

type PostID = number

type MetricDoc = {
  id: number | string
  lastViewedAt?: null | string
  rawHits?: null | number
  uniqueVisitors?: null | number
  viewCount?: null | number
}

export type PostViewMetricSummary = {
  lastViewedAt: null | string
  rawHits: number
  uniqueVisitors: number
  viewCount: number
}

export type RecordPostViewResult =
  | {
      metric: PostViewMetricSummary
      status: 'deduped' | 'recorded'
    }
  | {
      metric: null
      status: 'not-found'
    }

function toPositiveInteger(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0
}

function normalizeMetric(metric: null | MetricDoc | undefined): PostViewMetricSummary {
  return {
    lastViewedAt: typeof metric?.lastViewedAt === 'string' ? metric.lastViewedAt : null,
    rawHits: toPositiveInteger(metric?.rawHits),
    uniqueVisitors: toPositiveInteger(metric?.uniqueVisitors),
    viewCount: toPositiveInteger(metric?.viewCount),
  }
}

export function getPostViewMetricKey(args: { locale: AppLocale; postId: PostID }): string {
  return `${args.postId}:${args.locale}`
}

function getWindowIndex(now: Date, windowMs: number): number {
  return Math.floor(now.getTime() / windowMs)
}

function getHeaderFirstValue(headers: Headers, name: string): null | string {
  const value = headers.get(name)

  if (!value) {
    return null
  }

  const [first] = value.split(',')
  const normalized = first?.trim()

  return normalized || null
}

function getClientAddress(headers: Headers): string {
  return (
    getHeaderFirstValue(headers, 'cf-connecting-ip') ??
    getHeaderFirstValue(headers, 'true-client-ip') ??
    getHeaderFirstValue(headers, 'x-real-ip') ??
    getHeaderFirstValue(headers, 'x-forwarded-for') ??
    'unknown'
  )
}

export function buildPostViewDedupeKey(args: {
  clientAddress: string
  locale: AppLocale
  now: Date
  postId: PostID
  secret?: null | string
  userAgent: string
  windowMs?: number
}): string {
  const windowMs = args.windowMs ?? defaultPostViewDedupeWindowMs
  const windowIndex = getWindowIndex(args.now, windowMs)
  const digest = createHash('sha256')
    .update(args.secret || process.env.PAYLOAD_SECRET || 'zblog-post-views')
    .update('\n')
    .update(String(args.postId))
    .update('\n')
    .update(args.locale)
    .update('\n')
    .update(String(windowIndex))
    .update('\n')
    .update(args.clientAddress)
    .update('\n')
    .update(args.userAgent)
    .digest('hex')
    .slice(0, 32)

  return `post-view:v1:${args.postId}:${args.locale}:${windowIndex}:${digest}`
}

async function loadPublishedRenderablePost(args: {
  locale: AppLocale
  payload: Payload
  postId: PostID
}) {
  try {
    const post = await args.payload.findByID({
      collection: 'posts',
      depth: 0,
      fallbackLocale: false,
      id: args.postId,
      locale: args.locale,
      overrideAccess: false,
      select: {
        _status: true,
        content: true,
        title: true,
      },
    })

    const title = typeof post?.title === 'string' ? post.title.trim() : ''
    const content = typeof post?.content === 'string' ? post.content.trim() : ''

    if (post?._status !== 'published' || !title || !content) {
      return null
    }

    return post
  } catch {
    return null
  }
}

async function findMetric(args: {
  locale: AppLocale
  payload: Payload
  postId: PostID
}): Promise<MetricDoc | null> {
  const metricKey = getPostViewMetricKey(args)
  const result = await args.payload.find({
    collection: 'post-view-metrics',
    depth: 0,
    limit: 1,
    pagination: false,
    where: {
      metricKey: {
        equals: metricKey,
      },
    },
  })

  return (result.docs[0] as MetricDoc | undefined) ?? null
}

async function createMetric(args: {
  lastViewedAt: string
  locale: AppLocale
  payload: Payload
  postId: PostID
  rawHits: number
  uniqueVisitors: number
  viewCount: number
}): Promise<MetricDoc> {
  const metricKey = getPostViewMetricKey(args)

  return (await args.payload.create({
    collection: 'post-view-metrics',
    data: {
      lastViewedAt: args.lastViewedAt,
      locale: args.locale,
      metricKey,
      post: args.postId,
      rawHits: args.rawHits,
      uniqueVisitors: args.uniqueVisitors,
      viewCount: args.viewCount,
    },
    depth: 0,
  })) as MetricDoc
}

async function updateMetric(args: {
  firstPublicViewInWindow: boolean
  locale: AppLocale
  now: Date
  payload: Payload
  postId: PostID
}): Promise<PostViewMetricSummary> {
  const existing = await findMetric(args)
  const existingMetric = normalizeMetric(existing)
  const lastViewedAt = args.now.toISOString()
  const nextMetric = {
    lastViewedAt,
    rawHits: existingMetric.rawHits + 1,
    uniqueVisitors: existingMetric.uniqueVisitors + (args.firstPublicViewInWindow ? 1 : 0),
    viewCount: existingMetric.viewCount + (args.firstPublicViewInWindow ? 1 : 0),
  }

  async function persistMetric(metric: MetricDoc, values: PostViewMetricSummary) {
    const updated = await args.payload.update({
      collection: 'post-view-metrics',
      data: values,
      depth: 0,
      id: metric.id,
    })

    return normalizeMetric(updated as MetricDoc)
  }

  if (existing) {
    return persistMetric(existing, nextMetric)
  }

  try {
    const created = await createMetric({
      ...args,
      ...nextMetric,
    })

    return normalizeMetric(created)
  } catch (error) {
    const createdByRace = await findMetric(args)

    if (!createdByRace) {
      throw error
    }

    const raceMetric = normalizeMetric(createdByRace)

    return persistMetric(createdByRace, {
      lastViewedAt,
      rawHits: raceMetric.rawHits + 1,
      uniqueVisitors: raceMetric.uniqueVisitors + (args.firstPublicViewInWindow ? 1 : 0),
      viewCount: raceMetric.viewCount + (args.firstPublicViewInWindow ? 1 : 0),
    })
  }
}

async function recordDedupeEntry(args: {
  dedupeKey: string
  locale: AppLocale
  now: Date
  payload: Payload
  postId: PostID
  windowMs: number
}): Promise<boolean> {
  const nowISOString = args.now.toISOString()
  const expiresAt = new Date(args.now.getTime() + args.windowMs).toISOString()

  try {
    await args.payload.create({
      collection: 'post-view-dedupe',
      data: {
        dedupeKey: args.dedupeKey,
        expiresAt,
        firstSeenAt: nowISOString,
        lastSeenAt: nowISOString,
        locale: args.locale,
        post: args.postId,
      },
      depth: 0,
    })

    return true
  } catch (error) {
    const existing = await args.payload.find({
      collection: 'post-view-dedupe',
      depth: 0,
      limit: 1,
      pagination: false,
      where: {
        dedupeKey: {
          equals: args.dedupeKey,
        },
      },
    })
    const dedupeEntry = existing.docs[0] as { id?: number | string } | undefined

    if (!dedupeEntry?.id) {
      throw error
    }

    await args.payload.update({
      collection: 'post-view-dedupe',
      data: {
        lastSeenAt: nowISOString,
      },
      depth: 0,
      id: dedupeEntry.id,
    })

    return false
  }
}

export async function getPostViewMetric(args: {
  locale: AppLocale
  payload: Payload
  postId: PostID
}): Promise<PostViewMetricSummary> {
  return normalizeMetric(await findMetric(args))
}

export async function recordPostView(args: {
  headers: Headers
  locale: AppLocale
  now?: Date
  payload: Payload
  postId: PostID
  secret?: null | string
  windowMs?: number
}): Promise<RecordPostViewResult> {
  const post = await loadPublishedRenderablePost(args)

  if (!post) {
    return {
      metric: null,
      status: 'not-found',
    }
  }

  const now = args.now ?? new Date()
  const windowMs = args.windowMs ?? defaultPostViewDedupeWindowMs
  const dedupeKey = buildPostViewDedupeKey({
    clientAddress: getClientAddress(args.headers),
    locale: args.locale,
    now,
    postId: args.postId,
    secret: args.secret,
    userAgent: args.headers.get('user-agent') ?? '',
    windowMs,
  })
  const firstPublicViewInWindow = await recordDedupeEntry({
    dedupeKey,
    locale: args.locale,
    now,
    payload: args.payload,
    postId: args.postId,
    windowMs,
  })
  const metric = await updateMetric({
    firstPublicViewInWindow,
    locale: args.locale,
    now,
    payload: args.payload,
    postId: args.postId,
  })

  return {
    metric,
    status: firstPublicViewInWindow ? 'recorded' : 'deduped',
  }
}
