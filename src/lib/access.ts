import type { Access } from 'payload'

type UserLike = {
  id?: number | string
  roles?: string[] | null
} | null

export const anyone: Access = () => true

export function hasRole(user: UserLike | undefined, role: string): boolean {
  return Boolean(user?.roles?.includes(role))
}

export function isAdmin(user: UserLike | undefined): boolean {
  return hasRole(user, 'admin')
}

export function isEditor(user: UserLike | undefined): boolean {
  return isAdmin(user) || hasRole(user, 'editor')
}

export const authenticated: Access = ({ req: { user } }) => Boolean(user)

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
