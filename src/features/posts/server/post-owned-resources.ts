import fs from 'fs/promises'
import path from 'path'

import type { PayloadRequest } from 'payload'

import { removePersistedPDFPreview } from '@/features/media/server/media-previews'
import { mediaUploadDir } from '@/features/media/model/uploads'

type OwnedMediaResource = {
  filename: null | string
  id: number | string
  previewSVGFilename: null | string
}

export type OwnedPostResourcesSnapshot = {
  media: OwnedMediaResource[]
}

export const ownedPostResourcesContextKey = 'ownedPostResources'

function isDocumentID(value: unknown): value is number | string {
  return typeof value === 'number' || typeof value === 'string'
}

function buildNestedOperationAccess(req: PayloadRequest) {
  return req.user
    ? {
        overrideAccess: false as const,
      }
    : {}
}

async function deleteOwnedMediaFileFallback(filename: null | string): Promise<void> {
  if (!filename) {
    return
  }

  await fs.rm(path.join(mediaUploadDir, filename), {
    force: true,
  })
}

async function collectOwnedMediaResources(args: {
  postID: number | string
  req: PayloadRequest
}): Promise<OwnedMediaResource[]> {
  const resources: OwnedMediaResource[] = []
  let page = 1

  while (true) {
    const result = await args.req.payload.find({
      collection: 'media',
      depth: 0,
      limit: 100,
      page,
      req: args.req,
      ...buildNestedOperationAccess(args.req),
      where: {
        ownerPost: {
          equals: args.postID,
        },
      },
    })

    for (const doc of result.docs) {
      if (!isDocumentID(doc.id)) {
        continue
      }

      resources.push({
        filename: typeof doc.filename === 'string' ? doc.filename : null,
        id: doc.id,
        previewSVGFilename:
          typeof doc.previewSVGFilename === 'string' ? doc.previewSVGFilename : null,
      })
    }

    if (!result.hasNextPage) {
      return resources
    }

    page += 1
  }
}

async function collectImportedMediaResourcesBySlug(args: {
  req: PayloadRequest
  slug: string
}): Promise<OwnedMediaResource[]> {
  const resources: OwnedMediaResource[] = []
  let page = 1

  while (true) {
    const result = await args.req.payload.find({
      collection: 'media',
      depth: 0,
      limit: 100,
      page,
      req: args.req,
      ...buildNestedOperationAccess(args.req),
      where: {
        importKey: {
          contains: `${args.slug}:asset:`,
        },
      },
    })

    for (const doc of result.docs) {
      if (!isDocumentID(doc.id)) {
        continue
      }

      resources.push({
        filename: typeof doc.filename === 'string' ? doc.filename : null,
        id: doc.id,
        previewSVGFilename:
          typeof doc.previewSVGFilename === 'string' ? doc.previewSVGFilename : null,
      })
    }

    if (!result.hasNextPage) {
      return resources
    }

    page += 1
  }
}

export async function captureOwnedResourcesForPost(args: {
  postID: number | string
  req: PayloadRequest
}): Promise<OwnedPostResourcesSnapshot> {
  return {
    media: await collectOwnedMediaResources(args),
  }
}

export async function deleteOwnedResourcesSnapshot(args: {
  req: PayloadRequest
  snapshot: OwnedPostResourcesSnapshot
}): Promise<void> {
  for (const media of args.snapshot.media) {
    await args.req.payload.delete({
      collection: 'media',
      id: media.id,
      req: args.req,
      ...buildNestedOperationAccess(args.req),
    })

    await deleteOwnedMediaFileFallback(media.filename)
    await removePersistedPDFPreview(media.previewSVGFilename)
  }
}

export async function deleteImportedResourcesBySlug(args: {
  req: PayloadRequest
  slug: string
}): Promise<void> {
  await deleteOwnedResourcesSnapshot({
    req: args.req,
    snapshot: {
      media: await collectImportedMediaResourcesBySlug(args),
    },
  })
}
