import configPromise from '@payload-config'
import { draftMode } from 'next/headers'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import { isEditor } from '@/lib/access'
import {
  buildPostAdminPath,
  buildPostDraftPreviewPath,
  buildPostPath,
  resolvePreviewLocale,
} from '@/lib/preview'

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
  const id = Number(idParam)

  if (collection !== 'posts' || !Number.isInteger(id)) {
    return NextResponse.json(
      {
        message: 'Invalid preview request.',
      },
      {
        status: 400,
      },
    )
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

  const destination = slug
    ? buildPostPath({ locale, slug })
    : buildPostDraftPreviewPath({ id, locale })

  if (!destination) {
    return NextResponse.redirect(new URL(buildPostAdminPath(id), request.url))
  }

  return NextResponse.redirect(new URL(destination, request.url))
}
