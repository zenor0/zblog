import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

let mockedFormFields: Record<string, any>
let mockedCodeEditorProps: any
const resetForm = vi.fn()
const setModified = vi.fn()

vi.mock('@payloadcms/ui', () => ({
  CodeEditor: (props: any) => {
    mockedCodeEditorProps = props

    return (
      <textarea
        aria-label={props.wrapperProps?.['aria-label']}
        onChange={(event) => props.onChange?.(event.target.value)}
        value={props.value ?? ''}
      />
    )
  },
  useForm: () => {
    return {
      reset: resetForm,
      setModified,
    }
  },
  useFormFields: (selector: any) => selector([mockedFormFields]),
}))

import { SiteSettingsRawSectionEditor } from '@/features/site-settings/admin/SiteSettingsRawSectionEditor'

describe('SiteSettingsRawSectionEditor', () => {
  afterEach(() => {
    mockedCodeEditorProps = undefined
    vi.clearAllMocks()
  })

  it('renders only the YAML editor for the current section and applies it to Payload form state', async () => {
    mockedFormFields = {
      homeHero: {
        value: {
          description: 'Old description',
          title: 'Old title',
        },
      },
      siteName: {
        value: 'ZBlog',
      },
    }

    render(
      <SiteSettingsRawSectionEditor
        field={{ name: 'homepageRawConfig', type: 'ui' } as any}
        path="homepageRawConfig"
      />,
    )

    const editor = screen.getByLabelText('Homepage YAML config')

    expect(screen.queryByText('Section config')).toBeNull()
    expect(screen.queryByRole('button', { name: 'YAML' })).toBeNull()
    expect(mockedCodeEditorProps.defaultLanguage).toBe('yaml')
    expect(mockedCodeEditorProps.options).toMatchObject({
      minimap: {
        enabled: false,
      },
      wordWrap: 'on',
    })
    expect((editor as HTMLTextAreaElement).value).toContain('homeHero:')
    expect((editor as HTMLTextAreaElement).value).toContain('title: Old title')

    fireEvent.change(editor, {
      target: {
        value: ['homeHero:', '  title: "{{site.name}}"', '  description: New description'].join(
          '\n',
        ),
      },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Apply YAML' }))

    await waitFor(() => {
      expect(resetForm).toHaveBeenCalledWith({
        homeHero: {
          description: 'New description',
          title: '{{site.name}}',
        },
        siteName: 'ZBlog',
      })
    })
    expect(setModified).toHaveBeenCalledWith(true)
  })

  it('shows YAML errors without writing invalid values', () => {
    mockedFormFields = {
      homeHero: {
        value: {
          title: 'Old title',
        },
      },
      siteName: {
        value: 'ZBlog',
      },
    }

    render(
      <SiteSettingsRawSectionEditor
        field={{ name: 'homepageRawConfig', type: 'ui' } as any}
        path="homepageRawConfig"
      />,
    )

    fireEvent.change(screen.getByLabelText('Homepage YAML config'), {
      target: {
        value: 'homeHero: [',
      },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Apply YAML' }))

    expect(screen.getByText(/Invalid YAML/)).toBeTruthy()
    expect(resetForm).not.toHaveBeenCalled()
  })

  it('registers reference autocomplete suggestions for YAML editing', () => {
    mockedFormFields = {
      globalVariables: {
        value: {
          customVariables: [{ key: 'tagline', value: 'Independent writing.' }],
          owner: {
            name: 'Zenoro',
          },
          socialLinks: [{ label: '@zenor0', platform: 'github', url: 'https://github.com/zenor0' }],
        },
      },
      homeHero: {
        value: {
          title: '{{site.name}}',
        },
      },
      siteName: {
        value: 'ZBlog',
      },
    }
    const registerCompletionItemProvider = vi.fn()
    const monaco = {
      languages: {
        CompletionItemInsertTextRule: {
          InsertAsSnippet: 4,
        },
        CompletionItemKind: {
          Variable: 6,
        },
        registerCompletionItemProvider,
      },
    }

    render(
      <SiteSettingsRawSectionEditor
        field={{ name: 'homepageRawConfig', type: 'ui' } as any}
        path="homepageRawConfig"
      />,
    )

    mockedCodeEditorProps.onMount({}, monaco)

    const provider = registerCompletionItemProvider.mock.calls[0]?.[1]
    const suggestions = provider.provideCompletionItems().suggestions

    expect(registerCompletionItemProvider).toHaveBeenCalledWith('yaml', expect.any(Object))
    expect(suggestions.map((item: any) => item.label)).toEqual(
      expect.arrayContaining([
        '{{site.name}}',
        '{{owner.name}}',
        '{{custom.tagline}}',
        '{{social.github.url}}',
      ]),
    )
  })

  it('does not serialize local editor mode fields into section YAML', () => {
    mockedFormFields = {
      articleLayout: {
        value: {
          articleLayoutEditorMode: 'yaml',
          preset: 'compact-editorial',
        },
      },
      'articleLayout.articleLayoutEditorMode': {
        value: 'yaml',
      },
      siteName: {
        value: 'ZBlog',
      },
    }

    render(
      <SiteSettingsRawSectionEditor
        field={{ name: 'articleLayoutRawConfig', type: 'ui' } as any}
        path="articleLayout.articleLayoutRawConfig"
      />,
    )

    const editor = screen.getByLabelText('Article design YAML config') as HTMLTextAreaElement

    expect(editor.value).toContain('preset: compact-editorial')
    expect(editor.value).not.toContain('articleLayoutEditorMode')
  })

  it('serializes Payload array row state as YAML arrays and applies arrays back to the form', async () => {
    mockedFormFields = {
      globalVariables: {
        value: {
          contactItems: 1,
          socialLinks: 1,
        },
      },
      'globalVariables.contactItems': {
        rows: [{ id: 'contact-press' }],
        value: 1,
      },
      'globalVariables.contactItems.0.key': {
        value: 'press',
      },
      'globalVariables.contactItems.0.label': {
        value: 'Press',
      },
      'globalVariables.contactItems.0.url': {
        value: 'mailto:press@example.com',
      },
      'globalVariables.contactItems.0.value': {
        value: 'press@example.com',
      },
      'globalVariables.socialLinks': {
        rows: [{ id: 'social-github' }],
        value: 1,
      },
      'globalVariables.socialLinks.0.label': {
        value: '@zenor0',
      },
      'globalVariables.socialLinks.0.platform': {
        value: 'github',
      },
      'globalVariables.socialLinks.0.url': {
        value: 'https://github.com/zenor0',
      },
      siteName: {
        value: 'ZBlog',
      },
    }

    render(
      <SiteSettingsRawSectionEditor
        field={{ name: 'generalRawConfig', type: 'ui' } as any}
        path="generalRawConfig"
      />,
    )

    const editor = screen.getByLabelText('General YAML config') as HTMLTextAreaElement

    expect(editor.value).toContain('contactItems:')
    expect(editor.value).toContain('- key: press')
    expect(editor.value).toContain('socialLinks:')
    expect(editor.value).toContain('- label: "@zenor0"')
    expect(editor.value).not.toContain('contactItems: 1')
    expect(editor.value).not.toContain('socialLinks: 1')

    fireEvent.change(editor, {
      target: {
        value: [
          'siteName: ZBlog',
          'globalVariables:',
          '  contactItems:',
          '    - key: support',
          '      label: Support',
          '      value: support@example.com',
          '      url: mailto:support@example.com',
        ].join('\n'),
      },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Apply YAML' }))

    await waitFor(() => {
      expect(resetForm).toHaveBeenCalledWith({
        globalVariables: {
          contactItems: [
            {
              key: 'support',
              label: 'Support',
              url: 'mailto:support@example.com',
              value: 'support@example.com',
            },
          ],
        },
        siteName: 'ZBlog',
      })
    })
  })

  it('applies footer YAML through a full form reset so nested rows persist on save', async () => {
    mockedFormFields = {
      footer: {
        value: {
          brand: {
            name: 'Old brand',
          },
          layoutStyle: 'compact',
          navigationSections: 1,
        },
      },
      'footer.footerEditorMode': {
        value: 'yaml',
      },
      'footer.brand.name': {
        value: 'Old brand',
      },
      'footer.layoutStyle': {
        value: 'compact',
      },
      'footer.navigationSections': {
        rows: [{ id: 'old-section' }],
        value: 1,
      },
      'footer.navigationSections.0.id': {
        value: 'old-section',
      },
      'footer.navigationSections.0.links': {
        rows: [{ id: 'old-link' }],
        value: 1,
      },
      'footer.navigationSections.0.links.0.id': {
        value: 'old-link',
      },
      'footer.navigationSections.0.links.0.label': {
        value: 'Old link',
      },
      'footer.navigationSections.0.links.0.link.internalPath': {
        value: '/old',
      },
      'footer.navigationSections.0.links.0.link.type': {
        value: 'internal',
      },
      'footer.navigationSections.0.title': {
        value: 'Old section',
      },
      siteName: {
        value: 'ZBlog',
      },
    }

    render(
      <SiteSettingsRawSectionEditor
        field={{ name: 'footerRawConfig', type: 'ui' } as any}
        path="footer.footerRawConfig"
      />,
    )

    fireEvent.change(screen.getByLabelText('Footer YAML config'), {
      target: {
        value: [
          'footer:',
          '  layoutStyle: directory',
          '  brand:',
          '    name: New brand',
          '  navigationSections:',
          '    - title: New section',
          '      links:',
          '        - label: New link',
          '          link:',
          '            type: internal',
          '            internalPath: /new',
        ].join('\n'),
      },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Apply YAML' }))

    await waitFor(() => {
      expect(resetForm).toHaveBeenCalledWith({
        footer: {
          brand: {
            name: 'New brand',
          },
          footerEditorMode: 'yaml',
          layoutStyle: 'directory',
          navigationSections: [
            {
              links: [
                {
                  label: 'New link',
                  link: {
                    internalPath: '/new',
                    type: 'internal',
                  },
                },
              ],
              title: 'New section',
            },
          ],
        },
        siteName: 'ZBlog',
      })
    })
    expect(setModified).toHaveBeenCalledWith(true)
  })
})
