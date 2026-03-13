import fs from 'fs/promises'
import path from 'path'

import type { Payload } from 'payload'

import { describe, it, beforeAll, expect } from 'vitest'

let payload: Payload
const testDatabasePath = path.resolve(process.cwd(), 'zblog.test.db')

describe('API', () => {
  beforeAll(async () => {
    process.env.DATABASE_URL = `file:${testDatabasePath}`

    await fs.rm(testDatabasePath, {
      force: true,
    })

    const [{ getPayload }, { default: config }] = await Promise.all([
      import('payload'),
      import('@/payload.config'),
    ])

    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  it('fetches users', async () => {
    const users = await payload.find({
      collection: 'users',
    })
    expect(users).toBeDefined()
  })

  it('exposes the new blog collections', async () => {
    const posts = await payload.find({
      collection: 'posts',
      overrideAccess: false,
    })

    const bibliographyFiles = await payload.find({
      collection: 'bibliography-files',
      overrideAccess: false,
    })

    expect(posts.docs).toEqual([])
    expect(bibliographyFiles.docs).toEqual([])
  })
})
