import { beforeEach, describe, expect, it, vi } from 'vitest'

const payloadFind = vi.fn()

vi.mock('@/shared/payload/client', () => ({
  getPayloadClient: vi.fn(async () => ({
    find: payloadFind,
  })),
}))

vi.mock('@/features/site-settings/model/site-settings', () => ({
  getResolvedSiteSettings: vi.fn(async () => ({
    siteDescription: 'Site description',
    siteName: 'ZBlog',
    updatedAt: '2026-01-01T00:00:00.000Z',
  })),
}))

describe('sitemap project entries', () => {
  beforeEach(() => {
    payloadFind.mockReset()
    payloadFind.mockImplementation(async (args: any) => {
      if (args.collection === 'posts') {
        return { docs: [] }
      }

      if (args.collection === 'projects') {
        return {
          docs: [
            {
              id: 1,
              slug: 'project-system',
              summary: 'A project system summary.',
              title: 'Project System',
              updatedAt: '2026-01-05T00:00:00.000Z',
            },
            {
              id: 2,
              seo: {
                noindex: true,
              },
              slug: 'hidden-project',
              summary: 'Hidden project summary.',
              title: 'Hidden Project',
              updatedAt: '2026-01-05T00:00:00.000Z',
            },
          ],
        }
      }

      return { docs: [] }
    })
  })

  it('adds published indexable project detail pages with access enforced', async () => {
    const { default: sitemap } = await import('@/app/sitemap')
    const entries = await sitemap()
    const urls = entries.map((entry) => entry.url)

    expect(payloadFind).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'projects',
        fallbackLocale: false,
        overrideAccess: false,
      }),
    )
    expect(urls).toContain('http://localhost:3000/zh-hans/projects/project-system')
    expect(urls).toContain('http://localhost:3000/en/projects/project-system')
    expect(urls).not.toContain('http://localhost:3000/en/projects/hidden-project')
  }, 10_000)
})
