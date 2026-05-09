import { describe, expect, it } from 'vitest'

import { GET } from '@/app/favicon.ico/route'

describe('favicon route', () => {
  it('serves a lightweight favicon for development overlays and browser tabs', async () => {
    const response = await GET()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('image/svg+xml')
    expect(await response.text()).toContain('<svg')
  })
})
