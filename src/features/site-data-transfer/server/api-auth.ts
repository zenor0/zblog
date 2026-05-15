import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { User } from '@/payload-types'

import { isAdmin } from '@/shared/auth/access'

export async function getSiteDataTransferAdmin(request: Request) {
  const payload = await getPayload({
    config: configPromise,
  })
  const { user } = await payload.auth({
    headers: request.headers,
  })

  if (!user || !isAdmin(user)) {
    return {
      error: Response.json(
        {
          message: 'Forbidden.',
        },
        {
          status: 403,
        },
      ),
      payload,
      user: null,
    }
  }

  return {
    error: null,
    payload,
    user: user as User,
  }
}
