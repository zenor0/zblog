import { getPayload } from 'payload'
import config from '../../src/payload.config.js'
import { retryOnSqliteBusy } from './retryOnSqliteBusy'

export const testUser = {
  email: 'dev@payloadcms.com',
  password: 'test',
  roles: ['admin'] as Array<'admin' | 'editor'>,
}

/**
 * Seeds a test user for e2e admin tests.
 */
export async function seedTestUser(): Promise<void> {
  const payload = await getPayload({ config })

  // Delete existing test user if any
  await retryOnSqliteBusy(async () => {
    await payload.delete({
      collection: 'users',
      where: {
        email: {
          equals: testUser.email,
        },
      },
    })
  })

  // Create fresh test user
  await payload.create({
    collection: 'users',
    data: testUser,
  })
}

/**
 * Cleans up test user after tests
 */
export async function cleanupTestUser(): Promise<void> {
  const payload = await getPayload({ config })

  await retryOnSqliteBusy(async () => {
    await payload.delete({
      collection: 'users',
      where: {
        email: {
          equals: testUser.email,
        },
      },
    })
  })
}
