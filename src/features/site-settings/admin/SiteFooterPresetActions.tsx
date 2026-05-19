'use client'

import type { UIFieldClientComponent } from 'payload'

import { Button, toast, useField, useFormFields, useLocale } from '@payloadcms/ui'
import { useMemo } from 'react'

import type { SiteSettings } from '@/features/site-settings/model/site-settings'

import {
  readSiteSettingsSnapshot,
  type SiteSettingsFormState,
} from '@/features/site-settings/admin/site-settings-form-state'
import { getSiteFooterLabels } from '@/features/site-settings/model/site-footer'
import {
  getStarterSiteFooterPreset,
  mergeFooterFromGeneralSettings,
  mergeStarterGlobalVariables,
} from '@/features/site-settings/model/site-footer-preset'

export const SiteFooterPresetActions: UIFieldClientComponent = () => {
  const locale = useLocale()
  const labels = getSiteFooterLabels(locale?.code)
  const fields = useFormFields(([formFields]) => formFields as SiteSettingsFormState)
  const settings = useMemo(() => readSiteSettingsSnapshot<Partial<SiteSettings>>(fields), [fields])
  const footer = useField<SiteSettings['footer']>({ path: 'footer' })
  const globalVariables = useField<SiteSettings['globalVariables']>({ path: 'globalVariables' })

  function applyStarterFooter() {
    const preset = getStarterSiteFooterPreset(locale?.code)

    footer.setValue(preset.footer)
    globalVariables.setValue(
      mergeStarterGlobalVariables(settings.globalVariables, preset.globalVariables),
    )
    toast.success(labels.starterFooterApplied)
  }

  function fillFooterFromGeneral() {
    footer.setValue(
      mergeFooterFromGeneralSettings({
        footer: settings.footer,
        globalVariables: settings.globalVariables,
      }),
    )
    toast.success(labels.footerFilledFromGeneral)
  }

  return (
    <div className="site-footer-preset-actions field-type">
      <Button
        buttonStyle="secondary"
        extraButtonProps={{
          'data-testid': 'site-footer-sync-general',
        }}
        onClick={fillFooterFromGeneral}
        size="small"
      >
        {labels.fillFooterFromGeneral}
      </Button>
      <Button
        buttonStyle="secondary"
        extraButtonProps={{
          'data-testid': 'site-footer-apply-starter',
        }}
        onClick={applyStarterFooter}
        size="small"
      >
        {labels.applyStarterFooter}
      </Button>
    </div>
  )
}
