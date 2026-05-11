import { headers } from 'next/headers'

import { isEditor } from '@/shared/auth/access'
import { getPayloadClient } from '@/shared/payload/client'
import type { User } from '@/payload-types'

export async function getPreviewUser(): Promise<null | User> {
  const payload = await getPayloadClient()
  const authResult = await payload.auth({
    headers: await headers(),
  })

  if (authResult.user && isEditor(authResult.user)) {
    return authResult.user as User
  }

  return null
}
