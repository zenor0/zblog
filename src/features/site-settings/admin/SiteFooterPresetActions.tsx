'use client'

import type { UIFieldClientComponent } from 'payload'

import { Button, toast, useField, useLocale } from '@payloadcms/ui'

import type { SiteSettings } from '@/features/site-settings/model/site-settings'

import { getSiteFooterLabels } from '@/features/site-settings/model/site-footer'
import {
  getStarterSiteFooterPreset,
  mergeFooterFromGeneralSettings,
  mergeStarterGlobalVariables,
} from '@/features/site-settings/model/site-footer-preset'

export const SiteFooterPresetActions: UIFieldClientComponent = () => {
  const locale = useLocale()
  const labels = getSiteFooterLabels(locale?.code)
  const footer = useField<SiteSettings['footer']>({ path: 'footer' })
  const globalVariables = useField<SiteSettings['globalVariables']>({ path: 'globalVariables' })

  function applyStarterFooter() {
    const preset = getStarterSiteFooterPreset(locale?.code)

    footer.setValue(preset.footer)
    globalVariables.setValue(
      mergeStarterGlobalVariables(globalVariables.value, preset.globalVariables),
    )
    toast.success(labels.starterFooterApplied)
  }

  function fillFooterFromGeneral() {
    footer.setValue(
      mergeFooterFromGeneralSettings({
        footer: footer.value,
        globalVariables: globalVariables.value,
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
