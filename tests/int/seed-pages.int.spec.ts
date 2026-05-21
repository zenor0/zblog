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

  it('does not overwrite an existing page', async () => {
    payload.find.mockResolvedValue({
      docs: [{ id: 1, slug: 'about' }],
    })

    await seedSitePages(payload as any)

    expect(payload.create).not.toHaveBeenCalled()
    expect(payload.update).not.toHaveBeenCalled()
  })
})
