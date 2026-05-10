import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const fieldState = {
  setValue: vi.fn(),
  value: 'form',
}

vi.mock('@payloadcms/ui', () => ({
  useField: () => fieldState,
}))

import { SiteSettingsSectionModeSwitch } from '@/components/payload/SiteSettingsSectionModeSwitch'

describe('SiteSettingsSectionModeSwitch', () => {
  afterEach(() => {
    fieldState.value = 'form'
    fieldState.setValue.mockClear()
  })

  it('renders a compact switch instead of tab navigation', () => {
    render(
      <SiteSettingsSectionModeSwitch
        field={
          {
            label: 'Editing mode',
            name: 'articleLayoutEditorMode',
            options: [
              { label: 'Form', value: 'form' },
              { label: 'YAML', value: 'yaml' },
            ],
            type: 'radio',
          } as any
        }
        path="articleLayoutEditorMode"
      />,
    )

    expect(screen.queryByRole('tablist')).toBeNull()
    expect(screen.getByRole('group', { name: 'Editing mode' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Form' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'YAML' }).getAttribute('aria-pressed')).toBe('false')
  })

  it('updates the local editor mode field', () => {
    render(
      <SiteSettingsSectionModeSwitch
        field={
          {
            label: 'Editing mode',
            name: 'footerEditorMode',
            options: [
              { label: 'Form', value: 'form' },
              { label: 'YAML', value: 'yaml' },
            ],
            type: 'radio',
          } as any
        }
        path="footerEditorMode"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'YAML' }))

    expect(fieldState.setValue).toHaveBeenCalledWith('yaml')
  })
})
