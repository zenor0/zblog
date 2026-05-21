import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const setSourceValue = vi.fn()
const setFilenameValue = vi.fn()

vi.mock('@payloadcms/ui', () => ({
  Button: ({
    children,
    buttonStyle: _buttonStyle,
    margin: _margin,
    size: _size,
    ...props
  }: any) => <button {...props}>{children}</button>,
  Collapsible: ({ actions, children, header, isCollapsed, onToggle }: any) => (
    <section>
      <button onClick={() => onToggle?.(!isCollapsed)} type="button">
        {header}
      </button>
      {actions}
      {isCollapsed ? null : children}
    </section>
  ),
  Pill: ({ children }: any) => <span>{children}</span>,
  TextInput: ({ label, onChange, path, value }: any) => (
    <label htmlFor={`field-${path}`}>
      <span>{label}</span>
      <input id={`field-${path}`} onChange={onChange} type="text" value={value} />
    </label>
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

import { BibliographyField } from '@/features/article/admin/BibliographyField'

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
    expect(screen.getByTestId('bibliography-upload-input').hasAttribute('hidden')).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: /doe2025/i }))

    expect(await screen.findByLabelText('Citation key')).toBeTruthy()
    expect(screen.getByLabelText('Title')).toBeTruthy()
  })
})
