import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
}))

vi.mock('next/navigation', () => ({
  notFound: mocks.notFound,
}))

import DevLayout from '@/app/(frontend)/dev/layout'

const originalNodeEnv = process.env.NODE_ENV

function setNodeEnv(value: string | undefined) {
  const mutableEnv = process.env as Record<string, string | undefined>

  if (value === undefined) {
    delete mutableEnv.NODE_ENV
    return
  }

  mutableEnv.NODE_ENV = value
}

describe('dev route guard', () => {
  afterEach(() => {
    setNodeEnv(originalNodeEnv)
    mocks.notFound.mockClear()
  })

  it.each(['development', 'test'])('renders dev pages when NODE_ENV is %s', (nodeEnv) => {
    setNodeEnv(nodeEnv)

    const markup = renderToStaticMarkup(
      <DevLayout>
        <main>Dev reference page</main>
      </DevLayout>,
    )

    expect(markup).toContain('Dev reference page')
    expect(mocks.notFound).not.toHaveBeenCalled()
  })

  it('returns not found for dev pages in production', () => {
    setNodeEnv('production')

    expect(() =>
      renderToStaticMarkup(
        <DevLayout>
          <main>Dev reference page</main>
        </DevLayout>,
      ),
    ).toThrow('NEXT_NOT_FOUND')
    expect(mocks.notFound).toHaveBeenCalledTimes(1)
  })
})
