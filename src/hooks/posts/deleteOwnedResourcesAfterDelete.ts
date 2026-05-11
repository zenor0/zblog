import type { CollectionAfterDeleteHook } from 'payload'

import {
  deleteImportedResourcesBySlug,
  deleteOwnedResourcesSnapshot,
  ownedPostResourcesContextKey,
  type OwnedPostResourcesSnapshot,
} from '@/features/posts/server/post-owned-resources'

export const deleteOwnedResourcesAfterDelete: CollectionAfterDeleteHook = async ({
  context,
  doc,
  req,
}) => {
  const snapshot = context[ownedPostResourcesContextKey] as OwnedPostResourcesSnapshot | undefined

  if (!snapshot) {
    if (typeof doc.slug !== 'string' || doc.slug.trim().length === 0) {
      return doc
    }

    await deleteImportedResourcesBySlug({
      req,
      slug: doc.slug,
    })

    return doc
  }

  await deleteOwnedResourcesSnapshot({
    req,
    snapshot,
  })

  if (typeof doc.slug === 'string' && doc.slug.trim().length > 0) {
    await deleteImportedResourcesBySlug({
      req,
      slug: doc.slug,
    })
  }

  return doc
}
