import fs from 'node:fs/promises'

import { buildPDFPreviewFilename, buildPDFPreviewURL } from '@/features/media/model/media'
import { persistPDFPreviewSVG } from '@/features/media/server/pdf-preview'
import {
  resolveLocalMediaFilePath,
  resolveLocalMediaPreviewPath,
} from '@/features/media/server/media-server'

export type MediaPreviewStatus = 'failed' | 'pending' | 'ready'

export type PersistedPDFPreviewFields = {
  previewSVGError: null | string
  previewSVGFilename: null | string
  previewSVGGeneratedAt: null | string
  previewSVGStatus: MediaPreviewStatus | null
  previewSVGURL: null | string
}

function buildClearedPreviewFields(): PersistedPDFPreviewFields {
  return {
    previewSVGError: null,
    previewSVGFilename: null,
    previewSVGGeneratedAt: null,
    previewSVGStatus: null,
    previewSVGURL: null,
  }
}

export async function removePersistedPDFPreview(previewFilename: null | string): Promise<void> {
  if (!previewFilename) {
    return
  }

  const previewPath = resolveLocalMediaPreviewPath(previewFilename)

  if (!previewPath) {
    return
  }

  await fs.rm(previewPath, {
    force: true,
  })
}

export async function syncPersistedPDFPreview(args: {
  currentPreview?: PersistedPDFPreviewFields
  filename?: null | string
  mimeType?: null | string
  url?: null | string
}): Promise<PersistedPDFPreviewFields> {
  if (args.mimeType !== 'application/pdf' || !args.filename || !args.url) {
    return buildClearedPreviewFields()
  }

  const previewFilename = buildPDFPreviewFilename(args.filename)
  const previewURL = buildPDFPreviewURL(args.url)
  const pdfPath = resolveLocalMediaFilePath(args.filename)
  const previewPath = resolveLocalMediaPreviewPath(previewFilename)

  if (!pdfPath || !previewPath || !previewURL) {
    return {
      previewSVGError: 'Could not resolve preview storage paths.',
      previewSVGFilename: previewFilename,
      previewSVGGeneratedAt: null,
      previewSVGStatus: 'failed',
      previewSVGURL: previewURL,
    }
  }

  if (
    args.currentPreview?.previewSVGStatus === 'ready' &&
    args.currentPreview.previewSVGFilename === previewFilename &&
    args.currentPreview.previewSVGURL === previewURL &&
    typeof args.currentPreview.previewSVGGeneratedAt === 'string'
  ) {
    try {
      await fs.access(previewPath)

      return {
        previewSVGError: null,
        previewSVGFilename: previewFilename,
        previewSVGGeneratedAt: args.currentPreview.previewSVGGeneratedAt,
        previewSVGStatus: 'ready',
        previewSVGURL: previewURL,
      }
    } catch {
      // Preview metadata exists but the file is missing; regenerate it.
    }
  }

  const result = await persistPDFPreviewSVG({
    page: 1,
    pdfPath,
    previewPath,
    sourceURL: args.url,
  })

  return {
    previewSVGError: result.error ?? null,
    previewSVGFilename: previewFilename,
    previewSVGGeneratedAt: result.usedFallback ? null : new Date().toISOString(),
    previewSVGStatus: result.usedFallback ? 'failed' : 'ready',
    previewSVGURL: previewURL,
  }
}
