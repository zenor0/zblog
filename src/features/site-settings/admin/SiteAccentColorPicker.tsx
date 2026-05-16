'use client'

import type { CSSProperties } from 'react'
import type { TextFieldClientComponent } from 'payload'

import { useField } from '@payloadcms/ui'
import { useEffect, useMemo, useState } from 'react'

import {
  defaultFrontendAccentColor,
  frontendAccentColorPresets,
  validateFrontendAccentColor,
} from '@/shared/theme/frontend-theme'

import './site-accent-color-picker.scss'

const fallbackColorInputValue = frontendAccentColorPresets[0]?.preview ?? '#14b8a6'
const sixDigitHexColorPattern = /^#[0-9a-f]{6}$/i
const threeDigitHexColorPattern = /^#[0-9a-f]{3}$/i

function getStringValue(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function getLabel(label: unknown) {
  return typeof label === 'string' && label.length > 0 ? label : 'Accent color'
}

function getDescription(description: unknown) {
  return typeof description === 'string' && description.length > 0 ? description : undefined
}

function expandHexColor(value: string) {
  const color = value.trim()

  if (sixDigitHexColorPattern.test(color)) {
    return color
  }

  if (!threeDigitHexColorPattern.test(color)) {
    return null
  }

  const [, red = '', green = '', blue = ''] = color

  return `#${red}${red}${green}${green}${blue}${blue}`
}

function getColorInputValue(value: string) {
  const hexValue = expandHexColor(value)

  if (hexValue) {
    return hexValue
  }

  const preset = frontendAccentColorPresets.find((item) => item.value === value.trim())

  return preset?.preview ?? fallbackColorInputValue
}

function getValidationMessage(value: string) {
  const validation = validateFrontendAccentColor(value)

  return validation === true ? null : validation
}

export const SiteAccentColorPicker: TextFieldClientComponent = ({ field, path }) => {
  const fieldState = useField<string>({ path })
  const [draftValue, setDraftValue] = useState(() => getStringValue(fieldState.value))
  const label = getLabel(field.label)
  const description = getDescription(field.admin?.description)
  const inputID = `site-accent-color-${path.replace(/\W+/g, '-')}`
  const colorInputID = `${inputID}-native`
  const helpID = `${inputID}-help`
  const value = draftValue.trim()
  const validationMessage = getValidationMessage(draftValue)
  const isValid = validationMessage === null
  const previewColor = value.length > 0 ? value : defaultFrontendAccentColor
  const previewStyle = (
    isValid
      ? {
          background: previewColor,
        }
      : undefined
  ) satisfies CSSProperties | undefined
  const colorInputValue = useMemo(() => getColorInputValue(value), [value])

  useEffect(() => {
    setDraftValue(getStringValue(fieldState.value))
  }, [fieldState.value])

  function commitValue(nextValue: string) {
    setDraftValue(nextValue)
    fieldState.setValue(nextValue)
  }

  return (
    <div
      className="site-accent-color-picker field-type"
      data-invalid={isValid ? undefined : 'true'}
    >
      <div className="site-accent-color-picker__header">
        <div className="site-accent-color-picker__copy">
          <label className="site-accent-color-picker__label" htmlFor={inputID}>
            {label}
          </label>
          {description ? (
            <p className="site-accent-color-picker__description">{description}</p>
          ) : null}
        </div>

        <div className="site-accent-color-picker__current">
          <span
            aria-label="Accent color preview"
            className="site-accent-color-picker__preview"
            data-valid={isValid ? 'true' : 'false'}
            style={previewStyle}
          />
          <output aria-label="Current accent color" className="site-accent-color-picker__value">
            {value.length > 0 ? value : defaultFrontendAccentColor}
          </output>
        </div>
      </div>

      <div className="site-accent-color-picker__controls">
        <label className="site-accent-color-picker__native-control" htmlFor={colorInputID}>
          <span>Pick accent color</span>
          <input
            id={colorInputID}
            onChange={(event) => commitValue(event.currentTarget.value)}
            type="color"
            value={colorInputValue}
          />
        </label>

        <input
          aria-describedby={helpID}
          aria-invalid={isValid ? undefined : true}
          aria-label="Accent color value"
          className="site-accent-color-picker__text-input"
          id={inputID}
          onChange={(event) => commitValue(event.currentTarget.value)}
          placeholder={defaultFrontendAccentColor}
          type="text"
          value={draftValue}
        />

        <button
          className="site-accent-color-picker__default-button"
          disabled={value === defaultFrontendAccentColor}
          onClick={() => commitValue(defaultFrontendAccentColor)}
          type="button"
          aria-label="Use default accent color"
        >
          Use default
        </button>
      </div>

      <div
        aria-label="Accent color presets"
        className="site-accent-color-picker__presets"
        role="group"
      >
        {frontendAccentColorPresets.map((preset) => {
          const isActive = value === preset.value
          const presetStyle = {
            '--site-accent-color-preset': preset.preview,
          } as CSSProperties

          return (
            <button
              aria-label={`Use ${preset.label} accent color`}
              aria-pressed={isActive}
              className="site-accent-color-picker__preset"
              data-active={isActive ? 'true' : undefined}
              key={preset.label}
              onClick={() => commitValue(preset.value)}
              style={presetStyle}
              type="button"
            >
              <span className="site-accent-color-picker__preset-swatch" />
              <span>{preset.label}</span>
            </button>
          )
        })}
      </div>

      <p
        className="site-accent-color-picker__help"
        data-error={validationMessage ? 'true' : undefined}
        id={helpID}
      >
        {validationMessage ?? 'Hex colors and safe oklch() values are supported.'}
      </p>
    </div>
  )
}
