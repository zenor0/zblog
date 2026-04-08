import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/components/payload/TranslatePostLocaleAction', () => ({
  TranslatePostLocaleAction: ({ targetLocale }: { targetLocale: string }) => (
    React.createElement('button', { type: 'button' }, `Translate ${targetLocale}`)
  ),
}))

import { PostTranslationManager } from '@/components/payload/PostTranslationManager'

describe('PostTranslationManager', () => {
  it('shows a save-first state for unsaved posts', async () => {
    const markup = renderToStaticMarkup(
      await (PostTranslationManager as any)({
        id: undefined,
        req: {
          locale: 'zh-Hans',
          payload: {
            findByID: vi.fn(),
          },
        },
      } as any),
    )

    expect(markup).toContain('Save this post first')
    expect(markup).toContain('Translation management')
  })

  it('renders every locale with completion and edit links', async () => {
    const findByID = vi
      .fn()
      .mockResolvedValueOnce({
        content: '正文',
        excerpt: '摘要',
        title: '你好',
        translatedAt: null,
        translatedFromLocale: null,
        translationStatus: 'original',
      })
      .mockResolvedValueOnce({
        content: 'Body copy',
        excerpt: '',
        title: 'Hello',
        translatedAt: '2026-04-03T08:00:00.000Z',
        translatedFromLocale: 'zh-Hans',
        translationStatus: 'machine',
      })

    const markup = renderToStaticMarkup(
      await (PostTranslationManager as any)({
        id: 42,
        req: {
          locale: 'zh-Hans',
          payload: {
            config: {
              routes: {
                admin: '/admin',
              },
            },
            findByID,
          },
          user: {
            id: 7,
            roles: ['editor'],
          },
        },
      } as any),
    )

    expect(markup).toContain('Translation management')
    expect(markup).toContain('English')
    expect(markup).toContain('2/3')
    expect(markup).toContain('/admin/collections/posts/42?locale=en')
  })
})
