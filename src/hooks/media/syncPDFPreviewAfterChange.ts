import type { CollectionAfterChangeHook } from 'payload'

import type { PersistedPDFPreviewFields } from '@/features/media/server/media-previews'

import { removePersistedPDFPreview, syncPersistedPDFPreview } from '@/features/media/server/media-previews'

function getNestedAccessArgs(reqUser: unknown) {
  return reqUser
    ? ({
        overrideAccess: false as const,
      } as const)
    : ({
        overrideAccess: true as const,
      } as const)
}

function getComparablePreviewState(doc: Record<string, unknown>): PersistedPDFPreviewFields {
  const previewSVGStatus =
    doc.previewSVGStatus === 'failed' ||
    doc.previewSVGStatus === 'pending' ||
    doc.previewSVGStatus === 'ready'
      ? doc.previewSVGStatus
      : null

  return {
    previewSVGError: typeof doc.previewSVGError === 'string' ? doc.previewSVGError : null,
    previewSVGFilename: typeof doc.previewSVGFilename === 'string' ? doc.previewSVGFilename : null,
    previewSVGGeneratedAt:
      typeof doc.previewSVGGeneratedAt === 'string' ? doc.previewSVGGeneratedAt : null,
    previewSVGStatus,
    previewSVGURL: typeof doc.previewSVGURL === 'string' ? doc.previewSVGURL : null,
  }
}

export const syncPDFPreviewAfterChange: CollectionAfterChangeHook = async ({
  context,
  doc,
  previousDoc,
  req,
}) => {
  if (context.skipPDFPreviewSync) {
    return doc
  }

  const currentPreviewState = getComparablePreviewState(doc as Record<string, unknown>)
  const nextPreviewState = await syncPersistedPDFPreview({
    currentPreview: currentPreviewState,
    filename: typeof doc.filename === 'string' ? doc.filename : null,
    mimeType: typeof doc.mimeType === 'string' ? doc.mimeType : null,
    url: typeof doc.url === 'string' ? doc.url : null,
  })
  const previousPreviewFilename =
    previousDoc && typeof previousDoc.previewSVGFilename === 'string'
      ? previousDoc.previewSVGFilename
      : null
  const shouldUpdate =
    currentPreviewState.previewSVGError !== nextPreviewState.previewSVGError ||
    currentPreviewState.previewSVGFilename !== nextPreviewState.previewSVGFilename ||
    currentPreviewState.previewSVGGeneratedAt !== nextPreviewState.previewSVGGeneratedAt ||
    currentPreviewState.previewSVGStatus !== nextPreviewState.previewSVGStatus ||
    currentPreviewState.previewSVGURL !== nextPreviewState.previewSVGURL

  if (previousPreviewFilename && previousPreviewFilename !== nextPreviewState.previewSVGFilename) {
    await removePersistedPDFPreview(previousPreviewFilename)
  }

  if (!shouldUpdate) {
    return doc
  }

  return req.payload.update({
    collection: 'media',
    data: nextPreviewState,
    id: doc.id,
    req,
    context: {
      ...context,
      skipPDFPreviewSync: true,
    },
    ...getNestedAccessArgs(req.user),
  })
}
