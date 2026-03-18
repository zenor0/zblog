import { access } from 'node:fs/promises'

import type { NextRequest } from 'next/server'

import { getMediaFilename, inferMediaKind, resolveLocalMediaPath } from '@/lib/media'
import { buildPDFPreviewFallbackSVG, renderPDFPreviewSVG } from '@/lib/pdf-preview'

export const runtime = 'nodejs'

function buildSVGResponse(args: {
  fallback: boolean
  reason?: null | string
  resolvedPath?: null | string
  svg: string
}) {
  return new Response(args.svg, {
    headers: {
      'Cache-Control': args.fallback
        ? 'no-store, max-age=0'
        : 'public, max-age=3600, stale-while-revalidate=86400',
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'X-ZBlog-Preview-Fallback': args.fallback ? '1' : '0',
      'X-ZBlog-Preview-Path': args.resolvedPath ?? '',
      'X-ZBlog-Preview-Reason': args.reason ?? '',
    },
  })
}

function resolvePageNumber(rawValue: null | string) {
  const parsed = Number.parseInt(rawValue ?? '1', 10)

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1
  }

  return Math.min(parsed, 20)
}

function logFallback(args: {
  reason: string
  resolvedPath?: null | string
  sourceURL: string
}) {
  console.warn('[media-render] PDF fallback:', {
    reason: args.reason,
    resolvedPath: args.resolvedPath ?? null,
    sourceURL: args.sourceURL,
  })
}

export async function GET(request: NextRequest) {
  const sourceURL = request.nextUrl.searchParams.get('src')

  if (!sourceURL) {
    return new Response('Missing "src" query parameter.', {
      status: 400,
    })
  }

  const page = resolvePageNumber(request.nextUrl.searchParams.get('page'))
  const watermarkToken = request.nextUrl.searchParams.get('wm')
  const filename = getMediaFilename(sourceURL)

  if (inferMediaKind({ src: sourceURL }) !== 'pdf') {
    const reason = 'Source is not a PDF URL'
    logFallback({
      reason,
      sourceURL,
    })

    return buildSVGResponse({
      fallback: true,
      svg: buildPDFPreviewFallbackSVG({
        debugReason: reason,
        filename,
        page,
        sourceURL,
        watermarkToken,
      }),
      reason,
    })
  }

  const localPath = resolveLocalMediaPath(sourceURL)

  if (!localPath) {
    const reason = 'Could not map media URL to local upload path'
    logFallback({
      reason,
      sourceURL,
    })

    return buildSVGResponse({
      fallback: true,
      svg: buildPDFPreviewFallbackSVG({
        debugReason: reason,
        filename,
        page,
        sourceURL,
        watermarkToken,
      }),
      reason,
    })
  }

  try {
    await access(localPath)
  } catch {
    const reason = 'Resolved local PDF path does not exist'
    logFallback({
      reason,
      resolvedPath: localPath,
      sourceURL,
    })

    return buildSVGResponse({
      fallback: true,
      svg: buildPDFPreviewFallbackSVG({
        debugReason: reason,
        filename,
        page,
        sourceURL,
        watermarkToken,
      }),
      reason,
      resolvedPath: localPath,
    })
  }

  const preview = await renderPDFPreviewSVG({
    filename,
    page,
    pdfPath: localPath,
    sourceURL,
    watermarkToken,
  })

  if (preview.usedFallback) {
    const reason = preview.error ? `pdftocairo conversion failed: ${preview.error}` : 'pdftocairo conversion failed'
    logFallback({
      reason,
      resolvedPath: localPath,
      sourceURL,
    })

    return buildSVGResponse({
      fallback: true,
      reason,
      resolvedPath: localPath,
      svg: buildPDFPreviewFallbackSVG({
        debugReason: reason,
        filename,
        page,
        sourceURL,
        watermarkToken,
      }),
    })
  }

  return buildSVGResponse({
    fallback: preview.usedFallback,
    reason: null,
    resolvedPath: localPath,
    svg: preview.svg,
  })
}
