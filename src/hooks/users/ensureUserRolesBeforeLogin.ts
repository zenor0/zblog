import type { CollectionBeforeLoginHook } from 'payload'

import type { User } from '@/payload-types'

export const ensureUserRolesBeforeLogin: CollectionBeforeLoginHook<User> = async ({
  req,
  user,
}) => {
  if (Array.isArray(user.roles) && user.roles.length > 0) {
    return user
  }

  const usersCount = await req.payload.count({
    collection: 'users',
    overrideAccess: true,
  })

  const roles: User['roles'] = usersCount.totalDocs <= 1 ? ['admin'] : ['editor']

  await req.payload.update({
    collection: 'users',
    data: {
      roles,
    },
    id: user.id,
    overrideAccess: true,
    req,
  })

  user.roles = roles

  return user
}
