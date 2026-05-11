import type { CollectionAfterDeleteHook } from 'payload'

import { buildPDFPreviewFilename } from '@/features/media/model/media'
import { removePersistedPDFPreview } from '@/features/media/server/media-previews'

export const deletePersistedPDFPreviewAfterDelete: CollectionAfterDeleteHook = async ({ doc }) => {
  const previewFilename =
    typeof doc.previewSVGFilename === 'string'
      ? doc.previewSVGFilename
      : typeof doc.filename === 'string'
        ? buildPDFPreviewFilename(doc.filename)
        : null

  await removePersistedPDFPreview(previewFilename)

  return doc
}
