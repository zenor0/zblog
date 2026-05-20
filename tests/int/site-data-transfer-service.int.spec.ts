import { unzipSync } from 'fflate'
import type { Payload } from 'payload'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  commitSiteDataImport,
  createSiteDataExport,
  deleteSiteDataExportFile,
  getSiteDataExportFile,
  previewSiteDataImport,
} from '@/features/site-data-transfer/server/site-data-transfer-service'
import type { User } from '@/payload-types'

const createdExports: string[] = []

async function readExportArchive(fileID: string) {
  const file = await getSiteDataExportFile(fileID)
  const archive = unzipSync(new Uint8Array(file?.bytes ?? []))

  return {
    data: JSON.parse(Buffer.from(archive['data/site-data.json']).toString('utf8')),
    manifest: JSON.parse(Buffer.from(archive['manifest.json']).toString('utf8')),
  }
}

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

  it('exports site settings as Payload structured values rather than YAML source', async () => {
    const payload = {
      findGlobal: vi.fn(async () => ({
        appearance: {
          accentColor: 'oklch(0.62 0.14 190)',
        },
        footer: {
          footerEditorMode: 'yaml',
          navigationSections: [
            {
              links: [
                {
                  label: {
                    en: 'Posts',
                    'zh-Hans': '文章',
                  },
                  link: {
                    internalPath: '/posts',
                    type: 'internal',
                  },
                },
              ],
              title: {
                en: 'Read',
                'zh-Hans': '阅读',
              },
            },
          ],
        },
        homeHero: {
          description: {
            en: 'Line one\nLine two',
            'zh-Hans': '第一行\n第二行',
          },
          title: {
            en: 'Structured settings',
            'zh-Hans': '结构化配置',
          },
        },
        homepageEditorMode: 'yaml',
        homepageRawConfig: 'homeHero:\n  title: Should not be exported',
        siteName: {
          en: 'ZBlog',
          'zh-Hans': '知博客',
        },
      })),
    } as unknown as Payload
    const user = {
      id: 1,
      roles: ['admin'],
    } as User

    const result = await createSiteDataExport({
      groups: ['site-settings'],
      payload,
      user,
    })
    createdExports.push(result.file.id)

    const { data } = await readExportArchive(result.file.id)

    expect(data.globals.siteSettings.siteName).toEqual({
      en: 'ZBlog',
      'zh-Hans': '知博客',
    })
    expect(data.globals.siteSettings.homeHero.description.en).toBe('Line one\nLine two')
    expect(data.globals.siteSettings.footer.navigationSections[0].links[0].link).toEqual({
      internalPath: '/posts',
      type: 'internal',
    })
    expect(data.globals.siteSettings.footer.footerEditorMode).toBeUndefined()
    expect(data.globals.siteSettings.homepageEditorMode).toBeUndefined()
    expect(data.globals.siteSettings.homepageRawConfig).toBeUndefined()
  })

  it('exports localized post Markdown content as exact string values', async () => {
    const markdown = {
      en: ['# Hello', '', '```ts', 'const answer = 42', '```'].join('\n'),
      'zh-Hans': ['# 你好', '', '> [!NOTE]', '> 保留 Markdown 原文。'].join('\n'),
    }
    const payload = {
      find: vi.fn(async () => ({
        docs: [
          {
            content: markdown,
            id: 42,
            slug: 'markdown-post',
            title: {
              en: 'Markdown post',
              'zh-Hans': 'Markdown 文章',
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
      groups: ['posts'],
      payload,
      user,
    })
    createdExports.push(result.file.id)

    const { data } = await readExportArchive(result.file.id)

    expect(data.collections.posts[0].content).toEqual(markdown)
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

  it('previews and commits a same-site export as a successful no-op import', async () => {
    const siteSettings = {
      siteName: {
        en: 'ZBlog',
        'zh-Hans': '知博客',
      },
    }
    const payload = {
      findGlobal: vi.fn(async () => siteSettings),
      updateGlobal: vi.fn(),
    } as unknown as Payload
    const user = {
      id: 1,
      roles: ['admin'],
    } as User

    const exportResult = await createSiteDataExport({
      groups: ['site-settings'],
      payload,
      user,
    })
    createdExports.push(exportResult.file.id)

    const exportedFile = await getSiteDataExportFile(exportResult.file.id)
    const preview = await previewSiteDataImport({
      file: new File([exportedFile?.bytes ?? new Uint8Array()], exportResult.file.id, {
        type: 'application/zip',
      }),
      payload,
      user,
    })
    const commit = await commitSiteDataImport({
      groups: [],
      payload,
      token: preview.token,
      user,
    })

    expect(preview.summary).toEqual(
      expect.objectContaining({
        defaultSelectedGroups: [],
        hasChanges: false,
      }),
    )
    expect(preview.diff.groups['site-settings']).toEqual(
      expect.objectContaining({
        skips: 1,
        updates: 0,
      }),
    )
    expect(commit.appliedGroups).toEqual([])
    expect(commit.summary.hasChanges).toBe(false)
    expect(payload.updateGlobal).not.toHaveBeenCalled()
  })
})
