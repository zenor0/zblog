import fs from 'fs/promises'
import path from 'path'

import type { Payload } from 'payload'
import type { User } from '@/payload-types'

import { describe, it, beforeAll, expect } from 'vitest'

import { importPostWorkspace } from '@/lib/post-package-import'
import { mediaUploadDir } from '@/lib/uploads'
import { createMDshipWorkspaceFiles } from '../helpers/createMDshipWorkspace'

let payload: Payload
const testDatabasePath = path.resolve(process.cwd(), 'zblog.test.db')

async function readWorkspaceFiles(rootDir: string, currentDir = rootDir): Promise<Array<{
  file: File
  path: string
}>> {
  const entries = await fs.readdir(currentDir, {
    withFileTypes: true,
  })
  const files: Array<{
    file: File
    path: string
  }> = []

  for (const entry of entries) {
    const absolutePath = path.join(currentDir, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await readWorkspaceFiles(rootDir, absolutePath)))
      continue
    }

    const bytes = await fs.readFile(absolutePath)

    files.push({
      file: {
        arrayBuffer: async () =>
          bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
      } as unknown as File,
      path: path.relative(rootDir, absolutePath),
    })
  }

  return files
}

describe('API', () => {
  beforeAll(async () => {
    process.env.DATABASE_URL = `file:${testDatabasePath}`

    await fs.rm(testDatabasePath, {
      force: true,
    })

    const [{ getPayload }, { default: config }] = await Promise.all([
      import('payload'),
      import('@/payload.config'),
    ])

    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  }, 30_000)

  it('fetches users', async () => {
    const users = await payload.find({
      collection: 'users',
    })
    expect(users).toBeDefined()
  })

  it('exposes the new blog collections', async () => {
    const posts = await payload.find({
      collection: 'posts',
      overrideAccess: false,
    })

    const bibliographyFiles = await payload.find({
      collection: 'bibliography-files',
      overrideAccess: false,
    })

    expect(posts.docs).toEqual([])
    expect(bibliographyFiles.docs).toEqual([])
  })

  it('deletes post-owned imported assets when a post is deleted', async () => {
    const workspaceFiles = await createMDshipWorkspaceFiles()
    const slug = `owned-assets-cleanup-${Date.now()}`
    const adminUser = (await payload.create({
      collection: 'users',
      data: {
        email: `${slug}@example.com`,
        password: 'test-password',
        roles: ['admin'],
      },
    })) as User
    const request = {
      user: adminUser,
    } as any
    let postID: number | string | null = null
    let uploadedFilenames: string[] = []

    try {
      const workspacePath = await workspaceFiles.createVariant(slug, {
        title: '私有资源清理',
      })
      const result = await importPostWorkspace({
        files: await readWorkspaceFiles(workspacePath),
        overrides: {
          slug,
        },
        payload,
        user: adminUser,
      })

      postID = result.postID

      const ownedMedia = await payload.find({
        collection: 'media',
        depth: 0,
        overrideAccess: false,
        req: request,
        user: adminUser,
        where: {
          ownerPost: {
            equals: postID,
          },
        },
      })
      const ownedBibliography = await payload.find({
        collection: 'bibliography-files',
        depth: 0,
        overrideAccess: false,
        req: request,
        user: adminUser,
        where: {
          ownerPost: {
            equals: postID,
          },
        },
      })

      expect(ownedMedia.docs).toHaveLength(1)
      expect(ownedBibliography.docs).toHaveLength(1)

      uploadedFilenames = ownedMedia.docs
        .map((doc) => doc.filename)
        .filter((filename): filename is string => typeof filename === 'string')

      await payload.delete({
        collection: 'posts',
        id: postID,
        overrideAccess: false,
        req: request,
        user: adminUser,
      })
      postID = null

      const remainingMedia = await payload.find({
        collection: 'media',
        depth: 0,
        overrideAccess: false,
        req: request,
        user: adminUser,
        where: {
          ownerPost: {
            equals: result.postID,
          },
        },
      })
      const remainingBibliography = await payload.find({
        collection: 'bibliography-files',
        depth: 0,
        overrideAccess: false,
        req: request,
        user: adminUser,
        where: {
          ownerPost: {
            equals: result.postID,
          },
        },
      })

      expect(remainingMedia.docs).toHaveLength(0)
      expect(remainingBibliography.docs).toHaveLength(0)

      await Promise.all(
        uploadedFilenames.map((filename) =>
          expect(fs.access(path.join(mediaUploadDir, filename))).rejects.toThrow(),
        ),
      )
    } finally {
      if (postID) {
        await payload
          .delete({
            collection: 'posts',
            id: postID,
            overrideAccess: false,
            req: request,
            user: adminUser,
          })
          .catch(() => undefined)
      }

      await workspaceFiles.cleanup()
    }
  })
})
