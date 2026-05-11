'use client'

import type { TextFieldClientComponent } from 'payload'

import { useField, useFormFields } from '@payloadcms/ui'
import { useMemo } from 'react'

import {
  formatArticleDesignAdvancedControlValue,
  getArticleDesignAdvancedControlConfig,
  getArticleDesignAdvancedControlDefaultValue,
  parseArticleDesignAdvancedControlValue,
  type ArticleDesignPresetID,
} from '@/features/article/model/article-design'

import './article-design-range-field.scss'

type FormFieldState = {
  value?: unknown
}

type ArticleDesignRangeFormState = Record<string, FormFieldState | undefined>

function getStringValue(value: unknown) {
  return typeof value === 'string' ? value : undefined
}

function getFieldStringValue(fields: ArticleDesignRangeFormState | undefined, path: string) {
  return getStringValue(fields?.[path]?.value)
}

function getPresetID(fields: ArticleDesignRangeFormState | undefined) {
  const groupValue = fields?.articleLayout?.value
  const groupPreset =
    typeof groupValue === 'object' && groupValue !== null && 'preset' in groupValue
      ? getStringValue(groupValue.preset)
      : undefined

  return getFieldStringValue(fields, 'articleLayout.preset') ?? groupPreset
}

function getControlName(path: string, fieldName: unknown) {
  const pathName = path.split('.').at(-1)

  return typeof fieldName === 'string' ? fieldName : pathName
}

export const ArticleDesignRangeField: TextFieldClientComponent = ({ field, path }) => {
  const fieldState = useField<string>({ path })
  const fields = useFormFields(([formFields]) => formFields as ArticleDesignRangeFormState)
  const controlName = getControlName(path, field.name)
  const config = getArticleDesignAdvancedControlConfig(controlName)
  const presetID = getPresetID(fields)
  const defaultValue = config
    ? getArticleDesignAdvancedControlDefaultValue(config.name, presetID)
    : ''
  const currentValue =
    typeof fieldState.value === 'string' && fieldState.value.trim().length > 0
      ? fieldState.value.trim()
      : defaultValue
  const numericValue = useMemo(() => {
    if (!config) {
      return 0
    }

    return (
      parseArticleDesignAdvancedControlValue(config, currentValue) ??
      parseArticleDesignAdvancedControlValue(config, defaultValue) ??
      config.min
    )
  }, [config, currentValue, defaultValue])

  if (!config) {
    return null
  }

  const inputID = `article-design-range-${path.replace(/\W+/g, '-')}`
  const isInactive = presetID === ('current' satisfies ArticleDesignPresetID)

  return (
    <div
      className="article-design-range-field field-type"
      data-article-design-range={config.name}
      data-disabled={isInactive ? 'true' : undefined}
    >
      <div className="article-design-range-field__header">
        <label className="article-design-range-field__label" htmlFor={inputID}>
          {config.label}
        </label>
        <span className="article-design-range-field__default">Default {defaultValue}</span>
      </div>

      <input
        aria-label={config.label}
        className="article-design-range-field__input"
        disabled={isInactive}
        id={inputID}
        max={config.max}
        min={config.min}
        onChange={(event) => {
          fieldState.setValue(
            formatArticleDesignAdvancedControlValue(config, Number(event.target.value)),
          )
        }}
        step={config.step}
        type="range"
        value={numericValue}
      />

      <div className="article-design-range-field__meta">
        <span>Current {currentValue}</span>
        <button
          disabled={isInactive || currentValue === defaultValue}
          onClick={() => fieldState.setValue('')}
          type="button"
        >
          Use default
        </button>
      </div>

      <p className="article-design-range-field__description">
        {isInactive
          ? 'Current production style ignores article design token overrides.'
          : config.description}
      </p>
    </div>
  )
}
