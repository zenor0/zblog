import { describe, expect, it, vi } from 'vitest'

import { Users } from '@/collections/Users'

function getRolesField() {
  return Users.fields.find((field: any) => field.name === 'roles') as any
}

function createReq(totalDocs: number) {
  return {
    payload: {
      count: vi.fn(async () => ({ totalDocs })),
    },
    user: null,
  }
}

describe('users collection config', () => {
  it('keeps role defaults in hooks instead of defaulting every new user to admin', () => {
    expect(getRolesField().defaultValue).toBeUndefined()
    expect(Users.hooks?.beforeValidate).toHaveLength(1)
  })

  it('defaults the first user to admin and later users to editor when roles are missing', async () => {
    const hook = Users.hooks?.beforeValidate?.[0]
    const firstReq = createReq(0)
    const laterReq = createReq(1)

    await expect(
      hook?.({
        data: {
          email: 'first@example.test',
        },
        operation: 'create',
        req: firstReq,
      } as any),
    ).resolves.toMatchObject({
      roles: ['admin'],
    })

    await expect(
      hook?.({
        data: {
          email: 'later@example.test',
        },
        operation: 'create',
        req: laterReq,
      } as any),
    ).resolves.toMatchObject({
      roles: ['editor'],
    })
  })

  it('preserves explicit roles and does not assign roles on update', async () => {
    const hook = Users.hooks?.beforeValidate?.[0]
    const req = createReq(4)

    await expect(
      hook?.({
        data: {
          email: 'admin@example.test',
          roles: ['admin'],
        },
        operation: 'create',
        req,
      } as any),
    ).resolves.toMatchObject({
      roles: ['admin'],
    })

    await expect(
      hook?.({
        data: {
          email: 'updated@example.test',
        },
        operation: 'update',
        req,
      } as any),
    ).resolves.toMatchObject({
      email: 'updated@example.test',
    })
  })

  it('restricts collection operations to admins or the current user', () => {
    expect(Users.access?.create?.({ req: { user: { roles: ['admin'] } } } as any)).toBe(true)
    expect(Users.access?.create?.({ req: { user: { roles: ['editor'] } } } as any)).toBe(false)
    expect(Users.access?.create?.({ req: { user: null } } as any)).toBe(false)

    expect(Users.access?.delete?.({ req: { user: { roles: ['admin'] } } } as any)).toBe(true)
    expect(Users.access?.delete?.({ req: { user: { roles: ['editor'] } } } as any)).toBe(false)

    expect(Users.access?.read?.({ req: { user: { id: 1, roles: ['admin'] } } } as any)).toBe(true)
    expect(Users.access?.read?.({ req: { user: { id: 2, roles: ['editor'] } } } as any)).toEqual({
      id: {
        equals: 2,
      },
    })
    expect(Users.access?.update?.({ req: { user: null } } as any)).toBe(false)
  })
})
