import { afterEach, describe, expect, it } from 'vitest'

import {
  getCanonicalSiteURLInput,
  getPayloadSecret,
  localSiteURL,
} from '@/shared/runtime/env'

const originalEnv = {
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NODE_ENV: process.env.NODE_ENV,
  PAYLOAD_SECRET: process.env.PAYLOAD_SECRET,
  SITE_URL: process.env.SITE_URL,
}

function restoreEnv() {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }
}

function setEnv(name: string, value: string) {
  ;(process.env as Record<string, string | undefined>)[name] = value
}

describe('runtime env helpers', () => {
  afterEach(() => {
    restoreEnv()
  })

  it('requires PAYLOAD_SECRET instead of falling back to an empty string', () => {
    delete process.env.PAYLOAD_SECRET

    expect(() => getPayloadSecret()).toThrow(/PAYLOAD_SECRET/)

    process.env.PAYLOAD_SECRET = 'configured-secret'

    expect(getPayloadSecret()).toBe('configured-secret')
  })

  it('requires a canonical site URL in production and keeps a local fallback elsewhere', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    delete process.env.SITE_URL
    setEnv('NODE_ENV', 'production')

    expect(() => getCanonicalSiteURLInput()).toThrow(/NEXT_PUBLIC_SITE_URL|SITE_URL/)

    setEnv('NODE_ENV', 'development')

    expect(getCanonicalSiteURLInput()).toBe(localSiteURL)
  })

  it('prefers NEXT_PUBLIC_SITE_URL over SITE_URL when both are configured', () => {
    process.env.NEXT_PUBLIC_SITE_URL = ' https://public.example.test '
    process.env.SITE_URL = 'https://server.example.test'
    setEnv('NODE_ENV', 'production')

    expect(getCanonicalSiteURLInput()).toBe('https://public.example.test')
  })
})
