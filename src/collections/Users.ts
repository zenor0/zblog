import type { CollectionConfig } from 'payload'

import { ensureUserRolesBeforeLogin } from '@/hooks/users/ensureUserRolesBeforeLogin'
import { ensureUserRolesBeforeValidate } from '@/hooks/users/ensureUserRolesBeforeValidate'
import {
  adminOnly,
  adminOrSelf,
  adminRole,
  editorRole,
  isAdmin,
} from '@/shared/auth/access'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: adminOrSelf,
    update: adminOrSelf,
  },
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  hooks: {
    beforeValidate: [ensureUserRolesBeforeValidate],
    beforeLogin: [ensureUserRolesBeforeLogin],
  },
  fields: [
    {
      name: 'roles',
      type: 'select',
      access: {
        create: ({ req }) => isAdmin(req.user),
        read: ({ req, doc }) => isAdmin(req.user) || req.user?.id === doc?.id,
        update: ({ req }) => isAdmin(req.user),
      },
      hasMany: true,
      options: [
        {
          label: 'Admin',
          value: adminRole,
        },
        {
          label: 'Editor',
          value: editorRole,
        },
      ],
      required: true,
      saveToJWT: true,
    },
  ],
}
