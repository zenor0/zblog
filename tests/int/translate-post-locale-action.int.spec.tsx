import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  error: vi.fn(),
  refresh: vi.fn(),
  success: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mocks.refresh,
  }),
}))

vi.mock('@payloadcms/ui', () => ({
  Button: ({ children, buttonStyle: _buttonStyle, size: _size, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
  toast: {
    error: mocks.error,
    success: mocks.success,
  },
  useConfig: () => ({
    config: {
      routes: {
        api: '/api',
      },
    },
  }),
}))

import { TranslatePostLocaleAction } from '@/components/payload/TranslatePostLocaleAction'

describe('TranslatePostLocaleAction', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({ ok: true }),
        ok: true,
      }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('posts explicit source and target locales', async () => {
    render(
      <TranslatePostLocaleAction
        collectionSlug="posts"
        id={42}
        sourceOptions={[
          { code: 'zh-Hans', label: '简体中文' },
          { code: 'en', label: 'English' },
        ]}
        targetLabel="English"
        targetLocale="en"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Translate from...' }))
    fireEvent.change(screen.getByLabelText('Source locale'), {
      target: {
        value: 'zh-Hans',
      },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Run translation' }))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/posts/42/auto-translate',
        expect.objectContaining({
          body: JSON.stringify({
            sourceLocale: 'zh-Hans',
            targetLocale: 'en',
          }),
          method: 'POST',
        }),
      )
    })

    expect(mocks.refresh).toHaveBeenCalled()
    expect(mocks.success).toHaveBeenCalled()
  })
})
