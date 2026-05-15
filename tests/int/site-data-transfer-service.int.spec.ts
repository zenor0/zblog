import { unzipSync } from 'fflate'
import type { Payload } from 'payload'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  createSiteDataExport,
  deleteSiteDataExportFile,
  getSiteDataExportFile,
} from '@/features/site-data-transfer/server/site-data-transfer-service'
import type { User } from '@/payload-types'

const createdExports: string[] = []

describe('site data transfer service', () => {
  afterEach(async () => {
    await Promise.all(createdExports.splice(0).map((fileID) => deleteSiteDataExportFile(fileID)))
  })

  it('writes a zblog export ZIP with manifest and data entries', async () => {
    const payload = {
      findGlobal: vi.fn(async ({ slug }: { slug: string }) =>
        slug === 'site-settings'
          ? {
              siteName: {
                en: 'ZBlog',
                'zh-Hans': 'ZBlog',
              },
            }
          : {
              selections: [],
            },
      ),
    } as unknown as Payload
    const user = {
      id: 1,
      roles: ['admin'],
    } as User

    const result = await createSiteDataExport({
      groups: ['site-settings', 'frontend-variants'],
      payload,
      user,
    })
    createdExports.push(result.file.id)

    const file = await getSiteDataExportFile(result.file.id)

    expect(file?.bytes.byteLength).toBeGreaterThan(0)
    expect(result.manifest.groups).toEqual(['site-settings', 'frontend-variants'])

    const archive = unzipSync(new Uint8Array(file?.bytes ?? []))
    expect(Object.keys(archive)).toEqual(
      expect.arrayContaining(['manifest.json', 'data/site-data.json']),
    )

    const manifest = JSON.parse(Buffer.from(archive['manifest.json']).toString('utf8'))
    const data = JSON.parse(Buffer.from(archive['data/site-data.json']).toString('utf8'))

    expect(manifest.kind).toBe('zblog.siteDataExport')
    expect(data.globals.siteSettings.siteName.en).toBe('ZBlog')
    expect(payload.findGlobal).toHaveBeenCalledTimes(2)
  })

  it('exports post versions from the Payload versions API', async () => {
    const payload = {
      find: vi.fn(async () => ({
        docs: [
          {
            content: {
              en: 'Versioned content',
              'zh-Hans': '有版本的内容',
            },
            id: 42,
            slug: 'versioned-post',
            title: {
              en: 'Versioned post',
              'zh-Hans': '版本文章',
            },
          },
        ],
        hasNextPage: false,
      })),
      findVersions: vi.fn(async () => ({
        docs: [
          {
            autosave: false,
            createdAt: '2026-05-15T00:00:00.000Z',
            id: 7,
            parent: 42,
            updatedAt: '2026-05-15T00:00:00.000Z',
            version: {
              content: {
                en: 'Earlier content',
                'zh-Hans': '早期内容',
              },
              slug: 'versioned-post',
              title: {
                en: 'Earlier post',
                'zh-Hans': '早期文章',
              },
            },
          },
        ],
        hasNextPage: false,
      })),
    } as unknown as Payload
    const user = {
      id: 1,
      roles: ['admin'],
    } as User

    const result = await createSiteDataExport({
      groups: ['posts', 'post-versions'],
      payload,
      user,
    })
    createdExports.push(result.file.id)

    const file = await getSiteDataExportFile(result.file.id)
    const archive = unzipSync(new Uint8Array(file?.bytes ?? []))
    const data = JSON.parse(Buffer.from(archive['data/site-data.json']).toString('utf8'))

    expect(data.collections.posts).toHaveLength(1)
    expect(data.versions.posts).toHaveLength(1)
    expect(data.versions.posts[0].parentSlug).toBe('versioned-post')
    expect(payload.findVersions).toHaveBeenCalledTimes(1)
  })
})
