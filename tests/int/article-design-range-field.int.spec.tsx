import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

let mockedFormFields: Record<string, any>
const setValue = vi.fn()

vi.mock('@payloadcms/ui', () => ({
  useField: () => ({
    setValue,
    value: undefined,
  }),
  useFormFields: (selector: any) => selector([mockedFormFields]),
}))

import { ArticleDesignRangeField } from '@/features/article/admin/ArticleDesignRangeField'

describe('ArticleDesignRangeField', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders a slider with the selected preset default instead of a textbox', () => {
    mockedFormFields = {
      articleLayout: {
        value: {
          preset: 'compact-editorial',
        },
      },
    }

    render(
      <ArticleDesignRangeField
        field={{ label: 'Content width', name: 'contentWidth', type: 'text' } as any}
        path="articleLayout.advanced.contentWidth"
      />,
    )

    expect(screen.getByRole('slider', { name: 'Content width' })).toBeTruthy()
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.getByText('Default 70ch')).toBeTruthy()
    expect(screen.getByText('Current 70ch')).toBeTruthy()
  })

  it('commits controlled CSS token values through Payload form state', () => {
    mockedFormFields = {
      'articleLayout.preset': {
        value: 'balanced-editorial',
      },
    }

    render(
      <ArticleDesignRangeField
        field={{ label: 'Body line height', name: 'bodyLineHeight', type: 'text' } as any}
        path="articleLayout.advanced.bodyLineHeight"
      />,
    )

    fireEvent.change(screen.getByRole('slider', { name: 'Body line height' }), {
      target: { value: '1.76' },
    })

    expect(setValue).toHaveBeenCalledWith('1.76')
  })
})
