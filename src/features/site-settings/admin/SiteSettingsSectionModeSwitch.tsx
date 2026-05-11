'use client'

import type { RadioFieldClientComponent } from 'payload'

import { useField } from '@payloadcms/ui'

import './site-settings-section-mode-switch.scss'

type SiteSettingsSectionEditorMode = 'form' | 'yaml'

function getLabel(label: unknown) {
  return typeof label === 'string' && label.length > 0 ? label : 'Editing mode'
}

function getMode(value: unknown): SiteSettingsSectionEditorMode {
  return value === 'yaml' ? 'yaml' : 'form'
}

export const SiteSettingsSectionModeSwitch: RadioFieldClientComponent = ({ field, path }) => {
  const fieldState = useField<SiteSettingsSectionEditorMode>({ path })
  const currentMode = getMode(fieldState.value)
  const label = getLabel(field.label)
  const options = [
    {
      label: 'Form',
      value: 'form' satisfies SiteSettingsSectionEditorMode,
    },
    {
      label: 'YAML',
      value: 'yaml' satisfies SiteSettingsSectionEditorMode,
    },
  ]

  return (
    <div className="site-settings-section-mode field-type">
      <div className="site-settings-section-mode__bar">
        <span className="site-settings-section-mode__label">{label}</span>
        <div aria-label={label} className="site-settings-section-mode__switch" role="group">
          {options.map((option) => {
            const isActive = currentMode === option.value

            return (
              <button
                aria-pressed={isActive}
                className="site-settings-section-mode__option"
                data-active={isActive ? 'true' : undefined}
                key={option.value}
                onClick={() => fieldState.setValue(option.value)}
                type="button"
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
