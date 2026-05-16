'use client'

import type { JSONFieldClientComponent } from 'payload'

import { useField } from '@payloadcms/ui'
import { useMemo } from 'react'

import {
  frontendVariantRegistry,
  resolveFrontendVariantLookup,
  type FrontendVariantLookupInput,
  type FrontendVariantSurfaceID,
} from '@/features/frontend-variants/model/frontend-variants'

import './frontend-variant-lookup-field.scss'

const surfaces = Object.values(frontendVariantRegistry)

function getLabel(label: unknown) {
  return typeof label === 'string' && label.length > 0 ? label : 'Variant lookup'
}

function getDescription(description: unknown) {
  return typeof description === 'string' && description.length > 0 ? description : null
}

export const FrontendVariantLookupField: JSONFieldClientComponent = ({ field, path }) => {
  const fieldState = useField<FrontendVariantLookupInput>({ path })
  const resolvedLookup = useMemo(
    () => resolveFrontendVariantLookup({ values: fieldState.value }),
    [fieldState.value],
  )
  const label = getLabel(field.label)
  const description = getDescription(field.admin?.description)

  function setSurfaceVariant(surface: FrontendVariantSurfaceID, variant: string) {
    fieldState.setValue({
      ...resolvedLookup,
      [surface]: variant,
    })
  }

  return (
    <div className="frontend-variant-lookup field-type">
      <div className="frontend-variant-lookup__header">
        <div className="frontend-variant-lookup__heading">
          <label className="frontend-variant-lookup__label">{label}</label>
          {description ? <p className="frontend-variant-lookup__description">{description}</p> : null}
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

              return (
                <tr key={surface.id}>
                  <th scope="row">
                    <span className="frontend-variant-lookup__surface-label">{surface.label}</span>
                    <span className="frontend-variant-lookup__surface-id">{surface.id}</span>
                  </th>
                  <td>
                    <select
                      aria-label={`${surface.label} variant`}
                      className="frontend-variant-lookup__select"
                      onChange={(event) => {
                        setSurfaceVariant(surface.id, event.target.value)
                      }}
                      value={currentVariant}
                    >
                      {surface.variants.map((variant) => (
                        <option key={variant.id} value={variant.id}>
                          {variant.label}
                        </option>
                      ))}
                    </select>
                    <p className="frontend-variant-lookup__variant-description">
                      {
                        surface.variants.find((variant) => variant.id === currentVariant)
                          ?.description
                      }
                    </p>
                  </td>
                  <td>
                    <button
                      className="frontend-variant-lookup__default-button"
                      disabled={currentVariant === surface.defaultVariant}
                      onClick={() => {
                        setSurfaceVariant(surface.id, surface.defaultVariant)
                      }}
                      type="button"
                    >
                      {surface.defaultVariant}
                    </button>
                  </td>
                  <td>{surface.description}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
