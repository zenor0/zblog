import { access, readFile } from 'node:fs/promises'

import type { NextRequest } from 'next/server'

import { getSourceFilenameFromPDFPreviewFilename } from '@/features/media/model/media'
import { resolveLocalMediaFilePath, resolveLocalMediaPreviewPath } from '@/features/media/server/media-server'
import { buildPDFPreviewFallbackSVG } from '@/features/media/server/pdf-preview'
import { persistPDFPreviewSVG } from '@/features/media/server/pdf-preview'

export const runtime = 'nodejs'

function buildSVGResponse(args: {
  cache: 'fallback' | 'generated' | 'hit'
  reason?: null | string
  svg: string
}) {
  return new Response(args.svg, {
    headers: {
      'Cache-Control':
        args.cache === 'fallback' ? 'no-store, max-age=0' : 'public, max-age=31536000, immutable',
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'X-ZBlog-Preview-Cache': args.cache,
      'X-ZBlog-Preview-Reason': args.reason ?? '',
    },
  })
}

function logPreviewFailure(reason: string, filename: null | string) {
  console.warn('[media-preview] SVG preview fallback:', {
    filename,
    reason,
  })
}

export async function GET(request: NextRequest) {
  const previewFilename = request.nextUrl.searchParams.get('filename')

  if (!previewFilename) {
    return new Response('Missing "filename" query parameter.', {
      status: 400,
    })
  }

  const previewPath = resolveLocalMediaPreviewPath(previewFilename)
  const sourceFilename = getSourceFilenameFromPDFPreviewFilename(previewFilename)

  if (!previewPath || !sourceFilename) {
    const reason = 'Invalid preview filename.'
    logPreviewFailure(reason, previewFilename)

    return buildSVGResponse({
      cache: 'fallback',
      reason,
      svg: buildPDFPreviewFallbackSVG({
        debugReason: reason,
        filename: previewFilename,
        page: 1,
        sourceURL: previewFilename,
      }),
    })
  }

  try {
    await access(previewPath)

    return buildSVGResponse({
      cache: 'hit',
      svg: await readFile(previewPath, 'utf8'),
    })
  } catch {
    const sourcePath = resolveLocalMediaFilePath(sourceFilename)
    const sourceURL = `/api/media/file/${encodeURIComponent(sourceFilename)}`

    if (!sourcePath) {
      const reason = 'Could not resolve source PDF path.'
      logPreviewFailure(reason, previewFilename)

      return buildSVGResponse({
        cache: 'fallback',
        reason,
        svg: buildPDFPreviewFallbackSVG({
          debugReason: reason,
          filename: sourceFilename,
          page: 1,
          sourceURL,
        }),
      })
    }

    try {
      await access(sourcePath)
    } catch {
      const reason = 'Source PDF file does not exist.'
      logPreviewFailure(reason, previewFilename)

      return buildSVGResponse({
        cache: 'fallback',
        reason,
        svg: buildPDFPreviewFallbackSVG({
          debugReason: reason,
          filename: sourceFilename,
          page: 1,
          sourceURL,
        }),
      })
    }

    const result = await persistPDFPreviewSVG({
      page: 1,
      pdfPath: sourcePath,
      previewPath,
      sourceURL,
    })

    if (result.usedFallback) {
      const reason = result.error
        ? `pdftocairo conversion failed: ${result.error}`
        : 'pdftocairo conversion failed.'
      logPreviewFailure(reason, previewFilename)

      return buildSVGResponse({
        cache: 'fallback',
        reason,
        svg: buildPDFPreviewFallbackSVG({
          debugReason: reason,
          filename: sourceFilename,
          page: 1,
          sourceURL,
        }),
      })
    }

    return buildSVGResponse({
      cache: 'generated',
      svg: await readFile(previewPath, 'utf8'),
    })
  }
}
