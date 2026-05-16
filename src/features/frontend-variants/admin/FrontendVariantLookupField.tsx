'use client'

import type { JSONFieldClientComponent } from 'payload'

import { CodeEditor, useField } from '@payloadcms/ui'
import { Fragment, useEffect, useMemo, useState } from 'react'

import {
  type FrontendVariantConfigField,
  frontendVariantRegistry,
  parseFrontendVariantConfigYAML,
  resolveFrontendVariantLookup,
  serializeFrontendVariantConfigToYAML,
  type FrontendVariantLookupInput,
  type FrontendVariantSurfaceID,
} from '@/features/frontend-variants/model/frontend-variants'

import './frontend-variant-lookup-field.scss'

const surfaces = Object.values(frontendVariantRegistry)
type VariantID = (typeof surfaces)[number]['variants'][number]['id']

function getLabel(label: unknown) {
  return typeof label === 'string' && label.length > 0 ? label : 'Variant lookup'
}

function getDescription(description: unknown) {
  return typeof description === 'string' && description.length > 0 ? description : null
}

function getVariantDefinition(surface: FrontendVariantSurfaceID, variant: string) {
  return frontendVariantRegistry[surface].variants.find((item) => item.id === variant)
}

function getConfigSchema(definition: ReturnType<typeof getVariantDefinition>) {
  return definition && 'configSchema' in definition
    ? (definition.configSchema as readonly FrontendVariantConfigField[])
    : []
}

export const FrontendVariantLookupField: JSONFieldClientComponent = ({ field, path }) => {
  const fieldState = useField<FrontendVariantLookupInput>({ path })
  const resolvedLookup = useMemo(
    () => resolveFrontendVariantLookup({ values: fieldState.value }),
    [fieldState.value],
  )
  const label = getLabel(field.label)
  const description = getDescription(field.admin?.description)
  const [expandedSurface, setExpandedSurface] = useState<FrontendVariantSurfaceID | null>(null)
  const [rawDraftKey, setRawDraftKey] = useState('')
  const [rawDraft, setRawDraft] = useState('')
  const [rawError, setRawError] = useState<null | string>(null)

  const expandedSelection = expandedSurface ? resolvedLookup[expandedSurface] : null
  const expandedVariant = expandedSelection?.variant ?? null
  const expandedRawKey =
    expandedSurface && expandedVariant ? `${expandedSurface}:${expandedVariant}` : ''
  const expandedConfig =
    expandedSurface && expandedVariant ? expandedSelection?.configs[expandedVariant] : null

  useEffect(() => {
    if (!expandedSurface || !expandedVariant || rawDraftKey === expandedRawKey) {
      return
    }

    setRawDraft(
      serializeFrontendVariantConfigToYAML(expandedSurface, expandedVariant, expandedConfig ?? {}),
    )
    setRawDraftKey(expandedRawKey)
    setRawError(null)
  }, [expandedConfig, expandedRawKey, expandedSurface, expandedVariant, rawDraftKey])

  function setSurfaceVariant(surface: FrontendVariantSurfaceID, variant: string) {
    if (!getVariantDefinition(surface, variant)) {
      return
    }

    const current = resolvedLookup[surface]

    fieldState.setValue({
      ...resolvedLookup,
      [surface]: {
        ...current,
        variant,
      },
    })
  }

  function setVariantConfigValue(
    surface: FrontendVariantSurfaceID,
    variant: VariantID,
    name: string,
    value: unknown,
  ) {
    const current = resolvedLookup[surface]
    const currentConfig = current.configs[variant] ?? {}

    fieldState.setValue({
      ...resolvedLookup,
      [surface]: {
        ...current,
        configs: {
          ...current.configs,
          [variant]: {
            ...currentConfig,
            [name]: value,
          },
        },
      },
    })
  }

  function applyRawYAML(surface: FrontendVariantSurfaceID, variant: VariantID) {
    try {
      const parsed = parseFrontendVariantConfigYAML(surface, variant, rawDraft)
      const current = resolvedLookup[surface]

      fieldState.setValue({
        ...resolvedLookup,
        [surface]: {
          ...current,
          configs: {
            ...current.configs,
            [variant]: parsed,
          },
        },
      })
      setRawError(null)
    } catch (caughtError) {
      setRawError(caughtError instanceof Error ? caughtError.message : 'Could not apply YAML.')
    }
  }

  function renderConfigField(
    surface: FrontendVariantSurfaceID,
    variant: VariantID,
    config: Record<string, unknown>,
    configField: FrontendVariantConfigField,
  ) {
    const inputID = `frontend-variant-${surface}-${variant}-${configField.name}`.replace(
      /\W+/g,
      '-',
    )
    const value = config[configField.name] ?? configField.defaultValue

    if (configField.type === 'select') {
      return (
        <label
          className="frontend-variant-lookup__control"
          htmlFor={inputID}
          key={configField.name}
        >
          <span>{configField.label}</span>
          <select
            aria-label={configField.label}
            id={inputID}
            onChange={(event) => {
              setVariantConfigValue(surface, variant, configField.name, event.target.value)
            }}
            value={String(value)}
          >
            {configField.options.map((option) => (
              <option key={String(option.value)} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <small>{configField.description}</small>
        </label>
      )
    }

    if (configField.type === 'multiSelect') {
      const values = Array.isArray(value) ? value : configField.defaultValue

      return (
        <div
          aria-label={configField.label}
          className="frontend-variant-lookup__control"
          key={configField.name}
          role="group"
        >
          <span>{configField.label}</span>
          <div className="frontend-variant-lookup__check-list">
            {configField.options.map((option) => {
              const isChecked = values.includes(option.value as never)

              return (
                <label key={String(option.value)}>
                  <input
                    checked={isChecked}
                    onChange={() => {
                      const nextValues = isChecked
                        ? values.filter((item) => item !== option.value)
                        : [...values, option.value]

                      setVariantConfigValue(
                        surface,
                        variant,
                        configField.name,
                        nextValues.length > 0 ? nextValues : values,
                      )
                    }}
                    type="checkbox"
                  />
                  <span>{option.label}</span>
                </label>
              )
            })}
          </div>
          <small>{configField.description}</small>
        </div>
      )
    }

    if (configField.type === 'number') {
      const numberValue = typeof value === 'number' ? value : configField.defaultValue

      return (
        <label
          className="frontend-variant-lookup__control"
          htmlFor={inputID}
          key={configField.name}
        >
          <span>{configField.label}</span>
          <input
            aria-label={configField.label}
            id={inputID}
            max={configField.max}
            min={configField.min}
            onChange={(event) => {
              setVariantConfigValue(surface, variant, configField.name, Number(event.target.value))
            }}
            step={configField.step}
            type="range"
            value={numberValue}
          />
          <small>
            {configField.description} Current {numberValue}
          </small>
        </label>
      )
    }

    return (
      <label className="frontend-variant-lookup__control" htmlFor={inputID} key={configField.name}>
        <span>{configField.label}</span>
        <input
          aria-label={configField.label}
          checked={Boolean(value)}
          id={inputID}
          onChange={(event) => {
            setVariantConfigValue(surface, variant, configField.name, event.target.checked)
          }}
          type="checkbox"
        />
        <small>{configField.description}</small>
      </label>
    )
  }

  return (
    <div className="frontend-variant-lookup field-type">
      <div className="frontend-variant-lookup__header">
        <div className="frontend-variant-lookup__heading">
          <label className="frontend-variant-lookup__label">{label}</label>
          {description ? (
            <p className="frontend-variant-lookup__description">{description}</p>
          ) : null}
        </div>
      </div>

      <div className="frontend-variant-lookup__table-wrap">
        <table className="frontend-variant-lookup__table">
          <thead>
            <tr>
              <th scope="col">Surface</th>
              <th scope="col">Current variant</th>
              <th scope="col">Default</th>
              <th scope="col">Description</th>
            </tr>
          </thead>
          <tbody>
            {surfaces.map((surface) => {
              const currentVariant = resolvedLookup[surface.id]
              const currentVariantDefinition = getVariantDefinition(
                surface.id,
                currentVariant.variant,
              )
              const currentConfigSchema = getConfigSchema(currentVariantDefinition)
              const hasConfig = currentConfigSchema.length > 0

              return (
                <Fragment key={surface.id}>
                  <tr>
                    <th scope="row">
                      <span className="frontend-variant-lookup__surface-label">
                        {surface.label}
                      </span>
                      <span className="frontend-variant-lookup__surface-id">{surface.id}</span>
                    </th>
                    <td>
                      <select
                        aria-label={`${surface.label} variant`}
                        className="frontend-variant-lookup__select"
                        onChange={(event) => {
                          setSurfaceVariant(surface.id, event.target.value)
                        }}
                        value={currentVariant.variant}
                      >
                        {surface.variants.map((variant) => (
                          <option key={variant.id} value={variant.id}>
                            {variant.label}
                          </option>
                        ))}
                      </select>
                      <p className="frontend-variant-lookup__variant-description">
                        {currentVariantDefinition?.description}
                      </p>
                    </td>
                    <td>
                      <button
                        className="frontend-variant-lookup__default-button"
                        disabled={currentVariant.variant === surface.defaultVariant}
                        onClick={() => {
                          setSurfaceVariant(surface.id, surface.defaultVariant)
                        }}
                        type="button"
                      >
                        {surface.defaultVariant}
                      </button>
                    </td>
                    <td>
                      <span>{surface.description}</span>
                      <button
                        className="frontend-variant-lookup__configure-button"
                        disabled={!hasConfig}
                        onClick={() => {
                          setExpandedSurface((current) =>
                            current === surface.id ? null : surface.id,
                          )
                        }}
                        type="button"
                      >
                        Configure {surface.label}
                      </button>
                    </td>
                  </tr>
                  {expandedSurface === surface.id && hasConfig ? (
                    <tr className="frontend-variant-lookup__config-row">
                      <td colSpan={4}>
                        <div className="frontend-variant-lookup__config-panel">
                          <div className="frontend-variant-lookup__config-controls">
                            <h3>{currentVariantDefinition?.label} config</h3>
                            {currentConfigSchema.map((configField) =>
                              renderConfigField(
                                surface.id,
                                currentVariant.variant,
                                currentVariant.configs[currentVariant.variant] as Record<
                                  string,
                                  unknown
                                >,
                                configField,
                              ),
                            )}
                          </div>
                          <div className="frontend-variant-lookup__raw-panel">
                            <h3>Raw YAML</h3>
                            <CodeEditor
                              defaultLanguage="yaml"
                              onChange={(value) => {
                                setRawDraft(value ?? '')
                              }}
                              options={{
                                minimap: {
                                  enabled: false,
                                },
                                wordWrap: 'on',
                              }}
                              value={rawDraft}
                              wrapperProps={{
                                'aria-label': `${surface.label} ${currentVariant.variant} YAML config`,
                              }}
                            />
                            <button
                              onClick={() => {
                                applyRawYAML(surface.id, currentVariant.variant)
                              }}
                              type="button"
                            >
                              Apply YAML
                            </button>
                            {rawError ? (
                              <p className="frontend-variant-lookup__error">{rawError}</p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
