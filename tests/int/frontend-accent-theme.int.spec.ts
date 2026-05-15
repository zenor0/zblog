import { describe, expect, it } from 'vitest'

import {
  defaultFrontendAccentColor,
  resolveFrontendAccentColor,
  resolveFrontendAccentStyle,
  validateFrontendAccentColor,
} from '@/shared/theme/frontend-theme'

describe('frontend accent theme helpers', () => {
  it('accepts safe hex and oklch accent colors', () => {
    expect(validateFrontendAccentColor('#14b8a6')).toBe(true)
    expect(validateFrontendAccentColor('#0F766E')).toBe(true)
    expect(validateFrontendAccentColor('oklch(0.62 0.14 190)')).toBe(true)
    expect(validateFrontendAccentColor('oklch(72% 0.11 190 / 82%)')).toBe(true)
  })

  it('rejects unsafe or unsupported CSS color input', () => {
    expect(validateFrontendAccentColor('var(--accent)')).not.toBe(true)
    expect(validateFrontendAccentColor('url(https://example.com)')).not.toBe(true)
    expect(validateFrontendAccentColor('oklch(0.62 0.14 190); color: red')).not.toBe(true)
    expect(validateFrontendAccentColor('teal')).not.toBe(true)
  })

  it('resolves valid settings and falls back to the default accent', () => {
    expect(
      resolveFrontendAccentColor({
        appearance: {
          accentColor: '#14b8a6',
        },
      }),
    ).toBe('#14b8a6')

    expect(
      resolveFrontendAccentColor({
        appearance: {
          accentColor: 'var(--unsafe)',
        },
      }),
    ).toBe(defaultFrontendAccentColor)

    expect(resolveFrontendAccentColor({})).toBe(defaultFrontendAccentColor)
  })

  it('returns a safe CSS custom property style object', () => {
    expect(
      resolveFrontendAccentStyle({
        appearance: {
          accentColor: '#14b8a6',
        },
      }),
    ).toEqual({
      '--zblog-accent': '#14b8a6',
    })
  })
})
