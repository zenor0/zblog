import type { CollectionBeforeValidateHook } from 'payload'

import type { User } from '@/payload-types'
import { adminRole, editorRole } from '@/shared/auth/access'

export const ensureUserRolesBeforeValidate: CollectionBeforeValidateHook<User> = async ({
  data,
  operation,
  req,
}) => {
  if (operation !== 'create' || !data) {
    return data
  }

  if (Array.isArray(data.roles) && data.roles.length > 0) {
    return data
  }

  const usersCount = await req.payload.count({
    collection: 'users',
    overrideAccess: true,
    req,
  })

  return {
    ...data,
    roles: usersCount.totalDocs <= 0 ? [adminRole] : [editorRole],
  }
}
