import { describe, expect, it } from 'vitest'

import { FrontendVariants } from '@/globals/FrontendVariants'

function collectFields(fields: any[]): any[] {
  return fields.flatMap((field) => [
    field,
    ...(Array.isArray(field.fields) ? collectFields(field.fields) : []),
    ...(Array.isArray(field.tabs)
      ? field.tabs.flatMap((tab: any) => collectFields(tab.fields ?? []))
      : []),
  ])
}

describe('frontend variants global config', () => {
  it('exposes a non-localized frontend variant lookup global', () => {
    expect(FrontendVariants.slug).toBe('frontend-variants')
    expect(FrontendVariants.admin?.group).toBe('Frontend')

    const fields = collectFields(FrontendVariants.fields)
    const values = fields.find((field) => field.name === 'values')

    expect(values.type).toBe('json')
    expect(values.defaultValue()).toEqual({
      'article.toc': 'standard',
    })
    expect(values.admin?.components?.Field).toBe(
      '/features/frontend-variants/admin/FrontendVariantLookupField#FrontendVariantLookupField',
    )
    expect(fields.find((field) => field.name === 'selections')).toBeUndefined()
  })

  it('allows public reads but restricts updates to editors', () => {
    expect(FrontendVariants.access?.read?.({ req: { user: null } } as any)).toBe(true)
    expect(
      FrontendVariants.access?.update?.({
        req: { user: { roles: ['editor'] } },
      } as any),
    ).toBe(true)
    expect(FrontendVariants.access?.update?.({ req: { user: null } } as any)).toBe(false)
  })

  it('normalizes lookup values before saving', async () => {
    const hook = FrontendVariants.hooks?.beforeChange?.[0]

    await expect(
      hook?.({
        data: {
          values: { 'article.toc': 'progress-map' },
        },
        req: {},
      } as any),
    ).resolves.toMatchObject({
      values: {
        'article.toc': 'progress-map',
      },
    })
  })

  it('rejects unknown lookup entries before saving', async () => {
    const hook = FrontendVariants.hooks?.beforeChange?.[0]

    await expect(
      hook?.({
        data: {
          values: {
            'article.toc': 'not-real',
          },
        },
        req: {},
      } as any),
    ).rejects.toThrow(/Unknown frontend variant/)
  })
})
