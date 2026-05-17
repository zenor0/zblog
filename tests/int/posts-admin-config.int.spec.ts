import { describe, expect, it } from 'vitest'

import { Posts } from '@/collections/Posts'
import { postVisibilityOptions } from '@/features/posts/model/post-visibility'

describe('Posts collection admin tabs', () => {
  it('promotes edit sections to top-level tabs with overview first', () => {
    const tabsField = Posts.fields.find((field: any) => field.type === 'tabs') as any

    expect(tabsField.tabs.map((tab: any) => tab.label)).toEqual([
      'Overview',
      'Core Content',
      'Assets & References',
      'Translation',
      'SEO',
    ])

    expect(Posts.admin?.components?.edit?.beforeDocumentControls).toEqual([
      '/features/posts/admin/PostPackageImportAction#PostPackageImportAction',
    ])

    expect(tabsField.tabs[1].fields.some((field: any) => field.name === 'ownedMedia')).toBe(true)
    expect(tabsField.tabs[3].fields.some((field: any) => field.name === 'postTranslations')).toBe(true)
  })

  it('adds a publication visibility field for public listing rules', () => {
    const visibilityField = Posts.fields.find((field: any) => field.name === 'visibility') as any

    expect(Posts.admin?.defaultColumns).toEqual([
      'title',
      'slug',
      'visibility',
      '_status',
      'updatedAt',
    ])
    expect(visibilityField).toMatchObject({
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'listed',
      index: true,
      name: 'visibility',
      options: postVisibilityOptions,
      required: true,
      type: 'select',
    })
  })
})
