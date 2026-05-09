import configPromise from '@payload-config'
import { NextResponse, type NextRequest } from 'next/server'
import { getPayload } from 'payload'

import { normalizeLocale } from '@/lib/locales'
import { recordPostView } from '@/lib/post-views'

export const runtime = 'nodejs'

function parsePostViewBody(value: unknown) {
  if (!value || typeof value !== 'object') {
    return null
  }

  const body = value as Record<string, unknown>
  const postId = typeof body.postId === 'number' ? body.postId : Number(body.postId)
  const locale = normalizeLocale(typeof body.locale === 'string' ? body.locale : null)

  if (!Number.isInteger(postId) || postId <= 0 || !locale) {
    return null
  }

  return {
    locale,
    postId,
  }
}

export async function POST(request: NextRequest) {
  const body = parsePostViewBody(await request.json().catch(() => null))

  if (!body) {
    return NextResponse.json(
      {
        message: 'Invalid post view payload.',
      },
      {
        status: 400,
      },
    )
  }

  const payload = await getPayload({
    config: configPromise,
  })
  const result = await recordPostView({
    headers: request.headers,
    locale: body.locale,
    payload,
    postId: body.postId,
  })

  if (result.status === 'not-found') {
    return NextResponse.json(
      {
        message: 'Post not found.',
      },
      {
        status: 404,
      },
    )
  }

  return NextResponse.json({
    status: result.status,
    viewCount: result.metric.viewCount,
  })
}
