import { describe, expect, it } from 'vitest'

import packageManifest from '../../package.json'

describe('package scripts', () => {
  it('uses reset-and-seed scripts instead of local database migrations during development', () => {
    expect(packageManifest.scripts).not.toHaveProperty('migrate:locales')
    expect(packageManifest.scripts['db:reset']).toContain('reset-local-state.ts')
    expect(packageManifest.scripts['seed:blog:fresh']).toContain('seed-blog.ts --reset')
  })

  it('runs seed as a one-off Payload script', () => {
    expect(packageManifest.scripts['seed:blog']).toContain('DISABLE_PAYLOAD_HMR=true')
  })
})
