import configPromise from '@payload-config'
import { draftMode } from 'next/headers'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import {
  buildPostAdminPath,
  buildPostDraftPreviewPath,
  buildPostPath,
  resolvePreviewLocale,
} from '@/features/posts/preview'
import {
  buildPageAdminPath,
  buildPageDraftPreviewPath,
  buildPageFrontendPath,
  resolvePagePreviewLocale,
} from '@/features/pages/preview'
import { isEditor } from '@/shared/auth/access'

export const GET = async (request: Request) => {
  const payload = await getPayload({
    config: configPromise,
  })
  const { user } = await payload.auth({
    headers: request.headers,
  })

  if (!user) {
    return NextResponse.redirect(new URL(`${payload.config.routes.admin}/login`, request.url))
  }

  if (!isEditor(user)) {
    return new Response('Forbidden.', {
      status: 403,
    })
  }

  const requestURL = new URL(request.url)
  const collection = requestURL.searchParams.get('collection')
  const idParam = requestURL.searchParams.get('id')
  const locale = resolvePreviewLocale(requestURL.searchParams.get('locale'))
  const isLivePreview = requestURL.searchParams.get('view') === 'live-preview'
  const id = Number(idParam)

  if ((collection !== 'posts' && collection !== 'pages') || !Number.isInteger(id)) {
    return NextResponse.json(
      {
        message: 'Invalid preview request.',
      },
      {
        status: 400,
      },
    )
  }

  if (collection === 'pages') {
    const pageLocale = resolvePagePreviewLocale(requestURL.searchParams.get('locale'))
    const page = await payload.findByID({
      collection: 'pages',
      depth: 0,
      draft: true,
      id,
      locale: pageLocale,
      overrideAccess: false,
      user,
    })
    const slug = typeof page.slug === 'string' ? page.slug.trim() : ''
    const preview = await draftMode()

    preview.enable()

    const destination = isLivePreview
      ? buildPageDraftPreviewPath({ id, locale: pageLocale })
      : slug
        ? buildPageFrontendPath({ locale: pageLocale, slug })
        : buildPageDraftPreviewPath({ id, locale: pageLocale })

    return NextResponse.redirect(new URL(destination ?? buildPageAdminPath(id), request.url))
  }

  const post = await payload.findByID({
    collection: 'posts',
    depth: 0,
    draft: true,
    id,
    locale,
    overrideAccess: false,
    user,
  })
  const slug = typeof post.slug === 'string' ? post.slug.trim() : ''
  const preview = await draftMode()

  preview.enable()

  const destination = isLivePreview
    ? buildPostDraftPreviewPath({ id, locale })
    : slug
      ? buildPostPath({ locale, slug })
      : buildPostDraftPreviewPath({ id, locale })

  if (!destination) {
    return NextResponse.redirect(new URL(buildPostAdminPath(id), request.url))
  }

  return NextResponse.redirect(new URL(destination, request.url))
}
