import type { CollectionConfig } from 'payload'

import { ensureUserRolesBeforeLogin } from '@/hooks/users/ensureUserRolesBeforeLogin'
import { isAdmin } from '@/shared/auth/access'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  hooks: {
    beforeLogin: [ensureUserRolesBeforeLogin],
  },
  fields: [
    {
      name: 'roles',
      type: 'select',
      access: {
        create: ({ req }) => !req.user || isAdmin(req.user),
        read: ({ req, doc }) => isAdmin(req.user) || req.user?.id === doc?.id,
        update: ({ req }) => isAdmin(req.user),
      },
      defaultValue: ['admin'],
      hasMany: true,
      options: [
        {
          label: 'Admin',
          value: 'admin',
        },
        {
          label: 'Editor',
          value: 'editor',
        },
      ],
      required: true,
      saveToJWT: true,
    },
  ],
}
