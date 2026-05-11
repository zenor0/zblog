import { render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ArticleViewTracker } from '@/features/post-views/ui/ArticleViewTracker'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ArticleViewTracker', () => {
  it('records a post view without rendering visible UI', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
    })

    vi.stubGlobal('fetch', fetch)

    const { container } = render(<ArticleViewTracker locale="en" postId={10} />)

    expect(container.textContent).toBe('')

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/post-views',
        expect.objectContaining({
          body: JSON.stringify({
            locale: 'en',
            postId: 10,
          }),
          headers: {
            'content-type': 'application/json',
          },
          keepalive: true,
          method: 'POST',
        }),
      )
    })
  })
})
