import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { defaultArticleProgressMapConfig } from '@/features/frontend-variants/model/frontend-variants'

let mockedCodeEditorProps: any

const fieldState = {
  setValue: vi.fn(),
  value: {
    'article.toc': {
      configs: {
        'progress-map': {
          ...defaultArticleProgressMapConfig,
          pathStyle: 'rounded',
        },
        standard: {},
      },
      variant: 'progress-map',
    },
  },
}

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
  useField: () => fieldState,
}))

import { FrontendVariantLookupField } from '@/features/frontend-variants/admin/FrontendVariantLookupField'

function renderLookupField() {
  render(
    <FrontendVariantLookupField
      field={
        {
          admin: {
            description: 'Code-owned frontend surfaces and their active variants.',
          },
          label: 'Variant lookup',
          name: 'values',
          type: 'json',
        } as any
      }
      path="values"
    />,
  )
}

describe('FrontendVariantLookupField', () => {
  afterEach(() => {
    fieldState.setValue.mockClear()
    mockedCodeEditorProps = undefined
  })

  it('renders a fixed surface row with GUI controls and raw YAML for variant config', () => {
    renderLookupField()

    expect(screen.getByText('Article table of contents')).toBeTruthy()
    expect(screen.getByLabelText('Article table of contents variant')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Configure Article table of contents' }))

    expect(screen.getByText('Progress map config')).toBeTruthy()
    expect(screen.getByLabelText('Path style')).toBeTruthy()
    expect(screen.getByLabelText('Line weight')).toBeTruthy()
    expect(screen.getByLabelText('Visible heading levels')).toBeTruthy()
    expect(screen.getByLabelText('Article table of contents progress-map YAML config')).toBeTruthy()
    expect(mockedCodeEditorProps.defaultLanguage).toBe('yaml')
  })

  it('updates only the active variant config from GUI controls', () => {
    renderLookupField()

    fireEvent.click(screen.getByRole('button', { name: 'Configure Article table of contents' }))
    fireEvent.change(screen.getByLabelText('Line weight'), {
      target: { value: 'strong' },
    })

    expect(fieldState.setValue).toHaveBeenCalledWith(
      expect.objectContaining({
        'article.toc': expect.objectContaining({
          configs: expect.objectContaining({
            'progress-map': expect.objectContaining({
              lineWeight: 'strong',
              pathStyle: 'rounded',
            }),
            standard: {},
          }),
          variant: 'progress-map',
        }),
      }),
    )
  })

  it('applies valid raw YAML and rejects invalid YAML without writing form state', () => {
    renderLookupField()

    fireEvent.click(screen.getByRole('button', { name: 'Configure Article table of contents' }))
    const editor = screen.getByLabelText('Article table of contents progress-map YAML config')

    fireEvent.change(editor, {
      target: {
        value: 'pathStyle: zigzag',
      },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Apply YAML' }))

    expect(screen.getByText(/registered options/)).toBeTruthy()
    expect(fieldState.setValue).not.toHaveBeenCalled()

    fireEvent.change(editor, {
      target: {
        value: ['pathStyle: flow', 'lineWeight: strong'].join('\n'),
      },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Apply YAML' }))

    expect(fieldState.setValue).toHaveBeenCalledWith(
      expect.objectContaining({
        'article.toc': expect.objectContaining({
          configs: expect.objectContaining({
            'progress-map': expect.objectContaining({
              lineWeight: 'strong',
              pathStyle: 'flow',
            }),
          }),
        }),
      }),
    )
  })
})
