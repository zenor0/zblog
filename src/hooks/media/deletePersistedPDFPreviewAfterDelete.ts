import type { CollectionAfterDeleteHook } from 'payload'

import { buildPDFPreviewFilename } from '@/lib/media'
import { removePersistedPDFPreview } from '@/lib/media-previews'

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
