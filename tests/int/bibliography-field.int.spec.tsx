import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const setSourceValue = vi.fn()
const setFilenameValue = vi.fn()

vi.mock('@payloadcms/ui', () => ({
  Button: ({ children, buttonStyle: _buttonStyle, size: _size, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
  useField: ({ path }: { path: string }) => {
    if (path === 'bibliography.source') {
      return {
        setValue: setSourceValue,
        value:
          '@article{doe2025,\n  title = {Composable Publishing Workflows},\n  author = {Doe, Jane},\n  year = {2025}\n}',
      }
    }

    return {
      setValue: setFilenameValue,
      value: 'references.bib',
    }
  },
}))

import { BibliographyField } from '@/components/payload/BibliographyField'

describe('BibliographyField', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders structured entries collapsed by default and expands on demand', async () => {
    render(
      <BibliographyField
        field={{ fields: [], name: 'bibliography', type: 'group' } as any}
        path="bibliography"
      />,
    )

    expect(screen.getByRole('button', { name: /doe2025/i })).toBeTruthy()
    expect(screen.queryByLabelText('Citation key')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /doe2025/i }))

    expect(await screen.findByLabelText('Citation key')).toBeTruthy()
    expect(screen.getByLabelText('Title')).toBeTruthy()
  })
})
