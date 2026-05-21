import { beforeEach, describe, expect, it, vi } from 'vitest'

import { seedSitePages } from '@/features/pages/seed/seed-site-pages'

const payload = {
  create: vi.fn(),
  find: vi.fn(),
  update: vi.fn(),
}

describe('seed site pages', () => {
  beforeEach(() => {
    payload.create.mockReset()
    payload.find.mockReset()
    payload.update.mockReset()
  })

  it('creates starter about, privacy, and terms pages with localized Markdown', async () => {
    payload.find.mockResolvedValue({ docs: [] })
    payload.create.mockImplementation(async ({ data }) => ({
      id: data.slug === 'about' ? 1 : data.slug === 'privacy' ? 2 : 3,
      ...data,
    }))

    await seedSitePages(payload as any)

    expect(payload.create).toHaveBeenCalledTimes(3)
    expect(payload.update).toHaveBeenCalledTimes(3)
    expect(payload.create.mock.calls.map(([args]) => args.data.slug)).toEqual([
      'about',
      'privacy',
      'terms',
    ])
    expect(payload.create.mock.calls[0]?.[0]).toMatchObject({
      collection: 'pages',
      draft: false,
      locale: 'zh-Hans',
    })
    expect(payload.update.mock.calls[0]?.[0]).toMatchObject({
      collection: 'pages',
      locale: 'en',
    })
  })

  it('fills missing localized content without overwriting existing content', async () => {
    payload.find.mockImplementation(async ({ locale, where }) => {
      const slug = where?.slug?.equals

      if (slug === 'about' && locale === 'zh-Hans') {
        return {
          docs: [
            {
              content: '用户已经改过的关于页。',
              description: '用户描述。',
              id: 1,
              slug: 'about',
              title: '关于',
            },
          ],
        }
      }

      if (slug === 'about' && locale === 'en') {
        return {
          docs: [
            {
              content: '',
              description: '',
              id: 1,
              slug: 'about',
              title: '',
            },
          ],
        }
      }

      if (slug === 'privacy' || slug === 'terms') {
        return {
          docs: [
            {
              content: 'Already managed.',
              description: 'Already managed.',
              id: slug === 'privacy' ? 2 : 3,
              slug,
              title: slug,
            },
          ],
        }
      }

      return { docs: [] }
    })

    await seedSitePages(payload as any)

    expect(payload.create).not.toHaveBeenCalled()
    expect(payload.update).toHaveBeenCalledTimes(1)
    expect(payload.update.mock.calls[0]?.[0]).toMatchObject({
      collection: 'pages',
      id: 1,
      locale: 'en',
    })
    expect(payload.update.mock.calls[0]?.[0].data.title).toBe('About')
  })
})
