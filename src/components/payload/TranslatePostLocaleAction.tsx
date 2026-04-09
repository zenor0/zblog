'use client'

import { Button, SelectInput, toast, useConfig } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

type SourceOption = {
  code: string
  label: string
}

function getSelectedLocaleValue(selectedOption: unknown): string {
  if (!selectedOption || Array.isArray(selectedOption)) {
    return ''
  }

  if (
    typeof selectedOption === 'object' &&
    'value' in selectedOption &&
    typeof selectedOption.value === 'string'
  ) {
    return selectedOption.value
  }

  return ''
}

type TranslatePostLocaleActionProps = {
  collectionSlug: string
  id: number | string
  sourceOptions: SourceOption[]
  targetLabel: string
  targetLocale: string
}

export function TranslatePostLocaleAction(props: TranslatePostLocaleActionProps) {
  const router = useRouter()
  const { config } = useConfig()
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [sourceLocale, setSourceLocale] = useState('')

  const availableSources = useMemo(
    () => props.sourceOptions.filter((option) => option.code !== props.targetLocale),
    [props.sourceOptions, props.targetLocale],
  )

  async function handleTranslate() {
    if (!sourceLocale) {
      toast.error('Choose a source locale first.')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`${config.routes.api}/${props.collectionSlug}/${props.id}/auto-translate`, {
        body: JSON.stringify({
          sourceLocale,
          targetLocale: props.targetLocale,
        }),
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
        },
        method: 'POST',
      })

      const payload = (await response.json().catch(() => null)) as { message?: string } | null

      if (!response.ok) {
        throw new Error(payload?.message || `Translation failed with status ${response.status}.`)
      }

      const sourceLabel =
        availableSources.find((option) => option.code === sourceLocale)?.label ?? sourceLocale

      toast.success(`Updated ${props.targetLabel} from ${sourceLabel}.`)
      setIsOpen(false)
      setSourceLocale('')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Translation failed.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="post-translation-manager__action">
      <Button
        buttonStyle="secondary"
        margin={false}
        onClick={() => setIsOpen((current) => !current)}
        size="small"
        type="button"
      >
        Translate from...
      </Button>

      {isOpen ? (
        <div className="post-translation-manager__action-panel" data-popup-prevent-close>
          <p className="post-translation-manager__action-note">
            Copy the current article structure and translated values from another locale version.
          </p>

          <SelectInput
            isClearable={false}
            label="Source locale"
            name={`translate-${props.id}-${props.targetLocale}-source`}
            onChange={(selectedOption: unknown) => setSourceLocale(getSelectedLocaleValue(selectedOption))}
            options={availableSources.map((option) => ({
              label: option.label,
              value: option.code,
            }))}
            path={`translate-${props.id}-${props.targetLocale}-source`}
            placeholder="Select a locale"
            readOnly={isLoading}
            value={sourceLocale}
          />

          <div className="post-translation-manager__action-buttons">
            <Button
              buttonStyle="primary"
              disabled={!sourceLocale || isLoading}
              margin={false}
              onClick={() => void handleTranslate()}
              size="small"
              type="button"
            >
              {isLoading ? 'Translating…' : 'Run translation'}
            </Button>

            <Button
              buttonStyle="secondary"
              margin={false}
              onClick={() => {
                setIsOpen(false)
                setSourceLocale('')
              }}
              size="small"
              type="button"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default TranslatePostLocaleAction
