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
  it('exposes a non-localized variant selection global', () => {
    expect(FrontendVariants.slug).toBe('frontend-variants')
    expect(FrontendVariants.admin?.group).toBe('Frontend')

    const fields = collectFields(FrontendVariants.fields)
    const selections = fields.find((field) => field.name === 'selections')
    const surface = fields.find((field) => field.name === 'surface')
    const variant = fields.find((field) => field.name === 'variant')

    expect(selections.type).toBe('array')
    expect(surface.options.map((option: any) => option.value)).toEqual(['article.toc'])
    expect(variant.options.map((option: any) => option.value)).toEqual(['standard', 'progress-map'])
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

  it('rejects duplicate surface selections before saving', async () => {
    const hook = FrontendVariants.hooks?.beforeChange?.[0]

    await expect(
      hook?.({
        data: {
          selections: [
            { surface: 'article.toc', variant: 'standard' },
            { surface: 'article.toc', variant: 'progress-map' },
          ],
        },
        req: {},
      } as any),
    ).rejects.toThrow(/Duplicate frontend variant surface/)
  })
})
