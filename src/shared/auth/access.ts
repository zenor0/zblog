import type { Access } from 'payload'

import {
  publishedPublicPostVersionWhere,
  publishedPublicPostWhere,
} from '@/shared/content/post-visibility'

export const adminRole = 'admin'
export const editorRole = 'editor'
export const userRoles = [adminRole, editorRole] as const

type UserLike = {
  id?: number | string
  roles?: string[] | null
} | null

export const anyone: Access = () => true

export function hasRole(user: UserLike | undefined, role: string): boolean {
  return Boolean(user?.roles?.includes(role))
}

export function isAdmin(user: UserLike | undefined): boolean {
  return hasRole(user, adminRole)
}

export function isEditor(user: UserLike | undefined): boolean {
  return isAdmin(user) || hasRole(user, editorRole)
}

export const authenticated: Access = ({ req: { user } }) => Boolean(user)

export const adminOnly: Access = ({ req: { user } }) => isAdmin(user)

export const adminOrSelf: Access = ({ req: { user } }) => {
  if (!user) {
    return false
  }

  if (isAdmin(user)) {
    return true
  }

  if (typeof user.id !== 'number' && typeof user.id !== 'string') {
    return false
  }

  return {
    id: {
      equals: user.id,
    },
  }
}

export const editorOnly: Access = ({ req: { user } }) => isEditor(user)

export const publishedOrEditor: Access = ({ req: { user } }) => {
  if (isEditor(user)) {
    return true
  }

  return {
    _status: {
      equals: 'published',
    },
  }
}

export const publishedVersionsOrEditor: Access = ({ req: { user } }) => {
  if (isEditor(user)) {
    return true
  }

  return {
    'version._status': {
      equals: 'published',
    },
  }
}

export const publishedPublicPostOrEditor: Access = ({ req: { user } }) => {
  if (isEditor(user)) {
    return true
  }

  return publishedPublicPostWhere
}

export const publishedPublicPostVersionsOrEditor: Access = ({ req: { user } }) => {
  if (isEditor(user)) {
    return true
  }

  return publishedPublicPostVersionWhere
}
