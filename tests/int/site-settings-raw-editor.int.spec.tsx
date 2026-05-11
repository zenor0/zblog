import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

let mockedFormFields: Record<string, any>
let mockedCodeEditorProps: any
const fieldStates: Record<string, { setValue: ReturnType<typeof vi.fn>; value?: unknown }> = {}

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
  useField: ({ path }: { path: string }) => {
    fieldStates[path] ??= {
      setValue: vi.fn(),
      value: mockedFormFields[path]?.value,
    }

    return fieldStates[path]
  },
  useFormFields: (selector: any) => selector([mockedFormFields]),
}))

import { SiteSettingsRawSectionEditor } from '@/features/site-settings/admin/SiteSettingsRawSectionEditor'

describe('SiteSettingsRawSectionEditor', () => {
  afterEach(() => {
    Object.keys(fieldStates).forEach((key) => {
      delete fieldStates[key]
    })
    mockedCodeEditorProps = undefined
    vi.clearAllMocks()
  })

  it('renders only the YAML editor for the current section and applies it to Payload form state', () => {
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

    expect(fieldStates.homeHero.setValue).toHaveBeenCalledWith({
      description: 'New description',
      title: '{{site.name}}',
    })
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
    expect(fieldStates.homeHero.setValue).not.toHaveBeenCalled()
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
})
