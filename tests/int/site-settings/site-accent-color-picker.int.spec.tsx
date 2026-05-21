import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  defaultFrontendAccentColor,
  frontendAccentColorPresets,
} from '@/shared/theme/frontend-theme'

const fieldState = {
  setValue: vi.fn(),
  value: defaultFrontendAccentColor,
}

vi.mock('@payloadcms/ui', () => ({
  useField: () => fieldState,
}))

import { SiteAccentColorPicker } from '@/features/site-settings/admin/SiteAccentColorPicker'

function renderPicker() {
  render(
    <SiteAccentColorPicker
      field={
        {
          admin: {
            description: 'Frontend visual accents used for links and progress indicators.',
          },
          label: 'Accent color',
          name: 'accentColor',
          type: 'text',
        } as any
      }
      path="appearance.accentColor"
    />,
  )
}

describe('SiteAccentColorPicker', () => {
  afterEach(() => {
    fieldState.value = defaultFrontendAccentColor
    fieldState.setValue.mockClear()
  })

  it('renders a visual picker, current swatch, and preset colors instead of only a textbox', () => {
    renderPicker()

    expect(screen.getByText('Accent color')).toBeTruthy()
    expect(
      screen.getByText('Frontend visual accents used for links and progress indicators.'),
    ).toBeTruthy()
    expect(screen.getByLabelText('Accent color preview').getAttribute('data-valid')).toBe('true')
    expect(
      (screen.getByRole('textbox', { name: 'Accent color value' }) as HTMLInputElement).value,
    ).toBe(defaultFrontendAccentColor)
    expect(screen.getByLabelText('Pick accent color')).toBeTruthy()
    expect(screen.getByRole('group', { name: 'Accent color presets' })).toBeTruthy()

    for (const preset of frontendAccentColorPresets) {
      expect(screen.getByRole('button', { name: `Use ${preset.label} accent color` })).toBeTruthy()
    }
  })

  it('commits preset selections through the Payload field state', () => {
    renderPicker()

    const rosePreset = frontendAccentColorPresets.find((preset) => preset.label === 'Rose')

    expect(rosePreset).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Use Rose accent color' }))

    expect(fieldState.setValue).toHaveBeenCalledWith(rosePreset?.value)
  })

  it('uses the native color input for quick hex color choices', () => {
    renderPicker()

    fireEvent.change(screen.getByLabelText('Pick accent color'), {
      target: { value: '#7c3aed' },
    })

    expect(fieldState.setValue).toHaveBeenCalledWith('#7c3aed')
  })

  it('keeps custom value entry visible while warning about invalid CSS input', () => {
    renderPicker()

    fireEvent.change(screen.getByRole('textbox', { name: 'Accent color value' }), {
      target: { value: 'var(--unsafe)' },
    })

    expect(fieldState.setValue).toHaveBeenCalledWith('var(--unsafe)')
    expect(screen.getByLabelText('Accent color preview').getAttribute('data-valid')).toBe('false')
    expect(screen.getByText(/cannot contain CSS functions/i)).toBeTruthy()
  })

  it('restores the default accent color without requiring manual typing', () => {
    fieldState.value = '#7c3aed'

    renderPicker()

    fireEvent.click(screen.getByRole('button', { name: 'Use default accent color' }))

    expect(fieldState.setValue).toHaveBeenCalledWith(defaultFrontendAccentColor)
  })
})
