import { describe, expect, it } from 'vitest'

import { Posts } from '@/collections/Posts'

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
})
