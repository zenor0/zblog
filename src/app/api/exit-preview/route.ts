import { draftMode } from 'next/headers'
import { NextResponse } from 'next/server'

import { sanitizePreviewPath } from '@/features/posts/preview'

export const GET = async (request: Request) => {
  const preview = await draftMode()

  preview.disable()

  const requestURL = new URL(request.url)
  const path = sanitizePreviewPath(requestURL.searchParams.get('path')) ?? '/'

  return NextResponse.redirect(new URL(path, request.url))
}
