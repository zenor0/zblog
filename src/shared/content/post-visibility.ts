import type { Where } from 'payload'

export const postVisibilityOptions = [
  {
    label: 'Listed',
    value: 'listed',
  },
  {
    label: 'Unlisted',
    value: 'unlisted',
  },
  {
    label: 'Private',
    value: 'private',
  },
] as const

export type PostVisibility = (typeof postVisibilityOptions)[number]['value']
export type PostEffectiveStatus = 'draft' | PostVisibility

type PostVisibilityLike = {
  _status?: unknown
  visibility?: unknown
} | null

function buildVisibilityWhere(fieldName: string, values: PostVisibility[]): Where {
  return {
    or: [
      {
        [fieldName]: {
          exists: false,
        },
      },
      {
        [fieldName]: {
          equals: null,
        },
      },
      ...values.map((value) => ({
        [fieldName]: {
          equals: value,
        },
      })),
    ],
  }
}

export function isPostVisibility(value: unknown): value is PostVisibility {
  return value === 'listed' || value === 'unlisted' || value === 'private'
}

export function normalizePostVisibility(value: unknown): PostVisibility {
  return isPostVisibility(value) ? value : 'listed'
}

export function getPostEffectiveStatus(post: PostVisibilityLike): PostEffectiveStatus {
  if (post?._status !== 'published') {
    return 'draft'
  }

  return normalizePostVisibility(post.visibility)
}

export function isPostPubliclyReadable(post: PostVisibilityLike): boolean {
  const status = getPostEffectiveStatus(post)

  return status === 'listed' || status === 'unlisted'
}

export function isPostListed(post: PostVisibilityLike): boolean {
  return getPostEffectiveStatus(post) === 'listed'
}

export const listedPostVisibilityWhere: Where = buildVisibilityWhere('visibility', ['listed'])
export const publicPostVisibilityWhere: Where = buildVisibilityWhere('visibility', [
  'listed',
  'unlisted',
])
export const publicPostVersionVisibilityWhere: Where = buildVisibilityWhere('version.visibility', [
  'listed',
  'unlisted',
])

export const publishedListedPostWhere: Where = {
  and: [
    {
      _status: {
        equals: 'published',
      },
    },
    listedPostVisibilityWhere,
  ],
}

export const publishedPublicPostWhere: Where = {
  and: [
    {
      _status: {
        equals: 'published',
      },
    },
    publicPostVisibilityWhere,
  ],
}

export const publishedPublicPostVersionWhere: Where = {
  and: [
    {
      'version._status': {
        equals: 'published',
      },
    },
    publicPostVersionVisibilityWhere,
  ],
}
