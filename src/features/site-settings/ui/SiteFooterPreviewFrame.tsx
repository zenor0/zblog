'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

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

type PreviewMedia = {
  alt?: null | string
  id?: number | string
  url?: null | string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasMediaURL(value: unknown): value is PreviewMedia & { url: string } {
  return isRecord(value) && typeof value.url === 'string' && value.url.length > 0
}

function getMediaReferenceID(value: unknown): null | string {
  if (typeof value === 'number' || typeof value === 'string') {
    return String(value)
  }

  if (!isRecord(value)) {
    return null
  }

  const id = value.id

  if (typeof id === 'number' || typeof id === 'string') {
    return String(id)
  }

  return null
}

function getFooterBrandLogo(settings: SiteSettings): unknown {
  const footer = settings.footer as null | SiteSettings['footer'] | undefined

  return footer?.brand?.logo
}

function withHydratedFooterLogo(settings: SiteSettings, logo: PreviewMedia): SiteSettings {
  const footer = settings.footer as null | SiteSettings['footer'] | undefined

  if (!footer) {
    return settings
  }

  return {
    ...settings,
    footer: {
      ...footer,
      brand: {
        ...footer.brand,
        logo: logo as NonNullable<SiteSettings['footer']>['brand']['logo'],
      },
    },
  }
}

async function fetchPreviewMedia(id: string): Promise<null | PreviewMedia> {
  try {
    const response = await fetch(`/api/media/${encodeURIComponent(id)}?depth=0`, {
      credentials: 'same-origin',
    })

    if (!response.ok) {
      return null
    }

    const media = (await response.json()) as unknown

    return hasMediaURL(media) ? media : null
  } catch {
    return null
  }
}

export function SiteFooterPreviewFrame(props: { initialLocale: AppLocale }) {
  const [locale, setLocale] = useState(props.initialLocale)
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [hydratedSettings, setHydratedSettings] = useState<null | {
    base: SiteSettings
    settings: SiteSettings
  }>(null)
  const mediaCacheRef = useRef(new Map<string, Promise<null | PreviewMedia>>())
  const resolvedSettings = useMemo(
    () => (settings ? resolveSiteSettingReferences(settings) : null),
    [settings],
  )
  const previewSettings =
    resolvedSettings && hydratedSettings?.base === resolvedSettings
      ? hydratedSettings.settings
      : resolvedSettings
  const footer = useMemo(
    () => (previewSettings ? normalizeSiteFooter({ locale, settings: previewSettings }) : null),
    [locale, previewSettings],
  )

  useEffect(() => {
    if (!resolvedSettings) {
      setHydratedSettings(null)
      return
    }

    let ignore = false
    const logo = getFooterBrandLogo(resolvedSettings)

    setHydratedSettings({
      base: resolvedSettings,
      settings: resolvedSettings,
    })

    if (hasMediaURL(logo)) {
      return
    }

    const mediaID = getMediaReferenceID(logo)

    if (!mediaID || typeof fetch !== 'function') {
      return
    }

    let mediaPromise = mediaCacheRef.current.get(mediaID)

    if (!mediaPromise) {
      mediaPromise = fetchPreviewMedia(mediaID)
      mediaCacheRef.current.set(mediaID, mediaPromise)
    }

    mediaPromise.then((media) => {
      if (ignore || !media) {
        return
      }

      setHydratedSettings({
        base: resolvedSettings,
        settings: withHydratedFooterLogo(resolvedSettings, media),
      })
    })

    return () => {
      ignore = true
    }
  }, [resolvedSettings])

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
