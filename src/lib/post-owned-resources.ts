import fs from 'fs/promises'
import path from 'path'

import type { PayloadRequest } from 'payload'

import { removePersistedPDFPreview } from '@/lib/media-previews'
import { mediaUploadDir } from '@/lib/uploads'

type OwnedBibliographyResource = {
  id: number | string
}

type OwnedMediaResource = {
  filename: null | string
  id: number | string
  previewSVGFilename: null | string
}

export type OwnedPostResourcesSnapshot = {
  bibliographyFiles: OwnedBibliographyResource[]
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

async function collectOwnedBibliographyResources(args: {
  postID: number | string
  req: PayloadRequest
}): Promise<OwnedBibliographyResource[]> {
  const resources: OwnedBibliographyResource[] = []
  let page = 1

  while (true) {
    const result = await args.req.payload.find({
      collection: 'bibliography-files',
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
        id: doc.id,
      })
    }

    if (!result.hasNextPage) {
      return resources
    }

    page += 1
  }
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

async function collectImportedBibliographyResourcesBySlug(args: {
  req: PayloadRequest
  slug: string
}): Promise<OwnedBibliographyResource[]> {
  const resources: OwnedBibliographyResource[] = []
  let page = 1

  while (true) {
    const result = await args.req.payload.find({
      collection: 'bibliography-files',
      depth: 0,
      limit: 100,
      page,
      req: args.req,
      ...buildNestedOperationAccess(args.req),
      where: {
        importKey: {
          contains: `${args.slug}:bibliography:`,
        },
      },
    })

    for (const doc of result.docs) {
      if (!isDocumentID(doc.id)) {
        continue
      }

      resources.push({
        id: doc.id,
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
  const [media, bibliographyFiles] = await Promise.all([
    collectOwnedMediaResources(args),
    collectOwnedBibliographyResources(args),
  ])

  return {
    bibliographyFiles,
    media,
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

  for (const bibliographyFile of args.snapshot.bibliographyFiles) {
    await args.req.payload.delete({
      collection: 'bibliography-files',
      id: bibliographyFile.id,
      req: args.req,
      ...buildNestedOperationAccess(args.req),
    })
  }
}

export async function deleteImportedResourcesBySlug(args: {
  req: PayloadRequest
  slug: string
}): Promise<void> {
  const [media, bibliographyFiles] = await Promise.all([
    collectImportedMediaResourcesBySlug(args),
    collectImportedBibliographyResourcesBySlug(args),
  ])

  await deleteOwnedResourcesSnapshot({
    req: args.req,
    snapshot: {
      bibliographyFiles,
      media,
    },
  })
}
