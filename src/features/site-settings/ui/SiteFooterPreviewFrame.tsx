'use client'

import { useEffect, useMemo, useState } from 'react'

import { SiteFooterLayout } from '@/features/site-settings/ui/SiteFooter'
import { normalizeSiteFooter } from '@/features/site-settings/model/site-footer'
import type { AppLocale } from '@/shared/i18n/locales'
import type { SiteSettings } from '@/features/site-settings/model/site-settings'
import {
  isSiteFooterPreviewMessage,
  resolveSiteFooterPreviewLocale,
  siteFooterPreviewReadyMessageType,
  siteFooterPreviewResizeMessageType,
} from '@/features/site-settings/model/site-footer-preview'
import { resolveSiteSettingReferences } from '@/features/site-settings/model/site-settings-config'

export function SiteFooterPreviewFrame(props: { initialLocale: AppLocale }) {
  const [locale, setLocale] = useState(props.initialLocale)
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const resolvedSettings = useMemo(
    () => (settings ? resolveSiteSettingReferences(settings) : null),
    [settings],
  )
  const footer = useMemo(
    () => (resolvedSettings ? normalizeSiteFooter({ locale, settings: resolvedSettings }) : null),
    [locale, resolvedSettings],
  )

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) {
        return
      }

      if (!isSiteFooterPreviewMessage(event.data)) {
        return
      }

      setLocale(resolveSiteFooterPreviewLocale(event.data.locale))
      setSettings(event.data.settings)
    }

    window.addEventListener('message', handleMessage)
    window.parent.postMessage(
      {
        type: siteFooterPreviewReadyMessageType,
      },
      window.location.origin,
    )

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  useEffect(() => {
    const sendHeight = () => {
      window.parent.postMessage(
        {
          height: Math.ceil(document.documentElement.scrollHeight),
          type: siteFooterPreviewResizeMessageType,
        },
        window.location.origin,
      )
    }

    sendHeight()

    if (typeof ResizeObserver === 'undefined') {
      return
    }

    const observer = new ResizeObserver(sendHeight)

    observer.observe(document.body)

    return () => {
      observer.disconnect()
    }
  }, [footer])

  return (
    <div className="min-h-56 bg-background text-foreground" data-testid="site-footer-preview-frame">
      {footer ? (
        <SiteFooterLayout className="mt-0" footer={footer} />
      ) : (
        <div className="page-frame flex min-h-56 items-center justify-center py-10 text-sm text-muted-foreground">
          {settings ? 'No usable footer content yet.' : 'Waiting for footer data.'}
        </div>
      )}
    </div>
  )
}
