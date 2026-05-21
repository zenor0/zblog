import { describe, expect, it } from 'vitest'

import { Pages, validatePageSlug } from '@/collections/Pages'

function getTabsField() {
  return Pages.fields.find((field: any) => field.type === 'tabs') as any
}

function getField(name: string) {
  return Pages.fields.find((field: any) => field.name === name) as any
}

describe('Pages collection config', () => {
  it('registers localized CMS pages with Markdown content and drafts', () => {
    expect(Pages.slug).toBe('pages')
    expect(Pages.admin?.group).toBe('Content')
    expect(Pages.admin?.useAsTitle).toBe('title')
    expect(Pages.versions).toMatchObject({
      drafts: {
        schedulePublish: true,
      },
    })

    const tabsField = getTabsField()

    expect(tabsField.tabs.map((tab: any) => tab.label)).toEqual(['Content', 'SEO'])
    expect(tabsField.tabs[0].fields.find((field: any) => field.name === 'title')).toMatchObject({
      localized: true,
      required: true,
      type: 'text',
    })
    expect(tabsField.tabs[0].fields.find((field: any) => field.name === 'content')).toMatchObject({
      localized: true,
      required: true,
      type: 'code',
    })
    expect(getField('slug')).toMatchObject({
      index: true,
      required: true,
      type: 'text',
      unique: true,
    })
  })

  it('uses editor-only writes and published-or-editor reads', () => {
    expect(Pages.access?.create?.({ req: { user: { roles: ['editor'] } } } as any)).toBe(true)
    expect(Pages.access?.update?.({ req: { user: { roles: ['editor'] } } } as any)).toBe(true)
    expect(Pages.access?.delete?.({ req: { user: { roles: ['editor'] } } } as any)).toBe(true)
    expect(Pages.access?.create?.({ req: { user: null } } as any)).toBe(false)
    expect(Pages.access?.read?.({ req: { user: null } } as any)).toEqual({
      _status: {
        equals: 'published',
      },
    })
    expect(Pages.access?.read?.({ req: { user: { roles: ['admin'] } } } as any)).toBe(true)
  })

  it('accepts only non-reserved top-level slugs', () => {
    expect(validatePageSlug('about')).toBe(true)
    expect(validatePageSlug('legal-notice')).toBe(true)
    expect(validatePageSlug('posts')).toMatch(/reserved/)
    expect(validatePageSlug('/about')).toMatch(/single URL segment/)
    expect(validatePageSlug('legal/privacy')).toMatch(/single URL segment/)
    expect(validatePageSlug('About')).toMatch(/lowercase/)
  })

  it('fills slug and first published timestamp before saving', async () => {
    const beforeValidate = Pages.hooks?.beforeValidate?.[0]
    const beforeChange = Pages.hooks?.beforeChange?.[0]

    const validated = await beforeValidate?.({
      data: {
        title: 'About This Site',
      },
      operation: 'create',
      req: { locale: 'en' },
    } as any)

    expect(validated).toMatchObject({
      slug: 'about-this-site',
    })

    await expect(
      beforeChange?.({
        data: {
          _status: 'published',
          slug: 'about-this-site',
        },
        operation: 'create',
        originalDoc: null,
        req: { locale: 'en' },
      } as any),
    ).resolves.toMatchObject({
      publishedAt: expect.any(String),
      slug: 'about-this-site',
    })
  })
})
