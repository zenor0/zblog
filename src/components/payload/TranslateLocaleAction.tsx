'use client'

import { Button, Popup, toast, useConfig, useDocumentInfo, useLocale } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { getLocaleLabel, getTranslationSourceLocale, isLocale } from '@/lib/locales'

import './translate-locale-action.scss'

export function TranslateLocaleAction() {
  const router = useRouter()
  const { config } = useConfig()
  const { collectionSlug, id } = useDocumentInfo()
  const locale = useLocale()
  const [isLoading, setIsLoading] = useState(false)
  const localeCode = locale?.code

  if (!collectionSlug || !id || typeof localeCode !== 'string' || !isLocale(localeCode)) {
    return null
  }

  const sourceLocale = getTranslationSourceLocale(localeCode)
  const sourceLabel = getLocaleLabel(sourceLocale)
  const targetLabel = getLocaleLabel(localeCode)

  async function handleTranslate(onComplete?: () => void) {
    setIsLoading(true)

    try {
      const response = await fetch(`${config.routes.api}/${collectionSlug}/${id}/auto-translate`, {
        body: JSON.stringify({
          sourceLocale,
          targetLocale: localeCode,
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

      toast.success(`Updated ${targetLabel} content with a machine translation from ${sourceLabel}.`)
      onComplete?.()
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Translation failed.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Popup
      button={
        <Button
          buttonStyle="secondary"
          el="div"
          extraButtonProps={{
            'data-testid': 'translate-locale-trigger',
          }}
          size="small"
        >
          Translate
        </Button>
      }
      buttonType="custom"
      horizontalAlign="right"
      id={`translate-locale-${id}-${localeCode}`}
      noBackground
      render={({ close }) => (
        <div className="translate-locale-action" data-popup-prevent-close data-testid="translate-locale-menu">
          <p className="translate-locale-action__eyebrow">Machine translation</p>
          <p className="translate-locale-action__description">
            Generate <strong>{targetLabel}</strong> from <strong>{sourceLabel}</strong>. This
            overwrites the current locale fields.
          </p>
          <div className="translate-locale-action__meta">
            <span>{sourceLabel}</span>
            <span aria-hidden="true">→</span>
            <span>{targetLabel}</span>
          </div>
          <Button
            buttonStyle="primary"
            disabled={isLoading}
            extraButtonProps={{
              'data-testid': 'translate-locale-submit',
            }}
            onClick={() => void handleTranslate(close)}
            size="small"
          >
            {isLoading ? 'Translating…' : 'Run translation'}
          </Button>
        </div>
      )}
      size="medium"
      verticalAlign="bottom"
    />
  )
}
