import type { CollectionBeforeDeleteHook } from 'payload'

import {
  captureOwnedResourcesForPost,
  ownedPostResourcesContextKey,
} from '@/features/posts/server/post-owned-resources'

export const captureOwnedResourcesBeforeDelete: CollectionBeforeDeleteHook = async ({
  context,
  id,
  req,
}) => {
  context[ownedPostResourcesContextKey] = await captureOwnedResourcesForPost({
    postID: id,
    req,
  })
}
