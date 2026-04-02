import fs from 'fs/promises'
import path from 'path'
import os from 'os'

import type { Payload } from 'payload'
import type { User } from '@/payload-types'

import { describe, it, beforeAll, expect } from 'vitest'

import { importPostWorkspace } from '@/lib/post-package-import'
import { mediaPreviewDir, mediaUploadDir } from '@/lib/uploads'
import { createMDshipWorkspaceFiles } from '../helpers/createMDshipWorkspace'

let payload: Payload
const testDatabasePath = path.resolve(process.cwd(), 'zblog.test.db')
const embeddedBibliographySource = `@article{doe2025,
  author = {Doe, Jamie},
  title = {Composable Publishing Workflows},
  journal = {Journal of Structured Writing},
  year = {2025}
}
`
const tinyPDFBase64 =
  'JVBERi0xLjcKJcfsj6IKJSVJbnZvY2F0aW9uOiBncyAtcSAtZEJBVENIIC1kTk9QQVVTRSAtc0RFVklDRT1wZGZ3cml0ZSAtc091dHB1dEZpbGU9PyA/CjUgMCBvYmoKPDwvTGVuZ3RoIDYgMCBSL0ZpbHRlciAvRmxhdGVEZWNvZGU+PgpzdHJlYW0KeJwrVDDQM1QwAEEonZzLZaCQzlXIZQgWVYBSybkKTiFc+kHmCkYmCiFpXBDFhgrmRkBkoBCSy6XhkZqTk68Q4OKmUFCUWpaZWq4ZksXlGsIVCIQAVj8XC2VuZHN0cmVhbQplbmRvYmoKNiAwIG9iago4OAplbmRvYmoKNCAwIG9iago8PC9UeXBlL1BhZ2UvTWVkaWFCb3ggWzAgMCA1OTUgODQyXQovUm90YXRlIDAvUGFyZW50IDMgMCBSCi9SZXNvdXJjZXM8PC9Qcm9jU2V0Wy9QREYgL1RleHRdCi9Gb250IDggMCBSCj4+Ci9Db250ZW50cyA1IDAgUgo+PgplbmRvYmoKMyAwIG9iago8PCAvVHlwZSAvUGFnZXMgL0tpZHMgWwo0IDAgUgpdIC9Db3VudCAxCj4+CmVuZG9iagoxIDAgb2JqCjw8L1R5cGUgL0NhdGFsb2cgL1BhZ2VzIDMgMCBSCi9NZXRhZGF0YSA5IDAgUgo+PgplbmRvYmoKOCAwIG9iago8PC9SNwo3IDAgUj4+CmVuZG9iago3IDAgb2JqCjw8L0Jhc2VGb250L0hlbHZldGljYS9UeXBlL0ZvbnQKL1N1YnR5cGUvVHlwZTE+PgplbmRvYmoKOSAwIG9iago8PC9UeXBlL01ldGFkYXRhCi9TdWJ0eXBlL1hNTC9MZW5ndGggMTE4Mj4+c3RyZWFtCjw/eHBhY2tldCBiZWdpbj0n77u/JyBpZD0nVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkJz8+Cjw/YWRvYmUteGFwLWZpbHRlcnMgZXNjPSJDUkxGIj8+Cjx4OnhtcG1ldGEgeG1sbnM6eD0nYWRvYmU6bnM6bWV0YS8nIHg6eG1wdGs9J1hNUCB0b29sa2l0IDIuOS4xLTEzLCBmcmFtZXdvcmsgMS42Jz4KPHJkZjpSREYgeG1sbnM6cmRmPSdodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjJyB4bWxuczppWD0naHR0cDovL25zLmFkb2JlLmNvbS9pWC8xLjAvJz4KPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6cGRmPSdodHRwOi8vbnMuYWRvYmUuY29tL3BkZi8xLjMvJyBwZGY6UHJvZHVjZXI9J0dQTCBHaG9zdHNjcmlwdCA5LjU1LjAnLz4KPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSdodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvJz48eG1wOk1vZGlmeURhdGU+MjAyNi0wMy0xOFQxMDowMDozNyswODowMDwveG1wOk1vZGlmeURhdGU+Cjx4bXA6Q3JlYXRlRGF0ZT4yMDI2LTAzLTE4VDEwOjAwOjM3KzA4OjAwPC94bXA6Q3JlYXRlRGF0ZT4KPHhtcDpDcmVhdG9yVG9vbD5Vbmtub3duQXBwbGljYXRpb248L3htcDpDcmVhdG9yVG9vbD48L3JkZjpEZXNjcmlwdGlvbj4KPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eGFwTU09J2h0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8nIHhhcE1NOkRvY3VtZW50SUQ9J3V1aWQ6Y2VhMjM5ODgtNWE4YS0xMWZjLTAwMDAtMTAyMGYyNTZiNjM4Jy8+CjxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOmRjPSdodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLycgZGM6Zm9ybWF0PSdhcHBsaWNhdGlvbi9wZGYnPjxkYzp0aXRsZT48cmRmOkFsdD48cmRmOmxpIHhtbDpsYW5nPSd4LWRlZmF1bHQnPlVudGl0bGVkPC9yZGY6bGk+PC9yZGY6QWx0PjwvZGM6dGl0bGU+PC9yZGY6RGVzY3JpcHRpb24+CjwvcmRmOlJERj4KPC94OnhtcG1ldGE+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKPD94cGFja2V0IGVuZD0ndyc/PgplbmRzdHJlYW0KZW5kb2JqCjIgMCBvYmoKPDwvUHJvZHVjZXIoR1BMIEdob3N0c2NyaXB0IDkuNTUuMCkKL0NyZWF0aW9uRGF0ZShEOjIwMjYwMzE4MTAwMDM3KzA4JzAwJykKL01vZERhdGUoRDoyMDI2MDMxODEwMDAzNyswOCcwMCcpPj5lbmRvYmoKeHJlZgowIDEwCjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDQ2NCAwMDAwMCBuIAowMDAwMDAxODc5IDAwMDAwIG4gCjAwMDAwMDA0MDUgMDAwMDAgbiAKMDAwMDAwMDI2NCAwMDAwMCBuIAowMDAwMDAwMDg4IDAwMDAwIG4gCjAwMDAwMDAyNDYgMDAwMDAgbiAKMDAwMDAwMDU1NyAwMDAwMCBuIAowMDAwMDAwNTI4IDAwMDAwIG4gCjAwMDAwMDA2MjEgMDAwMDAgbiAKdHJhaWxlcgo8PCAvU2l6ZSAxMCAvUm9vdCAxIDAgUiAvSW5mbyAyIDAgUgovSUQgWzxFN0RDNkZBQkEzNUY4RjAyMkE0NDJDNUMzRDg5M0Q4RT48RTdEQzZGQUJBMzVGOEYwMjJBNDQyQzVDM0Q4OTNEOEU+XQo+PgpzdGFydHhyZWYKMjAwNAolJUVPRgo='

async function createTemporaryPDFFile() {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zblog-pdf-preview-test-'))
  const filePath = path.join(tempDir, 'fixture.pdf')

  await fs.writeFile(filePath, Buffer.from(tinyPDFBase64, 'base64'))

  return {
    cleanup: async () => {
      await fs.rm(tempDir, {
        force: true,
        recursive: true,
      })
    },
    filePath,
  }
}

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

    expect(posts.docs).toEqual([])
    expect('bibliography-files' in payload.collections).toBe(false)
  })

  it('stores bibliography directly on the post when citations are present', async () => {
    const slug = `embedded-bibliography-${Date.now()}`
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
    let postID: null | number | string = null

    try {
      const created = await payload.create({
        collection: 'posts',
        data: {
          bibliography: {
            filename: 'references.bib',
            source: embeddedBibliographySource,
          },
          content: 'An embedded bibliography should validate [@doe2025].',
          slug,
          title: 'Embedded bibliography post',
        },
        overrideAccess: false,
        req: request,
        user: adminUser,
      })

      postID = created.id

      const stored = await payload.findByID({
        collection: 'posts',
        depth: 0,
        id: created.id,
        overrideAccess: false,
        req: request,
        user: adminUser,
      })

      expect(stored.bibliography?.filename).toBe('references.bib')
      expect(stored.bibliography?.source).toContain('@article{doe2025')
    } finally {
      if (postID) {
        await payload.delete({
          collection: 'posts',
          id: postID,
          overrideAccess: false,
          req: request,
          user: adminUser,
        })
      }
    }
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
      const storedPost = await payload.findByID({
        collection: 'posts',
        depth: 0,
        id: result.postID,
        overrideAccess: false,
        req: request,
        user: adminUser,
      })

      expect(ownedMedia.docs).toHaveLength(1)
      expect(storedPost.bibliography?.source).toContain('@article{doe2025')

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

      expect(remainingMedia.docs).toHaveLength(0)

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

  it('persists generated svg previews for uploaded pdf media', async () => {
    const tempPDF = await createTemporaryPDFFile()
    const alt = `PDF Preview ${Date.now()}`
    let mediaID: number | null = null
    let previewFilename: null | string = null

    try {
      const created = await payload.create({
        collection: 'media',
        data: {
          alt,
        },
        filePath: tempPDF.filePath,
      })

      mediaID = created.id

      const stored = await payload.findByID({
        collection: 'media',
        depth: 0,
        id: created.id,
      })

      previewFilename = stored.previewSVGFilename ?? null

      expect(stored.mimeType).toBe('application/pdf')
      expect(stored.previewSVGStatus).toBe('ready')
      expect(typeof stored.previewSVGURL).toBe('string')
      expect(typeof previewFilename).toBe('string')
      await expect(fs.access(path.join(mediaPreviewDir, previewFilename!))).resolves.toBeUndefined()

      await payload.delete({
        collection: 'media',
        id: created.id,
      })
      mediaID = null

      await expect(fs.access(path.join(mediaPreviewDir, previewFilename!))).rejects.toThrow()
    } finally {
      if (mediaID) {
        await payload.delete({
          collection: 'media',
          id: mediaID,
        })
      }

      await tempPDF.cleanup()
    }
  })
})
