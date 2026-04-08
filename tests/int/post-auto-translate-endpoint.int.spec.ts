import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/translation', () => ({
  isTranslationConfigured: vi.fn(() => true),
  translateFields: vi.fn(),
}))

import { autoTranslatePostEndpoint } from '@/endpoints/posts/autoTranslatePost'

describe('autoTranslatePostEndpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects matching source and target locales', async () => {
    await expect(
      autoTranslatePostEndpoint.handler({
        json: async () => ({
          sourceLocale: 'en',
          targetLocale: 'en',
        }),
        routeParams: {
          id: 42,
        },
        user: {
          roles: ['editor'],
        },
      } as any),
    ).rejects.toThrow('Source locale and target locale must be different.')
  })

  it('rejects source locales that are missing title or content', async () => {
    await expect(
      autoTranslatePostEndpoint.handler({
        json: async () => ({
          sourceLocale: 'zh-Hans',
          targetLocale: 'en',
        }),
        payload: {
          findByID: vi.fn().mockResolvedValue({
            content: '',
            title: '',
          }),
        },
        routeParams: {
          id: 42,
        },
        user: {
          roles: ['editor'],
        },
      } as any),
    ).rejects.toThrow('is missing title or content')
  })
})
