import { describe, expect, it } from 'vitest'

import { Projects } from '@/collections/Projects'

function getField(name: string) {
  return Projects.fields.find((field: any) => field.name === name) as any
}

function getTabsField() {
  return Projects.fields.find((field: any) => field.type === 'tabs') as any
}

describe('Projects collection config', () => {
  it('registers a lightweight localized project publishing model', () => {
    expect(Projects.slug).toBe('projects')
    expect(Projects.admin?.group).toBe('Content')
    expect(Projects.admin?.useAsTitle).toBe('title')
    expect(Projects.versions).toMatchObject({
      drafts: {
        schedulePublish: true,
      },
    })

    const tabsField = getTabsField()

    expect(tabsField.tabs.map((tab: any) => tab.label)).toEqual([
      'Overview',
      'Project Metadata',
      'SEO',
    ])
    expect(tabsField.tabs[0].fields.find((field: any) => field.name === 'title')).toMatchObject({
      localized: true,
      required: true,
      type: 'text',
    })
    expect(tabsField.tabs[0].fields.find((field: any) => field.name === 'summary')).toMatchObject({
      localized: true,
      required: true,
      type: 'textarea',
    })
    expect(tabsField.tabs[1].fields.find((field: any) => field.name === 'status')).toMatchObject({
      defaultValue: 'active',
      required: true,
      type: 'select',
    })
    expect(getField('slug')).toMatchObject({
      index: true,
      required: true,
      type: 'text',
      unique: true,
    })
  })

  it('uses editor-only writes and published-or-editor reads', () => {
    expect(Projects.access?.create?.({ req: { user: { roles: ['editor'] } } } as any)).toBe(true)
    expect(Projects.access?.update?.({ req: { user: { roles: ['editor'] } } } as any)).toBe(true)
    expect(Projects.access?.delete?.({ req: { user: { roles: ['editor'] } } } as any)).toBe(true)
    expect(Projects.access?.create?.({ req: { user: null } } as any)).toBe(false)
    expect(Projects.access?.read?.({ req: { user: null } } as any)).toEqual({
      _status: {
        equals: 'published',
      },
    })
    expect(Projects.access?.read?.({ req: { user: { roles: ['admin'] } } } as any)).toBe(true)
  })

  it('fills slug and first published timestamp before change', async () => {
    const hook = Projects.hooks?.beforeChange?.[0]

    await expect(
      hook?.({
        data: {
          _status: 'published',
          title: 'Project System Notes',
        },
        operation: 'create',
        originalDoc: null,
        req: { locale: 'en' },
      } as any),
    ).resolves.toMatchObject({
      slug: 'project-system-notes',
      publishedAt: expect.any(String),
    })

    const updateResult = await hook?.({
      data: {
        _status: 'published',
        slug: 'existing-slug',
        title: 'Changed Title',
      },
      operation: 'update',
      originalDoc: {
        publishedAt: '2026-01-01T00:00:00.000Z',
      },
      req: { locale: 'en' },
    } as any)

    expect(updateResult).toMatchObject({
      slug: 'existing-slug',
    })
    expect(updateResult).not.toHaveProperty('publishedAt')
  })
})
